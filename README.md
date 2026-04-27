# Dotfiles

Personal workstation setup for macOS, powered by **Ansible** + **Chezmoi**.

HJKL-first, vim-style, layered keybinding system. Every shortcut lives in **one file** (`home/dot_config/karabiner.edn`).

Idempotent — safe to run multiple times.

## Install

On a fresh macOS installation:

```bash
curl -fsSL dotfiles.deligoz.me | zsh
```

Skip macOS system preferences if you don't want them changed:

```bash
curl -fsSL dotfiles.deligoz.me | zsh -s -- --skip-tags macos-defaults
```

## Re-apply

```bash
dotfiles                              # full setup
dotfiles --skip-tags macos-defaults   # skip macOS preferences
dotfiles --tags homebrew              # only Homebrew packages
dotfiles --tags chezmoi               # only dotfile configs
dotfiles --tags karabiner             # only compile karabiner.edn → karabiner.json (via Goku)
dotfiles --tags ssh                   # only SSH key setup
```

## Keybinding Reference

Two layers, each triggered by holding a "trigger" key. **Tap** the trigger = its
normal behavior; **hold** = enters the layer.

```
BASE:    Normal typing
         Caps tap = Esc       |  Caps hold  = NAV layer
         Space tap = Space    |  Space hold = WINDOW layer
```

Single source: [`home/dot_config/karabiner.edn`](home/dot_config/karabiner.edn) →
Goku → `~/.config/karabiner/karabiner.json` → Karabiner-Elements.

### NAV layer (Caps hold) — Text navigation

Movement and selection that works in *any* text field, system-wide.

| Key            | Action                  | Underlying shortcut |
|----------------|-------------------------|---------------------|
| `H` / `J` / `K` / `L`   | ← / ↓ / ↑ / →           | Arrow keys |
| `B` / `W`      | word backward / forward | Opt+←  / Opt+→ |
| `A` / `E`      | line start / end        | Cmd+←  / Cmd+→ |
| `U` / `D`      | doc start / end         | Cmd+↑  / Cmd+↓ |

Add **Shift** for the *select-while-moving* variant (Shift+H/J/K/L = select left/down/up/right, Shift+W = select word, Shift+A = select to line start, etc.).

### WINDOW layer (Space hold) — AeroSpace tiling

