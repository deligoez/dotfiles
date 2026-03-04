#!/usr/bin/env zsh
# bootstrap.sh — Bootstrap Ansible on a clean machine, then hand off
# Usage: curl -fsSL dotfiles.deligoz.me | zsh
#
# This script does the MINIMUM to get Ansible running:
#   1. TTY fix (for curl pipe)
#   2. Xcode CLT (gives us git)
#   3. Homebrew (gives us pipx)
#   4. pipx + ansible-core
#   5. Clone dotfiles repo
#   6. Hand off to Ansible
#
# Everything else (packages, settings, services) is Ansible's job.
# Idempotent — safe to run multiple times.

set -euo pipefail

# ── Re-exec with TTY when piped (curl ... | zsh) ──
# sudo and Homebrew need a real terminal for interactive prompts
if [[ ! -t 0 ]]; then
    TMPFILE=$(mktemp /tmp/bootstrap.XXXXXX.sh)
    curl -fsSL "https://raw.githubusercontent.com/deligoez/dotfiles/master/bootstrap.sh" -o "$TMPFILE"
    chmod +x "$TMPFILE"
    exec zsh "$TMPFILE" </dev/tty
fi

DOTFILES_DIR="$HOME/Developer/github/deligoez/dotfiles"
DOTFILES_REPO="https://github.com/deligoez/dotfiles.git"

echo "🚀 Setting up developer workstation..."

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

# ── Step 1: Xcode CLT (macOS only — gives us git, clang, make) ──
if [[ "$OS" == "macos" ]] && ! xcode-select -p &>/dev/null; then
    echo "📦 Installing Xcode Command Line Tools..."
    touch /tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress
    PROD=$(softwareupdate -l 2>/dev/null | \
        grep "\*.*Command Line" | \
        head -n 1 | awk -F"*" '{print $2}' | \
        sed -e 's/^ *//' | tr -d '\n')
    if [[ -n "$PROD" ]]; then
        softwareupdate -i "$PROD" --verbose
    else
        echo "⚠️  softwareupdate couldn't find CLT, falling back to xcode-select..."
        xcode-select --install
        until xcode-select -p &>/dev/null; do sleep 5; done
    fi
    rm -f /tmp/.com.apple.dt.CommandLineTools.installondemand.in-progress
    echo "✅ Xcode CLT installed"
fi

# ── Step 2: Homebrew (macOS only — gives us pipx) ──
if [[ "$OS" == "macos" ]] && ! command -v brew &>/dev/null; then
    echo "📦 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi
[[ "$OS" == "macos" ]] && eval "$(/opt/homebrew/bin/brew shellenv)"

# ── Step 3: pipx + Ansible ──
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

# ── Step 4: Clone or update dotfiles ──
if [[ ! -d "$DOTFILES_DIR" ]]; then
    echo "📦 Cloning dotfiles..."
    mkdir -p "$(dirname "$DOTFILES_DIR")"
    git clone "$DOTFILES_REPO" "$DOTFILES_DIR"
else
    echo "📁 Dotfiles exist, pulling latest..."
    git -C "$DOTFILES_DIR" pull --ff-only 2>/dev/null || true
fi

# ── Step 5: Ansible Galaxy collections ──
ansible-galaxy collection install -r "$DOTFILES_DIR/ansible/requirements.yml" --force-with-deps 2>/dev/null

# ── Step 6: Hand off to Ansible ──
echo "🔧 Running Ansible..."
ANSIBLE_CONFIG="$DOTFILES_DIR/ansible/ansible.cfg" \
ansible-playbook "$DOTFILES_DIR/ansible/site.yml" \
    -i "$DOTFILES_DIR/ansible/inventory.yml" \
    --limit "$OS" \
    --ask-become-pass

echo ""
echo "✅ Setup complete!"
