#!/bin/zsh

echo "💼  Installing Homebrew"

if test ! $(which brew); then
  /bin/zsh -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
  echo "✅  Homebrew already installed"
fi
