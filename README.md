# Dotfiles

Personal dotfiles and workstation setup for macOS and Omarchy (Arch Linux), powered by **Ansible** + **chezmoi**.

- **Ansible** handles system setup: packages, services, macOS settings
- **chezmoi** handles config files: sync, templates, cross-machine management

Idempotent — safe to run multiple times.

## Install

On a fresh macOS or Omarchy installation:

```bash
curl -fsSL dotfiles.deligoz.me | zsh
```

This will:
1. Install Xcode CLT and Homebrew (macOS) or yay (Omarchy)
2. Install Ansible via pipx
3. Clone this repo
4. Run the Ansible playbook
5. Apply config files via chezmoi

## Structure

```
ansible/              Ansible playbook and roles
├── site.yml          Main playbook
├── inventory.yml     Host groups (macos / omarchy)
└── roles/            One role per concern (dock, packages, etc.)
bootstrap.sh          Entry point for clean installs
archive/              Legacy setup scripts (reference only)
```

## Daily Use

```bash
# New package → add to Ansible, run:
ansible-playbook ansible/site.yml --tags packages

# Config change → chezmoi handles it:
chezmoi edit ~/.config/ghostty/config
```

## License

MIT © Yunus Emre Deligöz
