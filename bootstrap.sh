#!/usr/bin/env zsh
# bootstrap.sh — Full developer workstation setup from scratch
# Usage: curl -fsSL dotfiles.deligoz.me | zsh

set -euo pipefail

DOTFILES_DIR="$HOME/Developer/github/deligoez/dotfiles"
DOTFILES_REPO_HTTPS="https://github.com/deligoez/dotfiles.git"
DOTFILES_REPO_SSH="git@github.com:deligoez/dotfiles.git"

echo "🚀 Setting up developer workstation..."

# ── Detect platform ──
OS="unknown"
if [[ "$OSTYPE" == darwin* ]]; then
    OS="macos"
elif [[ -f /etc/arch-release ]]; then
    OS="omarchy"
else
    echo "❌ Unsupported platform: $OSTYPE"
    exit 1
fi
echo "📋 Platform: $OS"

# ── Xcode CLT (macOS) ──
if [[ "$OS" == "macos" ]]; then
    if ! xcode-select -p &>/dev/null; then
        echo "📦 Installing Xcode Command Line Tools..."
        xcode-select --install
        echo "⏳ Complete the Xcode CLT install dialog, then press Enter..."
        read -r
    fi
fi

# ── Homebrew (macOS) ──
if [[ "$OS" == "macos" ]]; then
    if ! command -v brew &>/dev/null; then
        echo "📦 Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    eval "$(/opt/homebrew/bin/brew shellenv)"
fi

# ── pipx + Ansible ──
if ! command -v ansible &>/dev/null; then
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
    export PATH="$HOME/.local/bin:$PATH"
fi

# ── Clone or update dotfiles ──
if [[ ! -d "$DOTFILES_DIR" ]]; then
    echo "📦 Cloning dotfiles..."
    mkdir -p "$(dirname "$DOTFILES_DIR")"
    # Use HTTPS for initial clone (SSH key won't exist on clean install)
    git clone "$DOTFILES_REPO_HTTPS" "$DOTFILES_DIR"
    echo "💡 Tip: after setting up SSH key, switch remote to SSH:"
    echo "   cd $DOTFILES_DIR && git remote set-url origin $DOTFILES_REPO_SSH"
else
    echo "📁 Dotfiles exist, pulling latest..."
    git -C "$DOTFILES_DIR" pull --ff-only || true
fi

# ── Ansible Galaxy collections ──
echo "📦 Installing Ansible collections..."
ansible-galaxy collection install -r "$DOTFILES_DIR/ansible/requirements.yml"

# ── Run Ansible playbook ──
echo "🔧 Running Ansible playbook..."
ANSIBLE_CONFIG="$DOTFILES_DIR/ansible/ansible.cfg" \
ansible-playbook "$DOTFILES_DIR/ansible/site.yml" \
    -i "$DOTFILES_DIR/ansible/inventory.yml" \
    --limit "$OS" \
    --ask-become-pass

echo ""
echo "✅ Setup complete!"