All commands invoke the [`aerospace` CLI](https://nikitabobko.github.io/AeroSpace/commands)
via Karabiner's `shell_command`. The AeroSpace TOML has zero keybindings —
`karabiner.edn` is the only place to add new ones.

| Key                        | Action |
|----------------------------|--------|
| `H` / `J` / `K` / `L`              | focus left / down / up / right (crosses monitors) |
| `Shift` + `H` / `J` / `K` / `L`    | move window left / down / up / right |
| `Alt` + `H` / `L`                  | resize width −/+ 100px |
| `Alt` + `J` / `K`                  | resize height +/− 100px |
| `1`–`9`, `0`                       | switch to workspace 1-10 |
| `Shift` + `1`–`9`, `Shift` + `0`   | move window to workspace 1-10 |
| `F`                        | fullscreen toggle |
| `Shift` + `F`              | floating ↔ tiling toggle |
| `S`                        | split orientation toggle (horizontal/vertical) |
| `Q`                        | close window |
| `Tab`                      | last focused workspace |
| `R`                        | reload AeroSpace config |

## Architecture

```
                    home/dot_config/karabiner.edn  ← the only place to edit
                                  │
                            chezmoi apply
                                  │
                                  ▼
                    ~/.config/karabiner.edn
                                  │
                              `goku`
                                  │
                                  ▼
                ~/.config/karabiner/karabiner.json
                                  │
                       Karabiner-Elements (auto-reload)
                       │                              │
                       ▼ (key emit)                   ▼ (shell_command)
                 NAV layer                       WINDOW layer
                 ────────                        ────────
                 Esc, arrow keys,               aerospace focus left
                 Opt+arrow, Cmd+arrow,           aerospace move right
                 Shift+arrow (selection)        aerospace workspace 3
                                                 ...
```

## What It Does

The bootstrap script and subsequent `dotfiles` runs execute these steps in order:

| # | Step | Tag | What |
|---|------|-----|------|
| 1 | **macOS Defaults** | `macos-defaults` | Locale, desktop, menu bar, input, Finder, Dock, app settings |
| 2 | **Homebrew** | `homebrew` | Taps, formulae, casks, Mac App Store apps from `Brewfile` |
| 3 | **Default Apps** | `defaults` | Chrome as browser, Ghostty as terminal |
| 4 | **Shell** | `shell` | Fish as default shell |
| 5 | **Chezmoi** | `chezmoi` | Dotfiles + private repo via `.chezmoiexternal.yaml` |
| 6 | **Karabiner** | `karabiner` | Renames profile to `Default` (idempotent), runs `goku` |
| 7 | **SSH** | `ssh` | Ed25519 key generation, macOS Keychain, GitHub upload |

## Manual one-time steps

After `bootstrap.sh` finishes, a few things still need a click:

1. **Karabiner driver approval** — open `Karabiner-Elements.app` once. macOS will prompt to allow the VirtualHIDDevice driver. *System Settings → General → Login Items & Extensions → Driver Extensions → enable Karabiner.*
2. **Karabiner Privileged Daemons** — *System Settings → General → Login Items & Extensions → "Karabiner-Elements Privileged Daemons v2" → ON*
3. **AeroSpace accessibility permission** — open `AeroSpace.app` once. macOS will prompt for Accessibility access. *System Settings → Privacy & Security → Accessibility → enable AeroSpace.*
4. **AdGuard** (`brew install --cask adguard`) — `.pkg` installer needs sudo; not automated.

## Stack

| Category       | Tool |
|----------------|------|
| Shell          | Fish |
| Terminal       | Ghostty |
| Prompt         | Starship |
| Multiplexer    | Zellij |
| Keyboard remap | Karabiner-Elements + [Goku](https://github.com/yqrashawn/GokuRakuJoudo) (EDN → karabiner.json) |
| Window manager | [AeroSpace](https://nikitabobko.github.io/AeroSpace/) (driven by Karabiner via CLI) |
| Editors        | Neovim + PHPStorm/IdeaVim |
| Package mgr    | Homebrew |
| Dotfile mgr    | [Chezmoi](https://www.chezmoi.io) |
| Config mgmt    | Ansible |

## Structure

```
config.yml                 User settings (hostname, timezone, languages)
Brewfile                   Homebrew packages
bootstrap.sh               Entry point for clean installs
home/                      Chezmoi-managed dotfiles
├── dot_aerospace.toml       AeroSpace structural config (no bindings)
├── dot_config/
│   ├── karabiner.edn        ★ Single source of truth for ALL keybindings
│   ├── karabiner/
│   │   └── create_karabiner.json   Seed file with "Default" profile
│   ├── fish/                Shell config
│   ├── ghostty/             Terminal config
│   └── starship.toml        Prompt config
├── dot_gitconfig
└── dot_ssh/
ansible/
├── site.yml                 Main playbook
├── inventory.yml            macOS host
└── roles/macos/tasks/
    ├── main.yml             Orchestrator
    ├── homebrew.yml         brew bundle
    ├── chezmoi.yml          Dotfile deployment
    ├── karabiner.yml        jq-rename profile + run goku
    ├── shell.yml            Fish as default
    ├── ssh.yml              SSH keys
    └── … (locale, desktop, finder, dock, apps, menubar, input)
```

## Adding a new keybinding

Single file edit. Two examples.

**NAV layer** (text shortcut):

```clojure
;; in :rules [:nav ...] block
[:p [:!Cv]]   ;; Caps+P → Cmd+V (paste)
```

**WINDOW layer** (window action via AeroSpace CLI):

```clojure
;; in :rules [:window ...] block
[:c [{:shell_command "/opt/homebrew/bin/aerospace flatten-workspace-tree"}]]
;; Space+C → flatten current workspace's tile tree
```

Then:

```bash
dotfiles --tags chezmoi,karabiner   # chezmoi → goku → done
```

## Customization

Edit `config.yml` before running:

```yaml
hostname: deligoez-mac
timezone: Europe/Istanbul
region: TR
languages:
  - en-TR
  - tr-TR
  - de-DE
```

## License

MIT © Yunus Emre Deligöz
