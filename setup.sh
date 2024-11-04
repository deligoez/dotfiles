#!/bin/zsh

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

git clone https://github.com/deligoez/dotfiles.git ~/Developer/dotfiles/

cd ~/Sites/dotfiles/

#zsh ./install.sh

#zsh ./osx.sh
