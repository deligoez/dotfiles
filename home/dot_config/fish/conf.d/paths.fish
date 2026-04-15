# Homebrew
fish_add_path /opt/homebrew/bin
fish_add_path /opt/homebrew/sbin

# GNU coreutils (prefer over macOS defaults)
fish_add_path /opt/homebrew/opt/coreutils/libexec/gnubin

# Composer (PHP)
fish_add_path ~/.composer/vendor/bin

# Go
fish_add_path ~/go/bin

# Cargo (Rust)
fish_add_path ~/.cargo/bin

# pipx / uv
fish_add_path ~/.local/bin

# Codegraff (muonry + zig* CLIs)
fish_add_path ~/bin
