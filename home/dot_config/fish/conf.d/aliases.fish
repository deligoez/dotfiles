# Git
abbr -a gs  git status -sb
abbr -a ga  git add
abbr -a gc  git commit
abbr -a gcm git commit -m
abbr -a gca git commit --amend
abbr -a gcl git clone
abbr -a gco git checkout
abbr -a gp  git push
abbr -a gpl git pull
abbr -a gl  git l
abbr -a gd  git diff
abbr -a gds git diff --staged
abbr -a gr  git rebase -i HEAD~15
abbr -a gf  git fetch
abbr -a gfc git findcommit
abbr -a gfm git findmessage

# Dotfiles / Chezmoi
set -l _dotfiles ~/Developer/github/deligoez/dotfiles
alias cma="git -C $_dotfiles pull; chezmoi apply --source=$_dotfiles/home"
alias cmd="chezmoi diff --source=$_dotfiles/home"

# Laravel / PHP
alias a="php artisan"
alias artisan="php artisan"
alias c="composer"
alias cfresh="rm -rf vendor/ composer.lock; composer install"
alias nfresh="rm -rf node_modules package-lock.json; npm install"
alias rfresh="redis-cli FLUSHDB"
