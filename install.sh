#!/bin/zsh

echo "Setting up your Mac..."

echo "Check for Homebrew and install if we don't have it"
if test ! $(which brew); then
  /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
fi