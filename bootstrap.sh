#!/usr/bin/env zsh
# bootstrap.sh — Bootstrap Ansible on a clean machine, then hand off
# Usage:
#   curl -fsSL dotfiles.deligoz.me | zsh
#   curl -fsSL dotfiles.deligoz.me | zsh -s -- --skip-tags macos-defaults
#
# This script does the MINIMUM to get Ansible running:
#   1. TTY fix (for curl pipe)
#   2. Homebrew (installs Xcode CLT automatically)
#   3. pipx + ansible-core
#   4. Clone dotfiles repo
#   5. Hand off to Ansible
#
# Everything else (packages, settings, services) is Ansible's job.
# Idempotent — safe to run multiple times.

set -euo pipefail

# ── Re-exec with TTY when piped (curl ... | zsh) ──
# sudo and Homebrew need a real terminal for interactive prompts
if [[ ! -t 0 ]]; then
    TMPFILE="/tmp/dotfiles-bootstrap-$$.sh"
    curl -fsSL -H "Cache-Control: no-cache" \
        "https://raw.githubusercontent.com/deligoez/dotfiles/master/bootstrap.sh" -o "$TMPFILE"
    chmod +x "$TMPFILE"
    exec zsh "$TMPFILE" "$@" </dev/tty
fi

DOTFILES_DIR="$HOME/Developer/deligoez/dotfiles/dotfiles"
DOTFILES_REPO="https://github.com/deligoez/dotfiles.git"

echo "🚀 Setting up developer workstation..."

# ── Ask for sudo upfront and keep it alive throughout the script ──
sudo -v
while true; do sudo -n true; sleep 50; kill -0 "$$" || exit; done 2>/dev/null &
SUDO_KEEPALIVE_PID=$!
trap 'kill $SUDO_KEEPALIVE_PID 2>/dev/null' EXIT

# ── Detect platform ──
if [[ "$OSTYPE" == darwin* ]]; then
    OS="macos"
elif [[ -f /etc/arch-release ]]; then
    OS="omarchy"
else
    echo "❌ Unsupported platform: $OSTYPE"
    exit 1
fi
echo "📋 Platform: $OS"

# ── Step 1: Homebrew (macOS only — installs Xcode CLT automatically) ──
if [[ "$OS" == "macos" ]] && [[ ! -x /opt/homebrew/bin/brew ]]; then
    echo "📦 Installing Homebrew..."
    NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi
[[ "$OS" == "macos" ]] && eval "$(/opt/homebrew/bin/brew shellenv)"

# ── Step 2: pipx + Ansible ──
export PATH="$HOME/.local/bin:$PATH"
if ! command -v ansible-playbook &>/dev/null; then
    echo "📦 Installing Ansible..."
    if [[ "$OS" == "macos" ]]; then
        brew install pipx
        pipx ensurepath
        pipx install ansible-core
    else
        sudo pacman -S --noconfirm python-pipx
        pipx ensurepath
        pipx install ansible-core
    fi
fi

# ── Step 3: Clone or update dotfiles ──
if [[ ! -d "$DOTFILES_DIR" ]]; then
    echo "📦 Cloning dotfiles..."
    mkdir -p "$(dirname "$DOTFILES_DIR")"
    git clone "$DOTFILES_REPO" "$DOTFILES_DIR"
else
    echo "📁 Dotfiles exist, fetching latest..."
    git -C "$DOTFILES_DIR" fetch origin
    LOCAL=$(git -C "$DOTFILES_DIR" rev-parse HEAD)
    REMOTE=$(git -C "$DOTFILES_DIR" rev-parse origin/master)
    if [[ "$LOCAL" != "$REMOTE" ]]; then
        if ! git -C "$DOTFILES_DIR" pull --ff-only; then
            echo "⚠️  Could not fast-forward — local changes or divergent history."
            echo "   Resolve manually in $DOTFILES_DIR, then re-run."
            exit 1
        fi
    else
        echo "✅ Already up to date."
    fi
fi

# ── Step 4: Ansible Galaxy collections ──
ansible-galaxy collection install -r "$DOTFILES_DIR/ansible/requirements.yml" 2>/dev/null

# ── Step 4b: Set hostname (needs sudo, Ansible can't prompt) ──
# Refresh sudo ticket — Homebrew/pipx steps may have invalidated it
sudo -v
if [[ "$OS" == "macos" ]]; then
    DESIRED_HOSTNAME=$(grep '^hostname:' "$DOTFILES_DIR/config.yml" | awk '{print $2}')
    CURRENT_HOSTNAME=$(scutil --get ComputerName 2>/dev/null || echo "")
    CURRENT_NETBIOS=$(defaults read /Library/Preferences/SystemConfiguration/com.apple.smb.server NetBIOSName 2>/dev/null || echo "")
    if [[ -n "$DESIRED_HOSTNAME" && ("$CURRENT_HOSTNAME" != "$DESIRED_HOSTNAME" || "$CURRENT_NETBIOS" != "$DESIRED_HOSTNAME") ]]; then
        echo "📛 Setting hostname to $DESIRED_HOSTNAME..."
        sudo scutil --set ComputerName "$DESIRED_HOSTNAME"
        sudo scutil --set HostName "$DESIRED_HOSTNAME"
        sudo scutil --set LocalHostName "$DESIRED_HOSTNAME"
        sudo defaults write /Library/Preferences/SystemConfiguration/com.apple.smb.server NetBIOSName -string "$DESIRED_HOSTNAME"
    fi

    # ── Set timezone (needs sudo) ──
    DESIRED_TZ=$(grep '^timezone:' "$DOTFILES_DIR/config.yml" | awk '{print $2}')
    CURRENT_TZ=$(sudo systemsetup -gettimezone 2>/dev/null | awk -F': ' '{print $2}')
    if [[ -n "$DESIRED_TZ" && "$CURRENT_TZ" != "$DESIRED_TZ" ]]; then
        echo "🕐 Setting timezone to $DESIRED_TZ..."
        sudo systemsetup -settimezone "$DESIRED_TZ"
    fi
fi

# ── Step 5: Hand off to Ansible ──
echo "🔧 Running Ansible..."
ANSIBLE_CONFIG="$DOTFILES_DIR/ansible/ansible.cfg" \
ansible-playbook "$DOTFILES_DIR/ansible/site.yml" \
    -i "$DOTFILES_DIR/ansible/inventory.yml" \
    --limit "$OS" \
    --ask-become-pass \
    "$@"

# ── Step 6: Add 'dotfiles' alias to zsh ──
FUNC_BLOCK="dotfiles() { cd $DOTFILES_DIR && git pull && PATH=\$HOME/.local/bin:/opt/homebrew/bin:\$PATH ANSIBLE_CONFIG=$DOTFILES_DIR/ansible/ansible.cfg ansible-playbook $DOTFILES_DIR/ansible/site.yml -i $DOTFILES_DIR/ansible/inventory.yml --limit macos --ask-become-pass \"\\\$@\"; }"
if ! grep -q "dotfiles()" ~/.zshrc 2>/dev/null; then
    # Remove old alias if present
    sed -i '' '/alias dotfiles=/d' ~/.zshrc 2>/dev/null
    echo "$FUNC_BLOCK" >> ~/.zshrc
fi
source ~/.zshrc

echo ""
echo "✅ Setup complete!"
echo "   Run 'dotfiles' to re-apply anytime."
