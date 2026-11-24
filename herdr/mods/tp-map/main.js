// tp epics map: the project's epic graph as tp's dashboard lays it out
// (`tp epic layout --json`: one band per milestone, epics by layer and column,
// dependency curves, the critical path), read-only and live. Pinch (or Cmd/Ctrl and
// the wheel, or − / + / Fit) zooms, two fingers or a press and drag pan; click an epic to light up its
// dependencies and read it (description, acceptance, why it waits) in a panel.
// Opened from the tab bar's Epics button; see ./tp.js.
import { View, div, PathBuilder, Background } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { theme, settings, props, watchFolder, checking, exec } from "herdr";
import { tpRaw, serial, MONO, detailPanel, panelBox, dragPan } from "./tp.js";

const PAD = 16, NW = 118, NH = 22, GX = 12, ROW = 46, BAND_HEAD = 26;

// Paths are drawn in percent of the canvas they fill, so a zoom (which only
// resizes the canvas) needs no new paths.
const pctX = (g) => (x) => `${(x / g.width) * 100}%`;
const pctY = (g) => (y) => `${(y / g.height) * 100}%`;

// One dependency curve, from the bottom middle of epic a to the top middle of b.
function curve(p, g, a, b) {
  const X = pctX(g), Y = pctY(g);
  const x0 = a.x + NW / 2, y0 = a.y + NH, x1 = b.x + NW / 2, y1 = b.y;
  const bend = Math.max(10, Math.abs(y1 - y0) / 2);
  return p.move_to(X(x0), Y(y0)).cubic_bezier_to(X(x1), Y(y1), X(x0), Y(y0 + bend), X(x1), Y(y1 - bend));
}

// The same curve as `n` straight pieces: n + 1 points, in layout units.
function polyline(a, b, n) {
  const x0 = a.x + NW / 2, y0 = a.y + NH, x1 = b.x + NW / 2, y1 = b.y;
  const bend = Math.max(10, Math.abs(y1 - y0) / 2), ay = y0 + bend, by = y1 - bend;
  const pts = [[x0, y0]];
  for (let i = 1; i <= n; i++) {
    const t = i / n, u = 1 - t;
    const x = (u * u * u + 3 * u * u * t) * x0 + (3 * u * t * t + t * t * t) * x1;
    const y = u * u * u * y0 + 3 * u * u * t * ay + 3 * u * t * t * by + t * t * t * y1;
    pts.push([x, y]);
  }
  return pts;
}

// How finely the curves are cut, by zoom: the first of these at or above the
// scale. Each level is built once, on first use.
const LODS = [0.25, 0.5, 1, 2];
const lodOf = (s) => LODS.find(r => r >= s) ?? 2;
// The edges are cut into square cells (layout units); a render paints only the
// cells in view. A frame's cost grows with the straight pieces it paints, and
// 3671 curves drawn whole held a big map at about 28 fps while panning.
const CELL = 800;
// The most curve pieces one frame paints at full detail; past it, the coarse level.
const MAX_PIECES = 15000;

// An epic's colour: tp's `status`, what its dashboard map colours by (tp ≥ 1.28).
// An older tp has only the lifecycle `state`: a planned epic whose dependencies are
// all done counts as ready.
const statusOf = (n, ready) => n.status ?? (n.state === "planned" ? (ready ? "ready" : "blocked") : n.state);

function look(t, s) {
  return ({
    ready: [t.ansi2, "can start"], blocked: [t.dim, "blocked"], held: [t.blocked, "held by a condition"],
    waiting: [t.dim, "milestone not open yet"], moot: [t.dim, "moot"],
    claimed: [t.working, "claimed"], specced: [t.accent, "specced"], in_progress: [t.working, "in progress"],
    done: [t.done, "done"],
  })[s] ?? [t.dim, s ?? "?"];
}

// What hangs on an epic, as tp's drawer counts it.
const downstream = (n) => {
  const d = n.downstream;
  return d ? `${d.dependents_open} of ${d.dependents} dependents open · longest chain ${d.longest_chain}` : null;
};

