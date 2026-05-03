# Dotfiles Project

Ansible + Chezmoi managed macOS workstation, designed for an HJKL-first
keyboard-driven workflow. One-liner bootstrap:

```
curl -fsSL setup.deligoz.me | zsh
```

## Project Goal

Single-config-file declarative setup for a Mac. Every keybinding lives in
ONE place, every package in ONE place, every macOS pref in ONE place. No
GUI clicks where avoidable. Repo is **macOS-only** — Linux/Omarchy plan
was dropped to keep scope tight.

## Target Stack

| Category       | Old                 | New                                            |
|----------------|---------------------|------------------------------------------------|
| Shell          | Fish                | Fish (staying)                                 |
| Terminal       | iTerm2              | Ghostty                                        |
| Prompt         | ?                   | Starship                                       |
| Multiplexer    | tmux                | Zellij                                         |
| Keyboard remap | Karabiner+Superkey  | Karabiner-Elements + Goku (+ Superkey for Seek)|
| Window manager | Moom + Raycast      | AeroSpace (driven via Karabiner shell_command) |
| Editor         | -                   | Neovim + PHPStorm/IdeaVim                      |

## Repo Structure

```
bootstrap.sh             # curl-piped entry point: deps, clone, run Ansible
config.yml               # User config (hostname, timezone, languages)
Brewfile                 # All Homebrew packages
composer-packages.yml    # Global composer packages (laravel/installer, valet, …)
go-tools.yml             # `go install` tools
npm-packages.yml         # Global npm packages

ansible/
  site.yml               # Master playbook
  inventory.yml          # macOS host (localhost)
  roles/macos/tasks/
    main.yml             #   Orchestrator (controls tag flow)
    homebrew.yml         #   Taps + formulae + casks + MAS apps
    locale.yml           #   Languages, region, time, metric, keyboards
    desktop.yml          #   Widgets, appearance, animations, Siri, wallpaper
    menubar.yml          #   Bluetooth/WiFi/Clock visibility
    input.yml            #   Auto-correct, trackpad, key repeat
    finder.yml           #   Extensions, view, save dialogs, .DS_Store
    dock.yml             #   Apps, icon size, animations, hot corners
    apps.yml             #   TextEdit, Safari (best-effort)
    defaults.yml         #   Default browser/terminal
    shell.yml            #   Fish as default shell
    chezmoi.yml          #   Deploy dotfiles
    karabiner.yml        #   Profile rename + Goku compile + simple_modifications
    ssh.yml              #   ed25519 + Keychain + GitHub upload
    codegraff.yml        #   Codegraff/muonry symlinks
    composer-packages.yml#   Composer global require for missing packages
    npm-packages.yml     #   npm i -g for missing packages
    skills.yml           #   Claude agent skills install
    rp-bootstrap.yml     #   rp clone of repos in private manifest

home/                    # Chezmoi source — deployed under ~/
  dot_aerospace.toml     # AeroSpace structural config (NO bindings)
  dot_config/
    karabiner.edn        # ★ SINGLE SOURCE OF TRUTH for ALL keybindings
    karabiner/
      create_karabiner.json # Seed JSON (chezmoi create_ → write-once)
    fish/                # Shell config, aliases, paths
    ghostty/             # Terminal config + themes
    starship.toml
    rp/symlink_manifest.yaml.tmpl   # Symlink to private rp manifest
  dot_codegraff/         # Symlink template to private credentials
  intelephense/          # Symlink template to private licence
  dot_gitconfig
  dot_ssh/

archive/                 # Legacy shell scripts (reference only)
docs/                    # Article drafts, screenshots (gitignored)
```

`docs/` is in `.gitignore` — work-in-progress writing.

## Workflow

1. Claude proposes minimal change (config or Ansible task)
2. User pushes via Claude, pulls + runs on second machine to test
3. User reports back: worked / error / wrong behavior
4. Iterate

User runs from any machine via the `dotfiles` zsh function, which
`git pull`s + invokes `ansible-playbook` with `--ask-become-pass`. Tags:

```
dotfiles                                    # full run
dotfiles --tags homebrew                    # only Brewfile
dotfiles --tags chezmoi                     # only dotfiles deployment
dotfiles --tags karabiner                   # rename profile + goku + jq patch
dotfiles --tags chezmoi,karabiner           # config edit → recompile cycle
dotfiles --tags composer                    # composer global require
dotfiles --tags ssh                         # SSH key + GitHub
dotfiles --skip-tags macos-defaults         # skip system pref churn
```

## Keybinding Architecture (the critical part)

### Single source of truth: `home/dot_config/karabiner.edn`

Every keybinding in the system is one line in this file. Goku (an EDN
DSL → karabiner.json compiler) turns it into `~/.config/karabiner/karabiner.json`,
which Karabiner-Elements auto-reloads. AeroSpace's TOML has zero bindings;
window operations are driven by Karabiner emitting `shell_command "aerospace …"`.

