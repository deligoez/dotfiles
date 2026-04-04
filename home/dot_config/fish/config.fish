# Disable greeting
function fish_greeting; end

# Editor
set -gx EDITOR /opt/homebrew/bin/nvim

# Starship prompt
starship init fish | source

# Homebrew completions
if test -d (brew --prefix)/share/fish/completions
    set -gx fish_complete_path $fish_complete_path (brew --prefix)/share/fish/completions
end

if test -d (brew --prefix)/share/fish/vendor_completions.d
    set -gx fish_complete_path $fish_complete_path (brew --prefix)/share/fish/vendor_completions.d
end