export default class Map extends View {
  init(_props, cx) {
    this.root = props()?.root ?? null;
    this.data = null;
    this.error = null;
    this.scale = null;      // null: fit the width on first draw
    this.ox = 0; this.oy = 0;   // the viewport's offset into the scaled map
    this.selected = null;
    this.size = { width: 800, height: 600 };
    this.watches = [];
    if (checking()) return;
    if (!this.root) { this.error = "No project: open this view from the tab bar."; return; }
    this.reload(cx);
    cx.timer.every(30000, (cx) => this.reload(cx));
    cx.timer.every(16, (cx) => this.pump(cx));
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

  // One load at a time (a burst of watch events is one more load). The same
  // layout as last time changes nothing: no parse, no new paths.
  reload(cx) {
    this.load ??= serial(async (cx) => {
      try {
        const raw = await tpRaw(["epic", "layout", "--json"], this.root);
        this.error = null;
        if (raw === this.raw) return;
        this.data = JSON.parse(raw);
        this.raw = raw;
        // The graph file may have changed: refetch the open epic's text, showing
        // the old one until the new one is in.
        const old = this.epics, sel = this.selected;
        this.epics = new globalThis.Map();
        if (sel && old?.has(sel)) this.epics.set(sel, old.get(sel));
        if (sel) this.fetchEpic(sel, cx, true);
        this.refresh();
      } catch (e) {
        const m = String(e.message ?? e);
        this.error = /unknown command|layout/.test(m) && !this.data ? `This tp has no \`tp epic layout\` yet: ${m}` : m;
      } finally { cx.notify(); }
    });
    cx.spawn((cx) => this.load(cx));
  }

  // The layout carries no text: the selected epic's description, acceptance and
  // the why of each dependency come from the graph file, one epic at a time
  // through jq. A big project's file is megabytes: parsing it here held up the
  // views' renders ("interrupted").
  fetchEpic(id, cx, again) {
    if (!again && this.epics?.has(id)) return;
    const args = ["-c", "--arg", "id", id, ".epics[] | select(.id == $id) | {description, acceptance, tags, condition, depends_on}", `${this.root}/.tp/epics.json`];
    cx.spawn(async (cx) => {
      let r;
      try { r = await exec("jq", args); } catch { try { r = await exec("/opt/homebrew/bin/jq", args); } catch { return; } }
      try { this.epics.set(id, JSON.parse(r.stdout.trim().split("\n")[0] || "{}")); } catch { return; }
      cx.notify();
    });
  }

  // Select an epic (or nothing) and fetch its text.
  select(id, cx) {
    this.selected = id;
    if (id) this.fetchEpic(id, cx);
    this.refresh();
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
    const count = new globalThis.Map();
    for (const n of d.nodes ?? []) count.set(n.milestone, (count.get(n.milestone) ?? 0) + 1);
    const bandBoxes = bands.map((b, i) => ({ b, i, n: count.get(b.milestone) ?? 0, top: y(b.from_layer) - head, bottom: y(b.to_layer) + NH + 10 }));
    return { at, width, height, bandBoxes };
  }

  // The map's visible area: the pane under the header, less the detail panel.
  pane() { return { width: this.size.width, height: this.size.height - 34 }; }
  view() {
    const p = this.pane(), box = this.selected ? panelBox(p) : null;
    return !box ? p : box.side ? { width: p.width - box.w, height: p.height } : { width: p.width, height: p.height - box.h };
  }

  // Where a pointer event is in the visible area, in layout px.
  local(e) {
    const z = Number(settings()?.zoom) || 1;
    const p = e.local_position ?? { x: e.position.x - (e.bounds?.x ?? 0), y: e.position.y - (e.bounds?.y ?? 0) };
    return { x: p.x / z, y: p.y / z };
  }

  // While the map pans or zooms, its edges are drawn coarse (three straight
  // pieces a curve), which keeps a frame within budget; 150 ms after the last
  // move they are drawn in full again.
  moved(cx) {
    this.movedAt = Date.now();
    this.moving = true;
    if (this.settling) return;
    this.settling = true;
    const check = (cx) => {
      if (Date.now() - this.movedAt < 150) { cx.timer.after(60, check); return; }
      this.settling = false;
      this.moving = false;
      this.refresh();
      cx.notify();
    };
    cx.timer.after(160, check);
  }

  // Scale by k around (px, py) in the visible area, so that point stays put.
  zoomAt(k, px, py) {
    const s = this.scale ?? 1, next = Math.max(0.15, Math.min(2, s * k)), r = next / s;
    this.ox = (this.ox + px) * r - px;
    this.oy = (this.oy + py) * r - py;
    this.scale = next;
    this.refresh();
  }

  // The scale the layout is made at. From 15/26 up the layout is the same at any
  // zoom (band heads and hold marks have their full size); below, it goes in
  // steps, never above the zoom, so a pinch rebuilds only when it crosses one.
  gscale(s) {
    if (s >= 0.58) return 1;
    return 0.58 * Math.pow(0.87, Math.ceil(Math.log(s / 0.58) / Math.log(0.87)));
  }

  // After the data, the scale or the selection change (from an event or a task, never
  // from render): fit the first time the size is known, then lay the map out and
  // build its paths. The paths are in percent of the canvas, so a zoom only
  // resizes the canvas; a selection builds only its own few curves. A render (one
  // per pointer move while panning) only places them.
  refresh() {
    if (!this.data) return;
    if (this.scale == null) { if (!this.sized) return; this.scale = this.fit(this.geometry()); }
    const qs = this.gscale(this.scale), b = this.built;
    if (!b || b.data !== this.data || b.qs !== qs) this.built = this.build(qs);
    // The edges are built a slice at a time by pump(): the coarse level first, so
    // the map soon has its curves, then the zoom's level once the map stops moving.
    this.want = ["fast", ...(this.moving ? [] : [lodOf(this.scale)])];
    const sel = this.selected;
    if (this.chosenFor !== sel || this.chosenOf !== this.built) {
      this.chosenFor = sel; this.chosenOf = this.built;
      this.chosen = sel ? this.buildChosen(this.built, sel) : null;
    }
  }

  // The layout at the current scale: the one refresh() made, unless that is stale.
  layout() {
    if (!this.data) return null;
    const qs = this.gscale(this.scale ?? 1), b = this.built;
    return b && b.data === this.data && b.qs === qs ? b.g : this.geometry(qs);
  }

  // Everything that depends on the data and the layout's scale alone.
  build(qs) {
    const d = this.data, g = this.geometry(qs), edges = d.edges ?? [], nodes = d.nodes ?? [];
    const ins = new globalThis.Map(), outs = new globalThis.Map();
    const push = (m, k, v) => { const l = m.get(k); if (l) l.push(v); else m.set(k, [v]); };
    for (const e of edges) { push(ins, e.to, e.from); push(outs, e.from, e.to); }
    const doneIds = new Set(nodes.filter(n => n.state === "done").map(n => n.id));
    const claimed = nodes.filter(n => ["claimed", "specced", "in_progress"].includes(n.state)).length;
    return {
      data: d, qs, g, ins, outs, doneIds, counts: { done: doneIds.size, claimed },
      lods: new globalThis.Map(), boxes: this.buildBoxes(g, ins, doneIds, qs),
    };
  }

  // The scale that fits the map's width (whole: its height too) in the pane.
  fit(g, whole) {
    const w = this.size.width - 4, h = this.size.height - 80;
    const s = whole ? Math.min(w / g.width, h / g.height) : w / g.width;
    return Math.max(0.15, Math.min(1, s));
  }

  header(t, g) {
    const nodes = this.data?.nodes ?? [];
    const { done, claimed } = this.built?.counts ?? { done: 0, claimed: 0 };
    const btn = (id, label, fn) => div().id(id).px(7).h(22).flex().items_center().rounded(5).text_size(12).text_color(t.muted)
      .cursor_pointer().hover(s => s.bg(t.hover).text_color(t.foreground)).on_click((_e, cx) => { fn(); cx.notify(); }).child(label);
    const s = this.scale ?? 1;
    return h_flex().h(34).px(10).gap(8).items_center().flex_none().border_b(1).border_color(t.border)
      .child(div().text_size(12.5).text_color(t.foreground).child("Epics"))
      .when(nodes.length > 0, el => el.child(div().text_size(11).text_color(t.muted)
        .child(`${nodes.length} epics · ${done} done · ${claimed} started · ${(this.data.bands ?? []).length} milestones`)))
      .child(div().flex_1())
      .when(Boolean(g), el => el
        .child(btn("zoom-out", "−", () => { const v = this.view(); this.zoomAt(1 / 1.25, v.width / 2, v.height / 2); }))
        .child(div().text_size(11).text_color(t.dim).w(38).flex().justify_center().child(`${Math.round(s * 100)}%`))
        .child(btn("zoom-in", "+", () => { const v = this.view(); this.zoomAt(1.25, v.width / 2, v.height / 2); }))
        .child(btn("zoom-fit", "Fit", () => { this.scale = this.fit(g, true); this.ox = 0; this.oy = 0; this.refresh(); })));
  }

  canvas(t, g) {
    const s = this.scale ?? 1;
    const edges = this.data.edges ?? [];
    const sel = this.selected;

    // Edges by kind: plain, critical, and the selected epic's, built in refresh()
    // (outside render: a render that built them beside another busy pane ran out
    // of time, "interrupted"). Only the edge cells that reach into the view are
    // painted, plain first so the critical ones draw on top, then the selected
    // epic's; while the map moves, at the coarse level.
    const v = this.view(), m = 200;
    const vx0 = this.ox / s, vy0 = this.oy / s, vx1 = (this.ox + v.width) / s, vy1 = (this.oy + v.height) / s;
    const lods = this.built?.lods;
    const inView = (cs) => (cs ?? []).filter((c) => !(c.x1 < vx0 || c.x0 > vx1 || c.y1 < vy0 || c.y0 > vy1));
    const fast = inView(lods?.get("fast"));
    let cells = this.moving ? fast : inView(lods?.get(lodOf(s)));
    // A wide view of a big map holds too many pieces at full detail for one frame
    // (siyakat's whole map on a 3440 px screen: "interrupted"): it stays coarse.
    if (!cells.length || cells.reduce((n, c) => n + c.n, 0) > MAX_PIECES) cells = fast;
    const plain = [], critical = [];
    for (const c of cells) for (const kp of c.paths) (kp[0] === "critical" ? critical : plain).push(kp);
    const strokes = [...plain, ...critical, ...(this.chosen ? [["chosen", this.chosen]] : [])];
    const faint = Math.max(0.08, Math.min(0.35, 120 / Math.max(1, edges.length)));
    const stroke = { plain: Background.solid(t.dim).opacity(sel ? faint / 2 : faint), critical: Background.solid(t.blocked).opacity(0.75), chosen: Background.solid(t.accent) };
    // Labels only from 45% up, and only for the epics in view (and a margin).
    const labels = s < 0.45 ? [] : [...g.at.values()].filter(({ x, y }) => (x + NW) * s >= this.ox - m && x * s <= this.ox + v.width + m
      && (y + NH) * s >= this.oy - m && y * s <= this.oy + v.height + m);
    const at = sel ? g.at.get(sel) : null;
    const boxes = this.built?.boxes ?? { fills: [], borders: [], holds: [] };
    const paint = (path, bg) => window.paint_path(path, bg).absolute().top(0).left(0).size_full();

    // The epics are a few prebuilt paths (fill, border and hold mark, one per
    // colour), not hundreds of elements: a render then costs the same at any
    // zoom, which keeps panning smooth. The viewport finds the epic under a click (hit()).
    return div().relative().w(g.width * s).h(g.height * s).flex_none()
      .children(g.bandBoxes.map(({ b, i, n, top, bottom }) => div().absolute().left(0).top(top * s).w(g.width * s).h((bottom - top) * s)
        .bg(i % 2 ? t.surface : t.background).border_t(1).border_color(t.border)
        // The milestone's name stays readable at any zoom.
        .child(div().absolute().left(PAD * s).top(2).text_size(Math.max(9.5, 11 * Math.min(s, 1))).text_color(t.muted)
          .child(`${b.milestone} · ${n}`))))
      .children(strokes.map(([k, path]) => paint(path, stroke[k])))
      .children(boxes.fills.map(([st, done, path]) => paint(path, Background.solid(look(t, st)[0]).opacity(done ? 0.25 : 0.4))))
      .children(boxes.borders.map(([st, path]) => paint(path, Background.solid(look(t, st)[0]))))
      // A started epic that is also held or blocked: a mark at its right end.
      .children(boxes.holds.map(([hold, path]) => paint(path, Background.solid(hold === "held" ? t.blocked : t.dim))))
      .when(Boolean(at), el => el.child(div().absolute().left(at.x * s - 1).top(at.y * s - 1).w(NW * s + 2).h(NH * s + 2)
        .rounded(3).border(2).border_color(t.foreground)))
      .children(labels.map(({ n, x, y }) => div().absolute().left(x * s + 5 * s).top(y * s).w((NW - 10) * s).h(NH * s)
        .flex().items_center().truncate().font_family(MONO).text_size(10.5 * s).text_color(t.foreground).child(n.id)));
  }

  // The epic boxes as built paths, grouped by colour: fills [status, done, path],
  // borders [status, path], hold marks [hold, path]. At most CHUNK boxes a path.
  // In percent of the canvas, like the curves.
  buildBoxes(g, incoming, doneIds, s) {
    const CHUNK = 200, nodes = [...g.at.values()];
    const groups = new globalThis.Map(), built = [];
    const add = (key, make, rect) => {
      let o = groups.get(key);
      if (!o || o.n >= CHUNK) { o = { key, p: make(), n: 0 }; groups.set(key, o); built.push(o); }
      o.p = o.p.add_polygon(rect, true);
      o.n++;
    };
    const X = pctX(g), Y = pctY(g);
    const rect = (x0, y0, x1, y1) => [[X(x0), Y(y0)], [X(x1), Y(y0)], [X(x1), Y(y1)], [X(x0), Y(y1)]];
    for (const { n, x, y } of nodes) {
      const st = statusOf(n, (incoming.get(n.id) ?? []).every(f => doneIds.has(f)));
      const done = n.state === "done";
      const box = rect(x, y, x + NW, y + NH);
      add(`fill|${st}|${done ? 1 : 0}`, () => PathBuilder.fill(), box);
      add(`border|${st}`, () => PathBuilder.stroke(1), box);
      if (n.hold) add(`hold|${n.hold}`, () => PathBuilder.fill(), rect(x + NW - Math.max(4 / s, 8), y, x + NW, y + NH));
    }
    const out = { fills: [], borders: [], holds: [] };
    for (const o of built) {
      const [kind, a, b] = o.key.split("|"), path = o.p.build();
      if (kind === "fill") out.fills.push([a, b === "1", path]);
      else if (kind === "border") out.borders.push([a, path]);
      else out.holds.push([a, path]);
    }
    return out;
  }

  // The epic under a pointer event in the viewport, if any.
  hit(e) {
    const g = this.layout(), s = this.scale ?? 1, p = this.local(e);
    const mx = (this.ox + p.x) / s, my = (this.oy + p.y) / s;
    for (const { n, x, y } of g.at.values()) if (mx >= x && mx <= x + NW && my >= y && my <= y + NH) return n.id;
    return null;
  }

  // Builds the edge levels refresh() asked for, a few ms each tick: built in one
  // go, a big project's levels (3678 curves, tens of thousands of pieces) ran a
  // callback past its time and the view stopped as "interrupted". A level drawn
  // before it is done would miss curves, so the canvas uses only finished ones.
  pump(cx) {
    const b = this.built;
    if (!b) return;
    const t0 = Date.now();
    while (Date.now() - t0 < 8) {
      if (this.job?.b !== b) {
        const k = (this.want ?? []).find((k) => !b.lods.has(k));
        if (k == null) { this.job = null; return; }
        this.job = { b, k, lod: k === "fast" ? 0 : k, pieces: k === "fast" ? 3 : null, i: 0, cells: new globalThis.Map() };
      }
      if (!this.strokeStep(this.job, t0)) return;
      b.lods.set(this.job.k, this.strokeCells(this.job));
      this.job = null;
      cx.notify();
    }
  }

  // The edges at one level of detail, cut into cells: each curve becomes about
  // one straight piece per 40 screen px (at the level's scale), and each piece
  // goes to the cell its middle is in. A cell keeps the box its pieces cover,
  // for the view test, and its paths as [kind, path]; at most CHUNK pieces a path.
  // `pieces`, when given, is the count for every curve (the in-motion level).
  // Goes on from edge `job.i` until 8 ms after t0; true once every edge is in.
  strokeStep(job, t0) {
    const CHUNK = 1500, width = { plain: 1, critical: 1.6 };
    const g = job.b.g, edges = job.b.data.edges ?? [], lod = job.lod, cells = job.cells;
    const X = pctX(g), Y = pctY(g);
    for (; job.i < edges.length; job.i++) {
      if (job.i % 64 === 0 && Date.now() - t0 >= 8) return false;
      const e = edges[job.i];
      const a = g.at.get(e.from), b = g.at.get(e.to);
      if (!a || !b) continue;
      const kind = e.critical ? "critical" : "plain";
      const len = Math.hypot(b.x - a.x, b.y - a.y - NH) * lod;
      const pts = polyline(a, b, job.pieces ?? Math.max(2, Math.min(24, Math.ceil(len / 40))));
      for (let i = 1; i < pts.length; i++) {
        const [px, py] = pts[i - 1], [qx, qy] = pts[i];
        const key = `${Math.floor((px + qx) / 2 / CELL)},${Math.floor((py + qy) / 2 / CELL)}`;
        let c = cells.get(key);
        if (!c) cells.set(key, c = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity, n: 0, open: {}, done: [] });
        c.n++;
        c.x0 = Math.min(c.x0, px, qx); c.x1 = Math.max(c.x1, px, qx);
        c.y0 = Math.min(c.y0, py, qy); c.y1 = Math.max(c.y1, py, qy);
        let o = c.open[kind];
        if (!o || o.n >= CHUNK) { o = c.open[kind] = { p: PathBuilder.stroke(width[kind]), n: 0, last: null }; c.done.push([kind, o]); }
        // A piece that goes on from the last one in this path continues the line.
        if (o.last !== pts[i - 1]) o.p = o.p.move_to(X(px), Y(py));
        o.p = o.p.line_to(X(qx), Y(qy));
        o.last = pts[i];
        o.n++;
      }
    }
    return true;
  }

