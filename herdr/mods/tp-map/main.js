// tp epics map: the project's epic graph as tp's dashboard lays it out
// (`tp epic layout --json`: one band per milestone, epics by layer and column,
// dependency curves, the critical path), read-only and live. Zoom with − / + / Fit
// or Cmd/Ctrl and the wheel;
// click an epic to light up its dependencies and see it in the bar below.
// Opened from the tab bar's Epics button; see ./tp.js.
import { View, div, PathBuilder, Background } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { theme, settings, props, watchFolder, checking } from "herdr";
import { tp, MONO } from "./tp.js";

const PAD = 16, NW = 118, NH = 22, GX = 12, ROW = 46, BAND_HEAD = 26;

// An epic's colour: tp's derived status when the layout carries one, else its
// lifecycle state, with a planned epic whose dependencies are all done as ready.
function look(t, n, ready) {
  const s = n.status ?? (n.state === "planned" ? (ready ? "ready" : "blocked") : n.state);
  return ({
    done: [t.done, "done"], closed: [t.done, "milestone closed"], claimed: [t.working, "claimed"],
    bound: [t.working, "bound"], ready: [t.ansi2, "can start"], held: [t.blocked, "held by a condition"],
    blocked: [t.dim, "blocked"], specced: [t.accent, "specced"],
  })[s] ?? [t.dim, s ?? "?"];
}

export default class Map extends View {
  init(_props, cx) {
    this.root = props()?.root ?? null;
    this.data = null;
    this.error = null;
    this.scale = null;      // null: fit the width on first draw
    this.selected = null;
    this.size = { width: 800, height: 600 };
    this.watches = [];
    if (checking()) return;
    if (!this.root) { this.error = "No project: open this view from the tab bar."; return; }
    this.reload(cx);
    cx.timer.every(30000, (cx) => this.reload(cx));
    // .tp/ holds the epic graph; the task files feed each epic's lifecycle.
    for (const folder of [`${this.root}/.tp`, `${this.root}/spec`]) {
      const loop = { stopped: false, handle: null };
      loop.cancel = () => { loop.stopped = true; loop.handle?.cancel(); };
      this.watches.push(loop);
      cx.spawn(async (cx) => {
        while (!loop.stopped) {
          loop.handle = watchFolder(folder);
          let paths;
          try { paths = await loop.handle; } catch { return; }
          if (loop.stopped || !paths.length) return;
          this.reload(cx);
        }
      });
    }
  }

  async close() { for (const w of this.watches) w.cancel(); }

  reload(cx) {
    if (this.loading) return;
    this.loading = true;
    cx.spawn(async (cx) => {
      try {
        this.data = await tp(["epic", "layout", "--json"], this.root);
        this.error = null;
      } catch (e) {
        const m = String(e.message ?? e);
        this.error = /unknown command|layout/.test(m) && !this.data ? `This tp has no \`tp epic layout\` yet: ${m}` : m;
      }
      this.loading = false;
      cx.notify();
    });
  }

  // Where everything goes at scale 1: rows by layer, a header above each milestone band.
  // A band's header keeps at least 15 screen px for its name, whatever the zoom.
  geometry(s = 1) {
    const d = this.data, bands = d.bands ?? [], head = Math.max(BAND_HEAD, 15 / s);
    const bandOf = (layer) => Math.max(0, bands.findIndex(b => layer >= b.from_layer && layer <= b.to_layer));
    const y = (layer) => PAD + layer * ROW + (bandOf(layer) + 1) * head;
    const x = (col) => PAD + col * (NW + GX);
    const at = new globalThis.Map();
    for (const n of d.nodes ?? []) at.set(n.id, { n, x: x(n.col), y: y(n.layer) });
    const width = x((d.columns ?? 1)) + PAD;
    const height = y(Math.max(0, (d.layers ?? 1) - 1)) + NH + PAD;
    const bandBoxes = bands.map((b, i) => ({ b, i, top: y(b.from_layer) - head, bottom: y(b.to_layer) + NH + 10 }));
    return { at, width, height, bandBoxes };
  }

  // The scale that fits the map's width (whole: its height too) in the pane.
  fit(g, whole) {
    const w = this.size.width - 4, h = this.size.height - 80;
    const s = whole ? Math.min(w / g.width, h / g.height) : w / g.width;
    return Math.max(0.15, Math.min(1, s));
  }

