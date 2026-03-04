#!/usr/bin/env zsh
# bootstrap.sh — Bootstrap Ansible on a clean machine, then hand off
# Usage: curl -fsSL dotfiles.deligoz.me | zsh
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
    exec zsh "$TMPFILE" </dev/tty
fi

DOTFILES_DIR="$HOME/Developer/github/deligoez/dotfiles"
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
    echo "📁 Dotfiles exist, pulling latest..."
    git -C "$DOTFILES_DIR" pull --ff-only 2>/dev/null || true
fi

# ── Step 4: Ansible Galaxy collections ──
ansible-galaxy collection install -r "$DOTFILES_DIR/ansible/requirements.yml" --force-with-deps 2>/dev/null

# ── Step 5: Hand off to Ansible ──
echo "🔧 Running Ansible..."
ANSIBLE_CONFIG="$DOTFILES_DIR/ansible/ansible.cfg" \
ansible-playbook "$DOTFILES_DIR/ansible/site.yml" \
    -i "$DOTFILES_DIR/ansible/inventory.yml" \
    --limit "$OS"

# ── Step 6: Add 'dotfiles' alias to zsh ──
ALIAS_LINE="alias dotfiles='cd $DOTFILES_DIR && git pull && ANSIBLE_CONFIG=$DOTFILES_DIR/ansible/ansible.cfg ansible-playbook $DOTFILES_DIR/ansible/site.yml -i $DOTFILES_DIR/ansible/inventory.yml --limit macos'"
if ! grep -q "alias dotfiles=" ~/.zshrc 2>/dev/null; then
    echo "$ALIAS_LINE" >> ~/.zshrc
fi
source ~/.zshrc

echo ""
echo "✅ Setup complete!"
echo "   Run 'dotfiles' to re-apply anytime."
