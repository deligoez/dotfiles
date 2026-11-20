// Shared by the tp-board, tp-steps and tp-map mods (each links this file as ./tp.js).
// A view shows one tp spec of one project, read-only:
// - the project is props().root, set by the tab bar's button when it opens the pane;
// - the spec is picked in the header, remembered per project in shared "tp.spec";
//   by default the most active one (wip tasks, then open tasks, then newest file);
// - the data is `tp export --file <spec>` (descriptions included), reloaded whenever the spec's
//   folder or the project's .tp/ changes, and on a slow timer as a fallback.
import { View, div } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { exec, home, theme, settings, shared, setShared, props, watchFolder, checking } from "herdr";

export const MONO = "Menlo";

// tp lives in ~/go/bin, which a GUI app's PATH may not have.
export async function tp(args, cwd) {
  let r;
  try { r = await exec("tp", args, { cwd, timeout: 60000 }); }
  catch { r = await exec(`${home()}/go/bin/tp`, args, { cwd, timeout: 60000 }); }
  if (r.code !== 0) throw new Error((r.stderr || r.stdout || `tp exited ${r.code}`).trim().split("\n")[0]);
  return JSON.parse(r.stdout);
}

export const ago = (iso) => {
  const s = (Date.now() - Date.parse(iso)) / 1000;
  if (!(s >= 0)) return "";
  if (s < 90) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min. ago`;
  if (s < 86400) return `${Math.round(s / 3600)} hr. ago`;
  return `${Math.round(s / 86400)} d. ago`;
};
export const minutes = (iso) => Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));

// What each task is now, from tp's own `state` (ready, waits_on_task, waits_on_epic,
// wip, done) and `waits_on` (the undone dependencies, or the epic's): the same
// fields tp's dashboard builds its columns from. Lanes: ready, wip, waiting, done.
const LANE = { ready: "ready", wip: "wip", done: "done", waits_on_task: "waiting", waits_on_epic: "waiting" };

export function classify(data) {
  const tasks = data?.tasks ?? [];
  const byId = new Map(tasks.map(t => [t.id, t]));
  const dependents = new Map();
  for (const t of tasks) for (const d of t.depends_on ?? []) {
    if (!dependents.has(d)) dependents.set(d, []);
    dependents.get(d).push(t.id);
  }
  return tasks.map(t => {
    const lane = LANE[t.state] ?? (t.status === "open" ? "waiting" : t.status);
    const waits = t.waits_on ?? [];
    const unblocks = (dependents.get(t.id) ?? []).filter(d => byId.get(d)?.status !== "done").length;
    let line;
    if (lane === "done") line = t.closed_at ? `closed ${ago(t.closed_at)}` : "done";
    else if (lane === "wip") line = [t.started_at ? `running ${minutes(t.started_at)} min` : "running", t.estimate_minutes ? `estimate ${t.estimate_minutes} min` : null].filter(Boolean).join(", ");
    else if (lane === "ready") line = unblocks ? `unblocks ${unblocks}` : "ready";
    else if (t.state === "waits_on_epic") line = waits.length ? `epic waits on ${waits.join(", ")}` : "waits on its epic";
    else line = waits.length ? `after ${waits.join(", ")}` : "waiting";
    return { ...t, lane, line, unblocks, dependents: dependents.get(t.id) ?? [] };
  });
}

// Step = 1 + the latest step among its dependencies; a task without any is step 1.
export function steps(tasks) {
  const byId = new Map(tasks.map(t => [t.id, t])), memo = new Map();
  const step = (id, seen = new Set()) => {
    if (memo.has(id)) return memo.get(id);
    if (seen.has(id)) return 1;
    seen.add(id);
    const deps = (byId.get(id)?.depends_on ?? []).filter(d => byId.has(d));
    const s = deps.length ? 1 + Math.max(...deps.map(d => step(d, seen))) : 1;
    memo.set(id, s);
    return s;
  };
  const rows = [];
  for (const t of tasks) {
    const s = step(t.id);
    (rows[s - 1] ??= []).push({ ...t, step: s });
  }
  return Array.from(rows, r => r ?? []);
}

export const laneColor = (t, lane) => ({ done: t.done, wip: t.working, ready: t.ansi2, waiting: t.dim })[lane] ?? t.dim;

// One task as a card: a status stripe on the left, the title, the mono id and its status line.
// opts.s scales it (a zoomed view); opts.view (a TpView) makes a click select it.
export function card(t, task, opts = {}) {
  const color = laneColor(t, task.lane), s = opts.s ?? 1, view = opts.view, on = view?.selected === task.id;
  return h_flex().id(`card-${task.id}`).when(opts.width != null, el => el.w(opts.width)).when(opts.height != null, el => el.h(opts.height))
    .flex_none().min_w(0).rounded(7 * s)
    .border(on ? 2 : 1).border_color(on ? t.foreground : t.border).bg(t.raised).overflow_hidden()
    .when(Boolean(view), el => el.cursor_pointer().hover(st => st.bg(t.hover))
      .on_click((_e, cx) => { view.selected = on ? null : task.id; cx.notify(); }))
    .child(div().w(3 * s).flex_none().self_stretch().bg(color))
    .child(v_flex().flex_1().min_w(0).px(9 * s).py(7 * s).gap(3 * s)
      .child(h_flex().gap(6 * s).items_start()
        .child(div().flex_1().min_w(0).text_size(12.5 * s).text_color(task.lane === "done" ? t.muted : t.foreground).max_h(36 * s).overflow_hidden().child(task.title ?? task.id))
        .when(task.lane === "done", el => el.child(div().flex_none().text_size(12 * s).text_color(t.done).child("✓"))))
      .child(div().text_size(10.5 * s).font_family(MONO).text_color(t.dim).truncate().child(task.id))
      .child(div().text_size(11 * s).text_color(task.lane === "wip" ? t.working : t.muted).truncate().child(task.line)));
}

// Markdown-ish text (tp's descriptions use headings, paragraphs and lists) as
// blocks: a heading line stands apart, the rest keeps its lines.
function prose(t, text, key) {
  const blocks = String(text).replace(/\r/g, "").split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
  return v_flex().gap(7).children(blocks.flatMap((b, i) => {
    const m = /^#{1,6}\s+(.*)$/.exec(b.split("\n")[0]);
    if (!m) return [div().id(`${key}-${i}`).text_size(12).text_color(t.foreground).child(b)];
    const rest = b.split("\n").slice(1).join("\n").trim();
    return [div().text_size(11.5).text_color(t.muted).pt(2).child(m[1]),
      ...(rest ? [div().id(`${key}-${i}`).text_size(12).text_color(t.foreground).child(rest)] : [])];
  }));
}

// Where the detail panel goes: beside the content in a wide pane, under it in a
// narrow one. Sizes in layout px.
export function panelBox(size) {
  return size.width >= 700 ? { side: true, w: Math.min(440, Math.round(size.width * 0.4)) } : { side: false, h: Math.round(size.height * 0.45) };
}

// The selected epic or task, scrollable: d = { id, title, color, word, meta: [text],
// links: [[label, [id]]], sections: [[label, text]] }. pick(id) selects a linked
// one, close() clears the selection.
// A long section shows its first CUT characters until "Show all": laying out
// pages of text on every frame ran a big map's render out of time.
const CUT = 1000;
const opened = new Set();   // "<id>/<label>" of the sections shown whole

export function detailPanel(t, size, d, pick, close) {
  const box = panelBox(size);
  const section = ([label, text], i) => {
    const key = `${d.id}/${label}`, whole = opened.has(key) || text.length <= CUT;
    const shown = whole ? text : `${text.slice(0, CUT).replace(/\s+\S*$/, "")} …`;
    return v_flex().gap(4)
      .child(div().text_size(11).text_color(t.dim).child(label))
      .child(prose(t, shown, `sec-${i}`))
      .when(text.length > CUT, el => el.child(div().id(`more-${i}`).text_size(11).text_color(t.accent).cursor_pointer()
        .on_click((_e, cx) => { if (whole) opened.delete(key); else opened.add(key); cx.notify(); })
        .child(whole ? "Show less" : `Show all (${Math.round(text.length / 100) / 10}k characters)`)));
  };
  const chip = (id) => div().id(`link-${id}`).px(6).py(1).rounded(4).bg(t.hover).font_family(MONO).text_size(10.5)
    .text_color(t.foreground).cursor_pointer().hover(s => s.bg(t.selected)).on_click((_e, cx) => { cx.stop_propagation(); pick(id, cx); cx.notify(); }).child(id);
  return v_flex().id("tp-detail").flex_none().bg(t.raised).border_color(t.border)
    .when(box.side, el => el.w(box.w).h_full().border_l(1)).when(!box.side, el => el.h(box.h).w_full().border_t(1))
    .child(h_flex().flex_none().px(12).pt(9).pb(6).gap(8).items_center()
      .child(div().size(8).rounded(4).flex_none().bg(d.color))
      .child(div().min_w(0).truncate().font_family(MONO).text_size(11.5).text_color(t.foreground).child(d.id))
      .child(div().flex_1().min_w(0).truncate().text_size(11).text_color(t.muted).child(d.word ?? ""))
      .child(div().id("tp-detail-close").flex_none().px(6).rounded(4).text_size(13).text_color(t.muted).cursor_pointer()
        .hover(s => s.bg(t.hover).text_color(t.foreground)).on_click((_e, cx) => { close(cx); cx.notify(); }).child("×")))
    .child(v_flex().id("tp-detail-body").flex_1().min_h(0).overflow_y_scroll().px(12).pb(14).gap(10)
      .child(div().text_size(13.5).text_color(t.foreground).child(d.title ?? ""))
      .when((d.meta ?? []).length > 0, el => el.child(v_flex().gap(2)
        .children(d.meta.map(m => div().text_size(11).text_color(t.muted).child(m)))))
      .children((d.links ?? []).filter(([, ids]) => ids.length).map(([label, ids]) => v_flex().gap(4)
        .child(div().text_size(11).text_color(t.dim).child(label))
        .child(h_flex().flex_wrap().gap(4).children(ids.map(chip)))))
      .children((d.sections ?? []).filter(([, text]) => text).map(section)));
}

// A task as the detail panel shows it.
export function taskDetail(t, task) {
  const when = (label, iso) => iso ? `${label} ${new Date(iso).toLocaleString()}` : null;
  return {
    id: task.id, title: task.title, color: laneColor(t, task.lane), word: task.line,
    meta: [
      [task.status, task.estimate_minutes ? `estimate ${task.estimate_minutes} min` : null, (task.tags ?? []).length ? task.tags.join(", ") : null].filter(Boolean).join(" · "),
      when("started", task.started_at), when("closed", task.closed_at),
      task.commit_sha ? `commit ${task.commit_sha}` : null,
      (task.source_sections ?? []).length ? `spec: ${task.source_sections.join(", ")}${task.source_lines ? ` (lines ${task.source_lines})` : ""}` : null,
    ].filter(Boolean),
    links: [["Depends on", task.depends_on ?? []], ["Waits on", (task.waits_on ?? []).filter(w => !(task.depends_on ?? []).includes(w))], ["Unblocks", task.dependents ?? []]],
    sections: [["Description", task.description], ["Acceptance", task.acceptance], ["Closed with", task.closed_reason]],
  };
}

// A spec with wip tasks first, then the one that moved last.
const score = (f) => (f.tasks?.wip ? 1 : 0);

// The shared part of a view: the project, the spec picker, loading and watching.
// A subclass draws `body(t, cx)` under the header; `this.data` is the export.
export class TpView extends View {
  init(_props, cx) {
    this.root = props()?.root ?? null;
    this.files = null;   // tp export --list rows, with mtime (seconds of the last change)
    this.data = null;
    this.error = null;
    this.picking = false;
    this.selected = null;   // the task in the detail panel
    this.size = { width: 800, height: 600 };
    this.watches = [];
    if (checking()) return;
    this.loadList(cx);
    // Durations ("running 12 min") age; a slow tick also covers a missed watch.
    cx.timer.every(30000, (cx) => { this.reload(cx); });
  }

  get spec() {
    const chosen = (shared("tp.spec") ?? {})[this.root];
    if (chosen && this.files?.some(f => f.path === chosen)) return chosen;
    return this.files?.[0]?.path ?? null;
  }

  choose(path, cx) {
    setShared("tp.spec", { ...(shared("tp.spec") ?? {}), [this.root]: path });
    this.picking = false;
    this.data = null;
    this.selected = null;
    this.reload(cx);
  }

  loadList(cx) {
    if (!this.root) { this.error = "No project: open this view from the tab bar."; cx.notify(); return; }
    cx.spawn(async (cx) => {
      try {
        const list = (await tp(["export", "--list"], this.root)).files ?? [];
        // tp ≥ 1.28 says when each spec last moved (`updated_at`); an older tp
        // leaves it out, and the file's mtime stands in.
        if (list.some(f => f.updated_at)) list.forEach(f => { f.mtime = f.updated_at ? Date.parse(f.updated_at) / 1000 : 0; });
        else {
          const st = list.length ? await exec("stat", ["-f", "%m", ...list.map(f => f.path)], { cwd: this.root }) : null;
          const times = (st?.stdout ?? "").trim().split("\n").map(Number);
          list.forEach((f, i) => { f.mtime = times[i] || 0; });
        }
        list.sort((a, b) => score(b) - score(a) || b.mtime - a.mtime);
        this.files = list;
        this.error = list.length ? null : "No tp specs in this project.";
      } catch (e) { this.error = String(e.message ?? e); }
      cx.notify();
      this.reload(cx);
    });
  }

  reload(cx) {
    const spec = this.spec;
    if (!spec || this.loading) return;
    this.loading = true;
    cx.spawn(async (cx) => {
      try {
        this.data = await tp(["export", "--file", spec], this.root);
        this.error = null;
      } catch (e) { this.error = String(e.message ?? e); }
      this.loading = false;
      if (this.watching !== spec) this.watch(spec, cx);
      cx.notify();
    });
  }

  // The spec's folder holds the task file (tp writes it atomically, so any change
  // is a reload); .tp/ holds the epic graph, which can hold or free the spec.
  watch(spec, cx) {
    for (const w of this.watches) w.cancel();
    this.watching = spec;
    const dir = spec.includes("/") ? spec.slice(0, spec.lastIndexOf("/")) : ".";
    this.watches = [`${this.root}/${dir}`, `${this.root}/.tp`].map(folder => {
      const loop = { stopped: false, handle: null };
      loop.cancel = () => { loop.stopped = true; loop.handle?.cancel(); };
      cx.spawn(async (cx) => {
        while (!loop.stopped && this.watching === spec) {
          loop.handle = watchFolder(folder);
          let paths;
          try { paths = await loop.handle; } catch { return; }
          if (loop.stopped || !paths.length) return;
          this.reload(cx);
        }
      });
      return loop;
    });
  }

  async close() { for (const w of this.watches) w.cancel(); }

  header(t) {
    const f = this.files?.find(x => x.path === this.spec);
    const tasks = this.data?.tasks ?? [];
    const count = (s) => tasks.filter(x => x.status === s).length;
    const title = f?.title || this.spec || "…";
    return v_flex().flex_none()
      .child(h_flex().h(34).px(8).gap(8).items_center().border_b(1).border_color(t.border)
        .child(h_flex().id("tp-pick").min_w(0).flex_1().gap(6).items_center().cursor_pointer().rounded(6).px(6).py(3)
          .hover(s => s.bg(t.hover))
          .on_click((_e, cx) => { this.picking = !this.picking; if (this.picking) this.loadList(cx); cx.notify(); })
          .child(div().min_w(0).truncate().text_size(12.5).text_color(t.foreground).child(title))
          .child(div().flex_none().text_size(10).text_color(t.dim).child(this.picking ? "▴" : "▾")))
        .when(tasks.length > 0, el => el.child(div().flex_none().text_size(11).text_color(t.muted)
          .child(`${count("done")} done · ${count("wip")} wip · ${count("open")} open`))))
      .when(this.picking, el => el.child(this.picker(t)));
  }

  picker(t) {
    const files = this.files ?? [];
    return v_flex().id("tp-files").max_h(320).overflow_y_scroll().border_b(1).border_color(t.border).bg(t.popover).py(4)
      .children(files.map(f => h_flex().id(`spec-${f.path}`).px(12).py(5).gap(8).items_center().cursor_pointer()
        .bg(f.path === this.spec ? t.selected : t.popover).hover(s => s.bg(t.hover))
        .on_click((_e, cx) => this.choose(f.path, cx))
        .child(div().size(7).rounded(4).flex_none().bg(f.tasks?.wip ? t.working : f.tasks?.open ? t.ansi2 : t.done))
        .child(v_flex().min_w(0).flex_1()
          .child(div().truncate().text_size(12).text_color(t.foreground).child(f.title || f.path))
          .child(div().truncate().text_size(10.5).font_family(MONO).text_color(t.dim).child(f.path)))
        .child(div().flex_none().text_size(11).text_color(t.muted).child(`${f.tasks?.done ?? 0}/${(f.tasks?.done ?? 0) + (f.tasks?.open ?? 0) + (f.tasks?.wip ?? 0)}`))));
  }

  message(t, text) {
    return v_flex().flex_1().items_center().justify_center().text_size(12.5).text_color(t.muted).child(text);
  }

  render(cx) {
    const t = theme();
    return v_flex().id("root").size_full().bg(t.surface).text_color(t.foreground)
      // Reported in window pixels; the layout's px are scaled by the app's zoom.
      .on_size_change((size, cx) => {
        const z = Number(settings()?.zoom) || 1;
        this.size = { width: size.width / z, height: size.height / z };
        cx.notify();
      })
      .child(this.header(t))
      .child(this.error && !this.data ? this.message(t, this.error)
        : !this.data ? this.message(t, this.files ? "Loading…" : "Looking for tp specs…")
        : this.withDetail(t, cx));
  }

  // The body, and beside or under it the selected task (a click on a card).
  withDetail(t, cx) {
    const task = this.selected ? classify(this.data).find(x => x.id === this.selected) : null;
    if (!task) return this.body(t, cx);
    const pane = { width: this.size.width, height: this.size.height - 34 };
    const box = panelBox(pane);
    const pick = (id) => { if (this.data.tasks?.some(x => x.id === id)) this.selected = id; };
    // h_flex centres its children: stretch them, or the body gets no height.
    return (box.side ? h_flex().items_stretch() : v_flex()).flex_1().min_h(0).min_w(0)
      .child(v_flex().flex_1().min_h(0).min_w(0).child(this.body(t, cx)))
      .child(detailPanel(t, pane, taskDetail(t, task), pick, () => { this.selected = null; }));
  }

  // The width the body gets: the pane's, less a detail panel beside it.
  bodyWidth() {
    const box = this.selected ? panelBox({ width: this.size.width, height: this.size.height - 34 }) : null;
    return box?.side ? this.size.width - box.w : this.size.width;
  }

  body() { return div(); }
}
