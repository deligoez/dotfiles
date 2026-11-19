// Shared by the tp-board, tp-steps and tp-map mods (each links this file as ./tp.js).
// A view shows one tp spec of one project, read-only:
// - the project is props().root, set by the tab bar's button when it opens the pane;
// - the spec is picked in the header, remembered per project in shared "tp.spec";
//   by default the most active one (wip tasks, then open tasks, then newest file);
// - the data is `tp export --file <spec> --compact`, reloaded whenever the spec's
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

// What each task is now, as tp's dashboard sorts them:
// done; wip; ready (open, every dependency done, epic startable); waiting.
export function classify(data) {
  const tasks = data?.tasks ?? [];
  const byId = new Map(tasks.map(t => [t.id, t]));
  const epicHeld = (data?.resume?.blockers ?? []).some(b => b.code === "epic-blocked");
  const dependents = new Map();
  for (const t of tasks) for (const d of t.depends_on ?? []) {
    if (!dependents.has(d)) dependents.set(d, []);
    dependents.get(d).push(t.id);
  }
  return tasks.map(t => {
    const open = (t.depends_on ?? []).filter(d => byId.get(d)?.status !== "done");
    const lane = t.status === "done" ? "done" : t.status === "wip" ? "wip" : open.length || epicHeld ? "waiting" : "ready";
    const unblocks = (dependents.get(t.id) ?? []).filter(d => byId.get(d)?.status !== "done").length;
    let line;
    if (lane === "done") line = t.closed_at ? `closed ${ago(t.closed_at)}` : "done";
    else if (lane === "wip") line = [t.started_at ? `running ${minutes(t.started_at)} min` : "running", t.estimate_minutes ? `estimate ${t.estimate_minutes} min` : null].filter(Boolean).join(", ");
    else if (lane === "ready") line = unblocks ? `unblocks ${unblocks}` : "ready";
    else line = open.length ? `after ${open.join(", ")}` : "waits on its epic";
    return { ...t, lane, line, unblocks };
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
export function card(t, task, opts = {}) {
  const color = laneColor(t, task.lane);
  const tip = [task.title, task.acceptance].filter(Boolean).join("\n\n");
  return h_flex().id(`card-${task.id}`).when(opts.width != null, el => el.w(opts.width)).when(opts.height != null, el => el.h(opts.height))
    .flex_none().min_w(0).rounded(7)
    .border(1).border_color(t.border).bg(t.raised).overflow_hidden().tooltip(tip.slice(0, 600))
    .child(div().w(3).flex_none().self_stretch().bg(color))
    .child(v_flex().flex_1().min_w(0).px(9).py(7).gap(3)
      .child(h_flex().gap(6).items_start()
        .child(div().flex_1().min_w(0).text_size(12.5).text_color(task.lane === "done" ? t.muted : t.foreground).max_h(36).overflow_hidden().child(task.title ?? task.id))
        .when(task.lane === "done", el => el.child(div().flex_none().text_size(12).text_color(t.done).child("✓"))))
      .child(div().text_size(10.5).font_family(MONO).text_color(t.dim).truncate().child(task.id))
      .child(div().text_size(11).text_color(task.lane === "wip" ? t.working : t.muted).truncate().child(task.line)));
}

// A spec with wip tasks first, then the most recently written task file.
const score = (f) => (f.tasks?.wip ? 1 : 0);

// The shared part of a view: the project, the spec picker, loading and watching.
// A subclass draws `body(t, cx)` under the header; `this.data` is the export.
export class TpView extends View {
  init(_props, cx) {
    this.root = props()?.root ?? null;
    this.files = null;   // tp export --list rows, with mtime
    this.data = null;
    this.error = null;
    this.picking = false;
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
    this.reload(cx);
  }

  loadList(cx) {
    if (!this.root) { this.error = "No project: open this view from the tab bar."; cx.notify(); return; }
    cx.spawn(async (cx) => {
      try {
        const list = (await tp(["export", "--list"], this.root)).files ?? [];
        const st = list.length ? await exec("stat", ["-f", "%m", ...list.map(f => f.path)], { cwd: this.root }) : null;
        const times = (st?.stdout ?? "").trim().split("\n").map(Number);
        list.forEach((f, i) => { f.mtime = times[i] || 0; });
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
        this.data = await tp(["export", "--file", spec, "--compact"], this.root);
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
        : this.body(t, cx));
  }

  body() { return div(); }
}