### Layer triggers

```
BASE:   Normal typing
        Caps tap  = Esc           Caps hold = NAV layer
        RCmd hold = WINDOW layer  Spacebar  = always literal space

NAV:    Caps hold + key
        HJKL arrows, W/B word, A/E line, U/D doc
        + Shift = selection variants

WIN:    Right Cmd hold + key  →  shell_command "aerospace ..."
        HJKL focus, Shift+HJKL move, Alt+HJKL resize
        1-9 workspaces, F fullscreen, Q close, …
```

### Two non-obvious workarounds (don't break these)

**1. `Shift+Caps` parallel trigger.** Goku's `:layers` shorthand for caps
only matches bare caps_lock. Without an extra rule, `Shift+Caps+H`
falls through to the OS, which toggles real Caps Lock state and types
uppercase. A manual manipulator in `:main` adds a parallel trigger:
`from: Shift+caps_lock → set nav=1` (Shift mandatory, OS never sees
the caps_lock).

**2. `Right Command → F19` via Simple Modifications, not Complex.**
Karabiner's complex_modifications can't host a layer trigger on a
modifier key — the modifier flag still leaks to the OS, no matter what
the manipulator does. We tried five approaches (direct `:layers`,
manual manipulator, F19 remap inside Complex, simlayers, etc.) and
only one works:

- `karabiner.edn` defines `:window {:key :f19}` as the layer trigger.
- The Ansible `karabiner.yml` task patches `karabiner.json` after Goku
  runs, adding a **simple_modification** entry `right_command → f19`.
- Simple Modifications run at the HID layer, BEFORE Complex
  Modifications. So Right Command becomes F19 at the kernel boundary,
  and Complex Modifications see a real F19 keypress.

This is the trick. If you regenerate karabiner.json some other way
(GUI edit, fresh install), the simple_modifications entry is lost
and the WINDOW layer silently stops working. Always run
`dotfiles --tags karabiner` after touching the file.

### Why not Spacebar?

Earlier attempts used `Space hold` for WINDOW. Two failure modes:

- `:layers` (tap-hold) loses the typed space whenever fast typing
  overlaps Space with the next letter. Karabiner suppresses
  `to_if_alone` if any other key was pressed during the hold.
- `:simlayers` (simultaneous) keeps the space char, but it requires
  "press both keys together within ~150ms" UX, not "hold then press" —
  asymmetric with the NAV layer's hold-style.

Right Command is never typed for its character, never used for native
shortcuts in this workflow (Left Cmd handles those), so it can host
a hold-style layer cleanly.

## Manual one-time steps macOS still demands

Cannot be Ansible-d:

1. **App Management for Terminal** — Ansible pauses with a prompt; user
   enables in System Settings → Privacy & Security → App Management.
2. **Karabiner driver activation** — open `Karabiner-Elements.app` once
   to install the VirtualHIDDevice driver, then approve in
   System Settings → General → Login Items & Extensions → Driver Extensions.
3. **Karabiner Privileged Daemons v2** — same Login Items pane, toggle ON.
4. **AeroSpace Accessibility permission** — first launch prompts.
5. **Karabiner per-device "Modify events"** — for each Bluetooth keyboard,
   Karabiner Settings → Devices → toggle ON. (Default OFF for new devices.)
6. **Casks needing sudo .pkg installer** — listed in
   `homebrew.yml` as `manual_casks` (currently: `karabiner-elements`,
   `openvpn-connect`, `adguard`, `parallels@20`). Ansible prints a
   reminder; user runs `brew install --cask <name>` manually.
7. **Safari developer features** — Safari is sandboxed; `defaults write`
   needs Full Disk Access, which Ansible can't grant. The task is marked
   `failed_when: false` and prints a fallback reminder.

## macOS quirks worked around

- **`KeyRepeat` plist type drift.** macOS sometimes stores `KeyRepeat` /
  `InitialKeyRepeat` as float; the `osx_defaults` Ansible module fails on
  type mismatch when it tries to write int. `input.yml` reads the current
  value via shell and uses raw `defaults write -int` to bypass type-check.
  Idempotent via a preceding `defaults read`.
- **Hot corners.** Stored under `com.apple.dock` as
  `wvous-{tl,tr,bl,br}-{corner,modifier}`. Loop sets all eight to `0`
  ("no action") in `dock.yml`.
- **Karabiner profile name.** New Karabiner installs create a profile
  literally called "Default profile" (with a space). Goku's EDN uses
  `:Default` (no space). `karabiner.yml` jq-patches the JSON's
  `profiles[].name` from "Default profile" → "Default" before running
  Goku, idempotently.
- **Composer XDG path.** Composer 2.x defaults to `~/.config/composer/`
  not `~/.composer/`. Fish `paths.fish` adds the XDG path first and
  keeps the legacy entry as fallback.
