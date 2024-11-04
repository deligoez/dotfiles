#!/bin/zsh

DOTFILES_DIR="$HOME/Developer/dotfiles"

echo "⚡️ Check sudo privileges..."
if ! sudo -v; then
    echo "❌ This script requires sudo privileges"
    exit 1
fi
echo ""

# Keep sudo timeout refreshed in background and store its PID
(while true; do sudo -n true; sleep 50; kill -0 "$$" || exit; done 2>/dev/null) &
SUDO_KEEP_ALIVE_PID=$!

echo "🍺🍺🍺 Setting up Homebrew..."
echo ""
if (( ! $+commands[brew] )); then
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    if [ $? -ne 0 ]; then
        echo "❌ Homebrew installation failed"
        exit 1
    fi

    # Set up Homebrew PATH
    echo "🍺 Setting up Homebrew PATH..."
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
    eval "$(/opt/homebrew/bin/brew shellenv)"
    if [ $? -ne 0 ]; then
        echo "❌ Failed to set up Homebrew PATH"
        exit 1
    fi
else
    echo "🍺 Homebrew is already installed"
fi

echo "🍺 Turning off Homebrew analytics..."
brew analytics off
if [ $? -ne 0 ]; then
    echo "❌ Failed to turn off analytics"
    exit 1
fi

echo "🍺 Updating Homebrew..."
brew update
if [ $? -ne 0 ]; then
    echo "❌ Update failed"
    exit 1
fi
echo ""

echo "🏦 Check and manage dotfiles repository..."
if [ -d "$DOTFILES_DIR" ]; then
    echo "📂 Dotfiles directory exists at $DOTFILES_DIR"

    # Change to dotfiles directory
    cd "$DOTFILES_DIR" || {
        echo "❌ Failed to change to dotfiles directory"
        exit 1
    }

    # Check if there are any local changes
    if ! git diff --quiet HEAD; then
        echo "❌ Local dotfiles have uncommitted changes. Please commit or stash them first."
        exit 1
    fi

    # Fetch remote changes
    echo "🏦 Checking for remote changes..."
    echo ""
    if ! git fetch origin master; then
        echo "❌ Failed to fetch from remote"
        exit 1
    fi

    # Check if local is behind remote
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse @{u})

    if [ "$LOCAL" = "$REMOTE" ]; then
        echo ""
        echo "🏦 Dotfiles are up to date"
    else
        # Try to fast-forward merge
        if ! git merge-base --is-ancestor HEAD FETCH_HEAD; then
            echo "❌ Local and remote histories have diverged. Please resolve manually."
            exit 1
        else
            echo "⏳ Pulling latest changes..."
            if ! git pull --ff-only origin master; then
                echo "❌ Failed to pull changes"
                exit 1
            fi
            echo ""
            echo "🏦 Successfully updated dotfiles"
        fi
    fi
else
    echo "⏳ Cloning dotfiles..."
    if ! git clone https://github.com/deligoez/dotfiles.git "$DOTFILES_DIR"; then
        echo "❌ Failed to clone dotfiles"
        exit 1
    fi
fi

cd "$DOTFILES_DIR" || {
    echo "❌ Failed to change to dotfiles directory"
    exit 1
}
echo ""

# Execute everything in the same shell
(
    cd "$(dirname "$0")" || exit 1
    source ./install.sh
)

# Cleanup sudo keep-alive on exit
kill -9 $SUDO_KEEP_ALIVE_PID
