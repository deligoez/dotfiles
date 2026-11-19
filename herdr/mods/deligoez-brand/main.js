// The sidebar's top row: the shipped workspace-chrome brand row, with the
// Herdr icon and name replaced by the deligoez logo. The footer stays on
// workspace-chrome; its icons are reused from there.
import { View, div, svg } from "gpui-kit";
import { h_flex } from "gpui-base";
import { theme, run, window, shared, setShared, layout } from "herdr";

function find(node, id) {
  if (node?.id === id) return node;
  for (const child of node?.children ?? []) {
    const found = find(child, id);
    if (found) return found;
  }
  return null;
}

// The sidebar's rail goes by its width, not a flag: dragging its edge narrows it too.
const narrow = () => (find(layout(), "sidebar")?.size?.px ?? Infinity) < 160;

// To the rail (on macOS wide enough for the traffic lights), or back to the width it had.
function toggleSidebar() {
  const width = find(layout(), "sidebar")?.size?.px;
  if (!narrow()) setShared("sidebar.width", width);
  setShared("sidebar.collapsed", !narrow());
  run("layout.resize", { id: "sidebar", px: narrow() ? (shared("sidebar.width") ?? 268) : window()?.platform === "macos" ? 76 : 44 });
}

// logo.svg is 376x249; keep that ratio.
const LOGO_H = 32;
const LOGO_TOP = 11;
const LOGO_W = Math.round(LOGO_H * 376 / 249);

export default class DeligoezBrand extends View {
  button(id, label, action) {
    const t = theme();
    return div().id(id).size(26).flex_none().flex().items_center().justify_center().rounded(6).text_color(t.muted).hover(s => s.bg(t.hover).text_color(t.foreground))
      .on_mouse_down("left", (_e, cx) => cx.stop_propagation()).on_click(action).child(label);
  }
  render() {
    const t = theme();
    const collapsed = narrow();
    const macos = window()?.platform === "macos";
    // macOS draws its traffic lights over this row unless the window is fullscreen.
    const lights = macos && !window()?.fullscreen;
    const logo = () => svg("mods/deligoez-brand/logo.svg").w(LOGO_W).h(LOGO_H).text_color(t.foreground);
    if (collapsed) {
      // On the macOS rail the logo takes the row when the traffic lights don't; with them, they
      // fill it and the agents list's » unfolds the sidebar. Elsewhere the rail is too narrow
      // for both, so the toggle keeps it.
      return h_flex().size_full().bg(t.chrome).justify_center().items_start().pt(LOGO_TOP)
        .when(macos && !lights, el => el.child(logo()))
        .when(!macos, el => el.items_center().pt(0).child(this.button("sidebar-toggle", svg("mods/workspace-chrome/sidebar.svg").size(15), toggleSidebar)));
    }
    return h_flex().size_full().bg(t.chrome).pl(14).pr(10).gap(4).items_center().text_size(13.5)
      .when(lights, el => el.pl(76))
      // Pinned to the top-left gap the original 24px-high logo had (11px down), so it grows right and down.
      .child(h_flex().flex_1().h_full().items_start().pt(LOGO_TOP).child(logo()))
      .child(this.button("search", svg("mods/workspace-chrome/search.svg").size(15), () => run("mod.open", { name: "picker" })))
      .child(this.button("sidebar-toggle", svg("mods/workspace-chrome/sidebar.svg").size(15), toggleSidebar));
  }
}