- **Goku `:Default` profile must exist.** `home/dot_config/karabiner/create_karabiner.json`
  uses chezmoi's `create_` prefix to seed a karabiner.json with a
  `Default` profile on fresh installs only — never overwrites an existing
  user file.

## Window manager: AeroSpace, structural config only

`~/.aerospace.toml` (`home/dot_aerospace.toml`) holds layout/gap/monitor
settings — **no keybindings**. Every shortcut is in `karabiner.edn`,
firing `aerospace …` via `shell_command`. The `aerospace` CLI is a
1:1 mirror of its native binding strings (e.g. `aerospace focus left`),
which makes this clean. No SIP changes needed; AeroSpace works through
Accessibility API only.

Workspace-to-monitor assignment is intentionally **omitted** — workspaces
follow the focused monitor, which behaves better when the laptop
disconnects from external displays.

## External / private context

- `~/.config/rp/manifest.yaml` is a symlink (deployed by chezmoi) to a
  manifest in the private `dotfiles-private` repo. It lists repos, their
  `install` commands (`composer install`, `npm install`, `valet link`,
  …) and `update` commands.
- `rp` (Go CLI from `deligoez/rp`) consumes this manifest:
  `rp bootstrap` (clone), `rp deps` (run install hooks), `rp sync`
  (pull all clean), `rp up` (all of the above).
- Codegraff/intelephense credentials are also private-repo symlinks
  managed by chezmoi templates under `home/dot_codegraff/` and
  `home/intelephense/`.

## Phases / Progress

### Phase 1: Foundation
- [x] Xcode CLI Tools (Homebrew installer auto-pulls)
- [x] Homebrew (`bootstrap.sh`)
- [x] Git configuration (chezmoi)
- [ ] SSH keys (Ansible task exists, manual GitHub upload approval)

### Phase 2: Shell & Terminal
- [ ] Fish (config migration from `archive/`)
- [ ] Ghostty
- [ ] Starship

### Phase 3: Keyboard & Window Management
- [x] Karabiner-Elements + Goku (NAV layer: Caps hold)
- [x] AeroSpace + Karabiner WINDOW layer (Right Cmd hold → aerospace CLI)
- [ ] Superkey (Seek-only role)

### Phase 4: Development Environment
- [x] PHP (shivammathur tap, latest)
- [x] Composer + global packages (laravel/installer, laravel/valet)
- [x] Valet auto-link via rp manifest hook (`valet link` after `composer install`)
- [ ] Zellij
- [ ] Neovim
- [ ] PHPStorm + IdeaVim

### Phase 5: macOS Defaults
- [x] Locale, desktop, menubar, input, finder, dock, apps, hot corners
- [ ] Review remaining settings from `archive/osx.sh`

### Phase 6: Finalization
- [ ] End-to-end idempotent test on clean macOS install
- [ ] `setup.deligoz.me` DNS pointing to bootstrap.sh
- [ ] VitePress site for the writeup

## Notes / lore

### Adding a new keybinding

1. Edit `home/dot_config/karabiner.edn`, add one line to the appropriate
   `:rules` block.
2. `dotfiles --tags chezmoi,karabiner` (deploys EDN, runs Goku, re-applies
   simple_modifications patch).
3. Karabiner-Elements auto-reloads; the binding is live.

For window operations, the binding is a `shell_command` invoking the
`aerospace` CLI — see existing entries for the pattern. AeroSpace's
TOML stays untouched.

### Adding a Brewfile package

Two places:
1. `Brewfile` — for documentation / `brew bundle` runs.
2. `ansible/roles/macos/tasks/homebrew.yml` — append to `desired_taps`,
   `desired_formulae`, or `desired_casks` so the Ansible task sees it.

Casks needing `sudo` for `.pkg` install: also append the cask name to
`manual_casks` (Ansible will print a reminder instead of failing).

### macOS KeyBindings (Ghostty beep fix)

Ghostty emits a system beep on `Cmd+Ctrl+Arrow` (used for split resize)
because macOS has no binding for that combo. Fix: define those keys as
no-op in `~/.config/karabiner/...`? No — for Ghostty specifically the
fix is a `~/Library/KeyBindings/DefaultKeyBinding.dict` no-op entry.
Ref: https://github.com/ghostty-org/ghostty/discussions/5521

### When Karabiner stops responding to Right Cmd

Symptom: Right Cmd alone or Right Cmd + key types the bare key. Most
likely cause: `simple_modifications` patch was lost (Goku regenerated
the JSON without it). Re-run `dotfiles --tags karabiner` to reapply.

If still broken, check Karabiner-Elements > Settings > Devices and
verify "Modify events" is ON for the active keyboard. Bluetooth
keyboards default to OFF.

### When AeroSpace looks like it's "not tiling"

By design. AeroSpace doesn't forcibly retile windows that existed
before it launched — they stay floating until interacted with. Only
windows opened *after* AeroSpace start tile automatically. This
matches yabai/i3 conventions; not a bug.
