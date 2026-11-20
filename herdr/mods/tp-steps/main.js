// tp task steps: one spec's tasks in dependency order, read-only and live.
// Step N holds the tasks whose latest dependency is in step N-1; lines join
// each task to the ones it waits on. A pinch (or Cmd/Ctrl and the wheel) zooms,
// a press and drag scrolls; click a card for the task's details.
// Opened from the tab bar's Steps button; see ./tp.js.
import { div, PathBuilder, Background } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { TpView, steps, card, laneColor, dragPan, panelBox } from "./tp.js";

const zoomBy = (view, k) => { view.zoom = Math.max(0.5, Math.min(1.6, (view.zoom ?? 1) * k)); };

export default class Steps extends TpView {
  // The cards' places and the lines between them, kept while the data, zoom, width
  // and theme stay the same: a drag renders once per pointer move and should only
  // move what is already laid out.
  plan(t) {
    const z = this.zoom ?? 1, width = this.bodyWidth(), k = this.planKey;
    if (k && k.data === this.data && k.z === z && k.width === width && k.t === t) return this.planned;
    // A pinch (or Cmd/Ctrl and the wheel) scales everything; more cards fit a row when smaller.
    const PAD = 12 * z, GAP = 10 * z, CARD_H = 76 * z, HEAD_H = 30 * z, STEP_GAP = 16 * z, MIN_W = 210 * z;
    const rows = steps(this.classified);
    // Lay the cards out ourselves: the lines need to know where each one is.
    const avail = Math.max(MIN_W, width - 2 * PAD);
    const cols = Math.max(1, Math.floor((avail + GAP) / (MIN_W + GAP)));
    const w = Math.floor((avail - (cols - 1) * GAP) / cols);
    const at = new Map(), heads = [];
    let y = PAD;
    rows.forEach((row, i) => {
      heads.push({ step: i + 1, y, n: row.length });
      y += HEAD_H;
      row.forEach((task, j) => {
        at.set(task.id, { task, x: PAD + (j % cols) * (w + GAP), y: y + Math.floor(j / cols) * (CARD_H + GAP) });
      });
      y += Math.ceil(row.length / cols) * (CARD_H + GAP) - GAP + STEP_GAP;
    });

    // One stroke per color: a line into a task takes the task's color, dimmed.
    const lines = new Map();
    for (const { task, x, y } of at.values()) for (const d of task.depends_on ?? []) {
      const from = at.get(d);
      if (!from) continue;
      const color = laneColor(t, task.lane);
      const p = lines.get(color) ?? PathBuilder.stroke(1.2);
      const x0 = from.x + w / 2, y0 = from.y + CARD_H, x1 = x + w / 2, y1 = y, bend = Math.max(18, (y1 - y0) / 2);
      lines.set(color, p.move_to(x0, y0).cubic_bezier_to(x1, y1, x0, y0 + bend, x1, y1 - bend));
    }
    this.planKey = { data: this.data, z, width, t };
    this.planned = { z, PAD, CARD_H, HEAD_H, w, at, heads, height: y + PAD, lines: [...lines].map(([color, p]) => [color, p.build()]) };
    return this.planned;
  }

  body(t) {
    const { z, PAD, CARD_H, HEAD_H, w, at, heads, height, lines } = this.plan(t);
    // Scrolled by us, not by gpui, so a press and drag can move it too: the wheel
    // or two fingers scroll, Cmd/Ctrl and the wheel zoom. Kept within the content.
    const box = this.selected ? panelBox({ width: this.size.width, height: this.size.height - 34 }) : null;
    const viewH = this.size.height - 34 - (box && !box.side ? box.h : 0);
    this.sy = Math.max(0, Math.min(this.sy ?? 0, height - viewH));
    // Only the cards in view (and a margin) are drawn.
    const top = this.sy - 200, bottom = this.sy + viewH + 200;
    const shown = [...at.values()].filter(({ y }) => y + CARD_H >= top && y <= bottom);
    return dragPan(div().id("steps").flex_1().min_h(0).relative().overflow_hidden(), this, (_dx, dy) => { this.sy -= dy; })
      .on_pinch((e, cx) => { zoomBy(this, 1 + e.delta); cx.notify(); })
      .on_scroll_wheel((e, cx) => {
        cx.stop_propagation();
        const dy = e.delta_lines ? e.delta_lines.y * 40 : e.delta.y;
        if (e.modifiers?.platform || e.modifiers?.control) zoomBy(this, Math.exp(dy / 300));
        else this.sy -= dy;
        cx.notify();
      })
      .child(div().absolute().left(0).top(-this.sy).w_full().h(height)
        .children(lines.map(([color, path]) =>
          window.paint_path(path, Background.solid(color).opacity(0.45)).absolute().top(0).left(0).size_full()))
        .children(heads.filter(h => h.y + HEAD_H >= top && h.y <= bottom).map(h => h_flex().absolute().left(PAD).top(h.y).h(HEAD_H - 6).gap(8).items_center()
          .child(div().text_size(12 * z).text_color(t.foreground).child(`Step ${h.step}`))
          .child(div().text_size(11 * z).text_color(t.dim).child(h.step === 1 ? "needs no other task" : `after step ${h.step - 1}`))))
        .children(shown.map(({ task, x, y }) =>
          div().absolute().left(x).top(y).child(card(t, task, { width: w, height: CARD_H, s: z, view: this })))));
  }
}
