// tp task steps: one spec's tasks in dependency order, read-only and live.
// Step N holds the tasks whose latest dependency is in step N-1; lines join
// each task to the ones it waits on. A pinch (or Cmd/Ctrl and the wheel) zooms;
// click a card for the task's details.
// Opened from the tab bar's Steps button; see ./tp.js.
import { div, PathBuilder, Background } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { TpView, classify, steps, card, laneColor } from "./tp.js";

const zoomBy = (view, k) => { view.zoom = Math.max(0.5, Math.min(1.6, (view.zoom ?? 1) * k)); };

export default class Steps extends TpView {
  body(t) {
    const rows = steps(classify(this.data));
    // A pinch (or Cmd/Ctrl and the wheel) scales everything; more cards fit a row when smaller.
    const z = this.zoom ?? 1;
    const PAD = 12 * z, GAP = 10 * z, CARD_H = 76 * z, HEAD_H = 30 * z, STEP_GAP = 16 * z, MIN_W = 210 * z;
    // Lay the cards out ourselves: the lines need to know where each one is.
    const avail = Math.max(MIN_W, this.bodyWidth() - 2 * PAD);
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
    const height = y + PAD;

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

    return v_flex().id("steps").flex_1().min_h(0).overflow_y_scroll()
      .on_pinch((e, cx) => { zoomBy(this, 1 + e.delta); cx.notify(); })
      .on_scroll_wheel((e, cx) => {
        if (!(e.modifiers?.platform || e.modifiers?.control)) return;
        cx.stop_propagation();
        zoomBy(this, Math.exp((e.delta_lines ? e.delta_lines.y * 40 : e.delta.y) / 300));
        cx.notify();
      })
      .child(div().relative().w_full().h(height).flex_none()
        .children([...lines].map(([color, p]) =>
          window.paint_path(p.build(), Background.solid(color).opacity(0.45)).absolute().top(0).left(0).size_full()))
        .children(heads.map(h => h_flex().absolute().left(PAD).top(h.y).h(HEAD_H - 6).gap(8).items_center()
          .child(div().text_size(12 * z).text_color(t.foreground).child(`Step ${h.step}`))
          .child(div().text_size(11 * z).text_color(t.dim).child(h.step === 1 ? "needs no other task" : `after step ${h.step - 1}`))))
        .children([...at.values()].map(({ task, x, y }) =>
          div().absolute().left(x).top(y).child(card(t, task, { width: w, height: CARD_H, s: z, view: this })))));
  }
}