  strokeCells(job) {
    return [...job.cells.values()].map(c => ({ x0: c.x0, y0: c.y0, x1: c.x1, y1: c.y1, n: c.n, paths: c.done.map(([k, o]) => [k, o.p.build()]) }));
  }

  // The selected epic's curves, in and out: one small path drawn over the rest.
  buildChosen(b, sel) {
    const at = b.g.at, me = at.get(sel);
    if (!me) return null;
    let p = PathBuilder.stroke(2), n = 0;
    for (const id of b.ins.get(sel) ?? []) { const a = at.get(id); if (a) { p = curve(p, b.g, a, me); n++; } }
    for (const id of b.outs.get(sel) ?? []) { const c = at.get(id); if (c) { p = curve(p, b.g, me, c); n++; } }
    return n ? p.build() : null;
  }

  // The selected epic: what it is, why it waits on what, and what it frees.
  detail(t, g) {
    const a = g.at.get(this.selected);
    if (!a) return null;
    const n = a.n, e = this.epics?.get(n.id) ?? {}, b = this.built;
    const ins = b?.ins.get(n.id) ?? [], outs = b?.outs.get(n.id) ?? [], doneIds = b?.doneIds ?? new Set();
    const [color, word] = look(t, statusOf(n, ins.every(f => doneIds.has(f))));
    const whys = (e.depends_on ?? []).filter(d => d.why).map(d => `${d.id}: ${d.why}`).join("\n\n");
    const d = {
      id: n.id, title: n.title ?? e.title, color, word: `${word}${n.hold ? ` · ${n.hold}` : ""}`,
      meta: [
        [n.milestone, (e.tags ?? []).length ? e.tags.join(", ") : null, e.condition ? "condition" : null].filter(Boolean).join(" · "),
        downstream(n),
      ].filter(Boolean),
      links: [["After", ins], ["Frees", outs]],
      sections: [["Description", e.description], ["Acceptance", e.acceptance], ["Why it waits", whys]],
    };
    // A linked epic is selected and brought to the middle of the view.
    const pick = (id, cx) => {
      const b = g.at.get(id);
      if (!b) return;
      const s = this.scale ?? 1, v = this.view();
      this.ox = (b.x + NW / 2) * s - v.width / 2;
      this.oy = (b.y + NH / 2) * s - v.height / 2;
      this.select(id, cx);
    };
    return detailPanel(t, this.pane(), d, pick, () => { this.selected = null; this.refresh(); });
  }

