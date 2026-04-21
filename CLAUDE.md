# Dotfiles Project

Ansible-based macOS dotfiles with a one-liner bootstrap:

```
curl -fsSL setup.deligoz.me | zsh
```

## Project Goal

HJKL-first, vim-style, layered keybinding system with a modern macOS developer setup. Migrating from legacy shell scripts (in `archive/`) to declarative Ansible roles.

## Target Stack

| Category | Old | New |
|----------|-----|-----|
| Shell | Fish | Fish (staying) |
| Terminal | iTerm2 | Ghostty |
| Prompt | ? | Starship |
| Multiplexer | tmux | Zellij |
| Keyboard | Karabiner + Superkey | Karabiner-Elements (+ Superkey for Seek only) |
| Window Manager | Moom + Raycast | Rift |
| Editor | - | Neovim + PHPStorm/IdeaVim |

## Architecture

```
bootstrap.sh          # Entry point (curl-piped), installs deps, clones repo, runs Ansible
config.yml            # User config (hostname, timezone, region, languages, keyboards)
Brewfile              # All Homebrew packages (~186 items)
ansible/
  site.yml            # Master playbook, loads config.yml
  inventory.yml       # macOS host
  roles/macos/tasks/  # Modular tagged tasks:
    main.yml          #   Orchestrator
    homebrew.yml      #   brew bundle
    locale.yml        #   Languages, region, time format, metric, keyboards
    desktop.yml       #   Widgets, appearance, accessibility, animations, Siri
    menubar.yml       #   Bluetooth, WiFi, Clock visibility
    input.yml         #   Auto-correct, trackpad, key repeat
    finder.yml        #   Extensions, views, search, save dialogs, .DS_Store
    dock.yml          #   Apps, icon size, animations, auto-hide
    apps.yml          #   TextEdit plain text mode
archive/              # Legacy shell scripts (reference only, not executed)
docs/                 # Setup guide, screenshots, recordings (gitignored)
```

## Workflow

1. Claude provides minimal script/task changes
2. User tests on VM
3. User gives feedback (worked / error / change needed)
4. Claude updates docs article if applicable
5. Repeat from 1

## Progress

### Phase 1: Foundation
- [x] Xcode CLI Tools (via Homebrew auto-install)
- [x] Homebrew (bootstrap.sh)
- [x] Git configuration
- [ ] SSH keys

### Phase 2: Shell & Terminal
- [ ] Fish (config migration from archive)
- [ ] Ghostty
- [ ] Starship

### Phase 3: Keyboard & Window Management
- [ ] Karabiner-Elements config (NAV + WINDOW layers)
- [ ] Rift
- [ ] Superkey (Seek only)

### Phase 4: Development Environment
- [ ] Zellij
- [ ] Neovim
- [ ] PHPStorm + IdeaVim

### Phase 5: macOS Defaults
- [x] Locale, desktop, menubar, input, finder, dock, apps (Ansible tasks done)
- [ ] Review remaining settings from archive/osx.sh

### Phase 6: Finalization
- [ ] Idempotent full-run testing
- [ ] setup.deligoz.me DNS
- [ ] VitePress deploy

## Notes

### Keybinding Architecture

```
BASE: Normal typing, Caps Lock = Esc (tap) / NAV (hold)
NAV:  HJKL arrows, word nav, editing
WIN:  Space (hold) -> Rift window management
```

### macOS KeyBindings (Beep Sound Fix)

Ghostty emits a macOS beep on `Cmd+Ctrl+Arrow` for split resize because macOS doesn't recognize the combo. Fix: define these keys as noop in `~/Library/KeyBindings/DefaultKeyBinding.dict`.

Ref: https://github.com/ghostty-org/ghostty/discussions/5521

