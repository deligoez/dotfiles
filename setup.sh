#!/bin/zsh

DOTFILES_DIR="$HOME/Developer/dotfiles"

# Check sudo privileges
if ! sudo -v; then
    echo "❌ This script requires sudo privileges"
    exit 1
fi

# Keep sudo timeout refreshed
while true; do sudo -n true; sleep 60; kill -0 "$$" || exit; done 2>/dev/null &

echo "⏳ Installing Homebrew..."
if (( ! $+commands[brew] )); then
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    if [ $? -ne 0 ]; then
        echo "❌ Homebrew installation failed"
        exit 1
    fi

    # Set up Homebrew PATH
    echo "⏳ Setting up Homebrew PATH..."
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
    eval "$(/opt/homebrew/bin/brew shellenv)"
    if [ $? -ne 0 ]; then
        echo "❌ Failed to set up Homebrew PATH"
        exit 1
    fi
else
    echo "✅ Homebrew is already installed"
fi

echo "⏳ Turning off Homebrew analytics..."
brew analytics off
if [ $? -ne 0 ]; then
    echo "❌ Failed to turn off analytics"
    exit 1
fi

echo "⏳ Updating Homebrew..."
brew update
if [ $? -ne 0 ]; then
    echo "❌ Update failed"
    exit 1
fi

# Check if dotfiles directory already exists
if [ -d "$DOTFILES_DIR" ]; then
    echo "✅ Dotfiles already cloned at $DOTFILES_DIR"
else
    echo "⏳ Cloning dotfiles..."
    git clone https://github.com/deligoez/dotfiles.git "$DOTFILES_DIR"
    if [ $? -ne 0 ]; then
        echo "❌ Failed to clone dotfiles"
        exit 1
    fi
    echo "✅ Dotfiles cloned successfully"
fi

# Change to dotfiles directory
echo "⏳ Changing to dotfiles directory..."
cd "$DOTFILES_DIR" || {
    echo "❌ Failed to change to dotfiles directory"
    exit 1
}
echo "✅ Now in dotfiles directory"

#zsh ./install.sh

#zsh ./osx.sh