  render() {
    const t = theme();
    const g = this.layout();
    if (g) {
      // Keep the map in view: no panning past its edges.
      const s = this.scale ?? 1, view = this.view();
      this.ox = Math.max(0, Math.min(this.ox, g.width * s - view.width));
      this.oy = Math.max(0, Math.min(this.oy, g.height * s - view.height));
    }
    const root = v_flex().id("root").size_full().bg(t.surface).text_color(t.foreground).relative()
      // Reported in window pixels; the layout's px are scaled by the app's zoom.
      .on_size_change((size, cx) => {
        const z = Number(settings()?.zoom) || 1;
        this.size = { width: size.width / z, height: size.height / z };
        const first = !this.sized;
        this.sized = true;
        if (first) this.refresh();
        cx.notify();
      })
      .child(this.header(t, g))
      .child(this.withDetail(t, g, !g ? v_flex().flex_1().items_center().justify_center().px(20).text_size(12.5).text_color(t.muted)
          .child(this.error ?? "Loading the epic map…")
        // Our own viewport, so a zoom can keep the point under the fingers in place:
        // a pinch (or Cmd/Ctrl and the wheel) zooms there; two fingers, the wheel or
        // a press and drag pan. A click (no drag) selects the epic under it (again:
        // clears it), or clears on empty space.
        : dragPan(div().id("map-view").flex_1().min_h(0).relative().overflow_hidden(), this,
            (dx, dy, cx) => { this.ox -= dx; this.oy -= dy; this.moved(cx); },
            (e, cx) => { const id = this.hit(e); this.select(id && id !== this.selected ? id : null, cx); })
          .on_pinch((e, cx) => { this.moved(cx); const p = this.local(e); this.zoomAt(1 + e.delta, p.x, p.y); cx.notify(); })
          .on_scroll_wheel((e, cx) => {
            cx.stop_propagation();
            this.moved(cx);
            const d = e.delta_lines ? { x: e.delta_lines.x * 40, y: e.delta_lines.y * 40 } : e.delta;
            if (e.modifiers?.platform || e.modifiers?.control) { const p = this.local(e); this.zoomAt(Math.exp(d.y / 300), p.x, p.y); }
            else { this.ox -= d.x; this.oy -= d.y; }
            cx.notify();
          })
          .child(this.canvas(t, g).absolute().left(-this.ox).top(-this.oy))));
    return root;
  }

  // The map, and beside or under it the selected epic.
  withDetail(t, g, map) {
    const panel = g && this.selected ? this.detail(t, g) : null;
    if (!panel) return map;
    // h_flex centres its children: stretch them, or the map gets no height.
    const side = panelBox(this.pane()).side;
    return (side ? h_flex().items_stretch() : v_flex()).flex_1().min_h(0).min_w(0)
      .child(v_flex().flex_1().min_h(0).min_w(0).child(map))
      .child(panel);
  }
}