  header(t, g) {
    const nodes = this.data?.nodes ?? [];
    const done = nodes.filter(n => n.state === "done").length, claimed = nodes.filter(n => n.state === "claimed").length;
    const btn = (id, label, fn) => div().id(id).px(7).h(22).flex().items_center().rounded(5).text_size(12).text_color(t.muted)
      .cursor_pointer().hover(s => s.bg(t.hover).text_color(t.foreground)).on_click((_e, cx) => { fn(); cx.notify(); }).child(label);
    const s = this.scale ?? 1;
    return h_flex().h(34).px(10).gap(8).items_center().flex_none().border_b(1).border_color(t.border)
      .child(div().text_size(12.5).text_color(t.foreground).child("Epics"))
      .when(nodes.length > 0, el => el.child(div().text_size(11).text_color(t.muted)
        .child(`${nodes.length} epics · ${done} done · ${claimed} claimed · ${(this.data.bands ?? []).length} milestones`)))
      .child(div().flex_1())
      .when(Boolean(g), el => el
        .child(btn("zoom-out", "−", () => { this.scale = Math.max(0.15, s / 1.25); }))
        .child(div().text_size(11).text_color(t.dim).w(38).flex().justify_center().child(`${Math.round(s * 100)}%`))
        .child(btn("zoom-in", "+", () => { this.scale = Math.min(2, s * 1.25); }))
        .child(btn("zoom-fit", "Fit", () => { this.scale = this.fit(g, true); })));
  }

  canvas(t, g) {
    const s = this.scale ?? 1;
    const nodes = [...g.at.values()];
    const edges = this.data.edges ?? [];
    const doneIds = new Set(nodes.filter(a => a.n.state === "done").map(a => a.n.id));
    const incoming = new globalThis.Map();
    for (const e of edges) { if (!incoming.has(e.to)) incoming.set(e.to, []); incoming.get(e.to).push(e.from); }
    const ready = (id) => (incoming.get(id) ?? []).every(f => doneIds.has(f));
    const sel = this.selected;

    // Edges by kind: plain, critical, and the selected epic's. One path holds at
    // most CHUNK curves: a single path with thousands of them doesn't draw.
    const CHUNK = 200, width = { plain: 1, critical: 1.6, chosen: 2 };
    const strokes = [];   // [kind, PathBuilder]
    const open = {};
    for (const e of edges) {
      const a = g.at.get(e.from), b = g.at.get(e.to);
      if (!a || !b) continue;
      const kind = sel && (e.from === sel || e.to === sel) ? "chosen" : e.critical ? "critical" : "plain";
      if (!open[kind] || open[kind].n >= CHUNK) { open[kind] = { p: PathBuilder.stroke(width[kind]), n: 0 }; strokes.push([kind, open[kind]]); }
      const x0 = (a.x + NW / 2) * s, y0 = (a.y + NH) * s, x1 = (b.x + NW / 2) * s, y1 = b.y * s;
      const bend = Math.max(10 * s, Math.abs(y1 - y0) / 2);
      open[kind].p = open[kind].p.move_to(x0, y0).cubic_bezier_to(x1, y1, x0, y0 + bend, x1, y1 - bend);
      open[kind].n++;
    }
    // Plain first, so the critical path and the chosen epic's lines draw on top.
    const order = { plain: 0, critical: 1, chosen: 2 };
    strokes.sort((x, y) => order[x[0]] - order[y[0]]);
    // Thousands of plain lines turn into a grey sheet: the more there are, the fainter each.
    const faint = Math.max(0.08, Math.min(0.35, 120 / Math.max(1, edges.length)));
    const stroke = { plain: Background.solid(t.dim).opacity(sel ? faint / 2 : faint), critical: Background.solid(t.blocked).opacity(0.75), chosen: Background.solid(t.accent) };
    const label = s >= 0.45;

    return div().id("map-canvas").relative().w(g.width * s).h(g.height * s).flex_none()
      .on_click((_e, cx) => { this.selected = null; cx.notify(); })
      .children(g.bandBoxes.map(({ b, i, top, bottom }) => div().absolute().left(0).top(top * s).w(g.width * s).h((bottom - top) * s)
        .bg(i % 2 ? t.surface : t.background).border_t(1).border_color(t.border)
        // The milestone's name stays readable at any zoom.
        .child(div().absolute().left(PAD * s).top(2).text_size(Math.max(9.5, 11 * Math.min(s, 1))).text_color(t.muted)
          .child(`${b.milestone} · ${nodes.filter(a => a.n.milestone === b.milestone).length}`))))
      .children(strokes.map(([k, o]) =>
        window.paint_path(o.p.build(), stroke[k]).absolute().top(0).left(0).size_full()))
      .children(nodes.map(({ n, x, y }) => {
        const [color, word] = look(t, n, ready(n.id));
        const on = sel === n.id;
        return div().id(`epic-${n.id}`).absolute().left(x * s).top(y * s).w(NW * s).h(NH * s).rounded(4 * s)
          .bg(color + (n.state === "done" ? "40" : "66")).border(on ? 2 : 1).border_color(on ? t.foreground : color)
          .px(5 * s).flex().items_center().overflow_hidden().cursor_pointer()
          .tooltip(`${n.id}\n${n.title ?? ""}\n${word} · ${n.milestone}`)
          .on_click((_e, cx) => { cx.stop_propagation(); this.selected = on ? null : n.id; cx.notify(); })
          .when(label, el => el.child(div().truncate().font_family(MONO).text_size(10.5 * s).text_color(t.foreground).child(n.id)));
      }));
  }

