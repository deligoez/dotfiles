#!/bin/zsh

echo "💼  Installing Homebrew"

if test ! $(which brew); then
  /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
else
  echo "✅  Homebrew already installed"
fi