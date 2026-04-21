# Dotfiles

Personal workstation setup for macOS, powered by **Ansible** + **Chezmoi**.

Idempotent — safe to run multiple times.

## Install

On a fresh macOS installation:

```bash
curl -fsSL dotfiles.deligoz.me | zsh
```

To skip macOS system preferences:

```bash
curl -fsSL dotfiles.deligoz.me | zsh -s -- --skip-tags macos-defaults
```

## Re-apply

```bash
dotfiles                              # full setup
dotfiles --skip-tags macos-defaults   # skip macOS preferences
dotfiles --tags homebrew              # only Homebrew packages
dotfiles --tags chezmoi               # only dotfile configs
dotfiles --tags go-tools              # only Go tools + rp bootstrap
dotfiles --tags ssh                   # only SSH key setup
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
| 6 | **SSH** | `ssh` | Ed25519 key generation, macOS Keychain, GitHub upload |
| 7 | **Go Tools** | `go-tools` | Tools from `go-tools.yml` + `rp bootstrap` for repo cloning |

## Structure

```
config.yml                User settings (hostname, timezone, languages)
Brewfile                  Homebrew packages (~180 items)
go-tools.yml              Go tools installed via `go install`
bootstrap.sh              Entry point for clean installs
home/                     Chezmoi-managed dotfiles
├── .chezmoiexternal.yaml   Pulls dotfiles-private into ~/.config/rp/
├── .chezmoi.toml.tmpl      Chezmoi config template
├── dot_config/
│   ├── fish/               Shell config, aliases, paths
│   ├── ghostty/            Terminal config + themes
│   └── starship.toml       Prompt config
├── dot_gitconfig           Git config
├── dot_gitignore_global    Global gitignore
└── dot_ssh/                SSH config
ansible/
├── site.yml              Main playbook
├── inventory.yml         macOS host
├── requirements.yml      Galaxy collections
└── roles/macos/tasks/
    ├── main.yml          Task orchestrator
    ├── locale.yml        Languages, region, 24h time, metric
    ├── desktop.yml       Appearance, widgets, wallpaper, Siri
    ├── menubar.yml       Bluetooth, WiFi, Clock visibility
    ├── input.yml         Autocorrect, key repeat, press-and-hold
    ├── finder.yml        View, search, save dialogs, .DS_Store
    ├── dock.yml          Apps, icon size, auto-hide, animations
    ├── apps.yml          TextEdit, Safari developer tools
    ├── homebrew.yml      Brew bundle + MAS apps
    ├── defaults.yml      Default browser & terminal
    ├── shell.yml         Fish as default shell
    ├── chezmoi.yml       Dotfile deployment
    ├── ssh.yml           SSH key + GitHub integration
    └── go-tools.yml      Go tools + rp bootstrap
archive/                  Legacy setup scripts (reference only)
```

## Config Files (via Chezmoi)

| Config | Manages |
|--------|---------|
| **Fish** | Aliases, abbreviations, paths, env vars |
| **Ghostty** | Font, themes (light/dark auto-switch), padding |
| **Starship** | Minimal prompt with git status |
| **Git** | User, push config, difftool (difft) |
| **SSH** | Ed25519 key, macOS Keychain integration |

Update configs across machines:

```bash
chezmoi update
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

Add Go tools to `go-tools.yml`:

```yaml
go_tools:
  - { name: "rp", pkg: "github.com/deligoez/rp@latest" }
  - { name: "tp", pkg: "github.com/deligoez/tp@latest" }
```

## License

MIT © Yunus Emre Deligöz
