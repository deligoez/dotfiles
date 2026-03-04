#!/bin/zsh

export FISH_PATH=`which fish`
$FISH_PATH | sudo tee -a /etc/shells
chsh -s $FISH_PATH