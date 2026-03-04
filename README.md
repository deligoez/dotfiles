# Dotfiles

Personal workstation setup for macOS (and eventually Omarchy/Arch Linux), powered by **Ansible**.

Idempotent — safe to run multiple times.

## Install

On a fresh macOS installation:

```bash
curl -fsSL dotfiles.deligoz.me | zsh
```

This will:
1. Install Homebrew (includes Xcode CLT)
2. Install Ansible via pipx
3. Clone this repo
4. Set hostname and timezone (from `config.yml`)
5. Run the Ansible playbook

## Re-apply

```bash
dotfiles
```

## Structure

```
config.yml                User-customizable settings (hostname, timezone, languages)
bootstrap.sh              Entry point for clean installs
ansible/
├── site.yml              Main playbook
├── inventory.yml         Host groups (macos / omarchy)
├── requirements.yml      Galaxy collections
└── roles/
    └── macos/
        ├── handlers/     Restart Dock (only when changed)
        └── tasks/
            ├── main.yml      Task orchestrator
            ├── locale.yml    Languages, region, 24h time, metric
            ├── desktop.yml   Appearance, widgets, wallpaper, Siri, accessibility
            ├── menubar.yml   Bluetooth, WiFi, Clock visibility
            └── dock.yml      Apps, icon size, auto-hide, animations
archive/                  Legacy setup scripts (reference only)
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
