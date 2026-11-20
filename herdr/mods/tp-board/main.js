// tp task board: one spec's tasks in four columns (Ready, In progress, Waiting, Done),
// read-only and live; click a card for the task's details. Opened from the tab
// bar's Board button; see ./tp.js.
import { div } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { TpView, card, laneColor } from "./tp.js";

const LANES = [["ready", "Ready"], ["wip", "In progress"], ["waiting", "Waiting"], ["done", "Done"]];

export default class Board extends TpView {
  body(t) {
    const tasks = this.classified;
    // Newest closed first; the others keep the file's order.
    const lane = (id) => {
      const list = tasks.filter(x => x.lane === id);
      return id === "done" ? list.sort((a, b) => Date.parse(b.closed_at ?? 0) - Date.parse(a.closed_at ?? 0)) : list;
    };
    const head = (id, label, n) => h_flex().gap(6).items_center().px(2).pb(2)
      .child(div().size(7).rounded(4).bg(laneColor(t, id)))
      .child(div().text_size(11.5).text_color(t.muted).child(label))
      .child(div().text_size(11).text_color(t.dim).child(String(n)));
    // Side by side when there is room, else one column under the other.
    const wide = this.bodyWidth() >= 640;
    if (!wide) return v_flex().id("board").flex_1().min_h(0).overflow_y_scroll().p(10).gap(14)
      .children(LANES.map(([id, label]) => { const list = lane(id); return v_flex().gap(6)
        .child(head(id, label, list.length)).children(list.map(x => card(t, x, { view: this }))); }));
    return h_flex().flex_1().min_h(0).p(10).gap(10).items_start()
      .children(LANES.map(([id, label]) => { const list = lane(id); return v_flex().id(`lane-${id}`).flex_1().min_w(0).h_full().gap(6)
        .child(head(id, label, list.length))
        .child(v_flex().id(`lane-body-${id}`).flex_1().min_h(0).overflow_y_scroll().gap(6)
          .children(list.map(x => card(t, x, { view: this })))
          .when(!list.length, el => el.child(div().text_size(11).text_color(t.dim).px(2).child("—")))); }));
  }
}
