#!/bin/zsh

if (( ! $+commands[brew] )); then
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
  echo "✅  Homebrew already installed"
fi

brew analytics off

brew update

# git clone https://github.com/deligoez/dotfiles.git ~/Developer/dotfiles/

#cd ~/Sites/dotfiles/

#zsh ./install.sh

#zsh ./osx.sh