  // The selected epic: what it is and what it waits on and frees.
  detail(t, g) {
    const a = g.at.get(this.selected);
    if (!a) return null;
    const n = a.n, edges = this.data.edges ?? [];
    const ins = edges.filter(e => e.to === n.id).map(e => e.from), outs = edges.filter(e => e.from === n.id).map(e => e.to);
    const doneIds = new Set((this.data.nodes ?? []).filter(x => x.state === "done").map(x => x.id));
    const [color, word] = look(t, n, ins.every(f => doneIds.has(f)));
    return v_flex().flex_none().border_t(1).border_color(t.border).bg(t.raised).px(12).py(8).gap(3)
      .child(h_flex().gap(8).items_center()
        .child(div().size(8).rounded(4).bg(color))
        .child(div().font_family(MONO).text_size(11.5).text_color(t.foreground).child(n.id))
        .child(div().text_size(11).text_color(t.muted).child(`${word} · ${n.milestone}`)))
      .child(div().text_size(12.5).text_color(t.foreground).child(n.title ?? ""))
      .child(div().text_size(11).text_color(t.muted).truncate()
        .child(`after: ${ins.length ? ins.join(", ") : "nothing"}   ·   frees: ${outs.length ? outs.join(", ") : "nothing"}`));
  }

  render() {
    const t = theme();
    if (this.data && this.scale == null && this.sized) this.scale = this.fit(this.geometry());
    const g = this.data ? this.geometry(this.scale ?? 1) : null;
    return v_flex().id("root").size_full().bg(t.surface).text_color(t.foreground)
      // Reported in window pixels; the layout's px are scaled by the app's zoom.
      .on_size_change((size, cx) => {
        const z = Number(settings()?.zoom) || 1;
        this.size = { width: size.width / z, height: size.height / z };
        this.sized = true;
        cx.notify();
      })
      .child(this.header(t, g))
      .child(!g ? v_flex().flex_1().items_center().justify_center().px(20).text_size(12.5).text_color(t.muted)
          .child(this.error ?? "Loading the epic map…")
        // Cmd or Ctrl with the wheel (or a pinch's scroll) zooms; a plain wheel pans.
        : div().id("map-scroll").flex_1().min_h(0).overflow_scroll()
          .on_scroll_wheel((e, cx) => {
            if (!(e.modifiers?.platform || e.modifiers?.control)) return;
            cx.stop_propagation();
            const dy = e.delta_lines?.y ? e.delta_lines.y * 20 : e.delta.y;
            this.scale = Math.max(0.15, Math.min(2, (this.scale ?? 1) * Math.exp(dy / 300)));
            cx.notify();
          })
          .child(this.canvas(t, g)))
      .when(Boolean(g && this.selected), el => el.child(this.detail(t, g)));
  }
}
