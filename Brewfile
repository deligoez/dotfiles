# ── Core CLI Tools ──
brew "bash"                                         # Bash 5.x (macOS ships 3.2)
brew "coreutils"                                    # GNU coreutils (gls, gdate, etc.)
brew "curl"                                         # HTTP client
brew "bat"                                          # cat with syntax highlighting
brew "difftastic"                                   # Structural diff tool
brew "fzf"                                          # Fuzzy finder
brew "jq"                                           # JSON processor
brew "parallel"                                     # Run commands in parallel
brew "pv"                                           # Pipe viewer (progress bar)
brew "ripgrep"                                      # Fast recursive search

# ── Git ──
brew "git"                                          # Version control
brew "gh"                                           # GitHub CLI
brew "forgit"                                       # Interactive git with fzf
brew "git-filter-repo"                              # Rewrite git history
brew "lazygit"                                      # Terminal UI for git
brew "scmpuff"                                      # Numbered git status shortcuts

tap "unhappychoice/tap"
brew "unhappychoice/tap/gitlogue"                   # Git log viewer

# ── Shell & Terminal ──
brew "fish"                                         # Friendly interactive shell
brew "starship"                                     # Cross-shell prompt
brew "zoxide"                                       # Smarter cd command
brew "zellij"                                       # Terminal workspace

# ── Editors ──
brew "neovim"                                       # Vim-based editor
cask "cursor"                                       # AI code editor
cask "emdash"                                       # AI writing editor
cask "sublime-text"                                 # Fast text editor
cask "zed"                                          # GPU-accelerated editor

# ── PHP ──
tap "shivammathur/php"
brew "shivammathur/php/php", restart_service: :changed  # PHP (shivammathur tap)

tap "shivammathur/extensions"
brew "shivammathur/extensions/xdebug@8.5"           # Debugger & profiler
brew "shivammathur/extensions/phpredis@8.5"         # Redis extension
brew "shivammathur/extensions/pcov@8.5"             # Code coverage
brew "shivammathur/extensions/imagick@8.5"          # Image processing
brew "shivammathur/extensions/igbinary@8.5"         # Binary serializer
brew "shivammathur/extensions/msgpack@8.5"          # Binary serialization

brew "composer"                                     # PHP dependency manager

cask "tinkerwell"                                   # PHP REPL / scratchpad

tap "laradumps/app"
cask "laradumps/app/laradumps"                      # Laravel debug tool

tap "deligoez/cask"
cask "deligoez/cask/xdebug-toggler"                 # Toggle Xdebug on/off

# ── Node.js ──
brew "node"                                         # JavaScript runtime (latest)
brew "pnpm"                                         # Fast package manager

# ── Go ──
brew "go"                                           # Go programming language
brew "goreleaser"                                   # Release automation for Go

tap "allegro-php/tap"
brew "allegro-php/tap/allegro"                      # PHP code quality runner

tap "deligoez/tap"
brew "deligoez/tap/deligoez-hc"                     # Hunk-based atomic git commits
brew "deligoez/tap/deligoez-rp"                     # Repo manager
brew "deligoez/tap/tp"                              # Task manager

# ── Rust ──
brew "rust"                                         # Rust programming language

# ── Python ──
brew "pipx"                                         # Install Python CLI tools
brew "uv"                                           # Fast Python package manager

# ── Databases ──
brew "mysql@8.0", restart_service: :changed, link: true  # MySQL server
brew "redis", restart_service: :changed             # In-memory key-value store
# TablePlus is installed via Setapp (see below)

# ── API & Networking Tools ──
cask "bruno"                                        # API client (Postman alternative)

# ── DevOps & Infrastructure ──
brew "awscli"                                       # AWS command line
brew "k9s"                                          # Kubernetes TUI
brew "kubernetes-cli"                               # kubectl
brew "nginx", restart_service: :changed             # Web server / reverse proxy
brew "dnsmasq"                                      # Local DNS resolver
cask "ngrok"                                        # Expose localhost to internet

# ── Networking & VPN ──
cask "openvpn-connect"                              # OpenVPN GUI

# ── Media & Image Processing ──
brew "ffmpeg"                                       # Video/audio converter
brew "ghostscript"                                  # PDF/PostScript interpreter
brew "gifsicle"                                     # GIF optimizer
brew "imagemagick"                                  # Image manipulation
brew "jpegoptim"                                    # JPEG optimizer
brew "pngquant"                                     # PNG compressor
brew "poppler"                                      # PDF rendering library
brew "rubberband"                                   # Audio time-stretching
brew "zbar"                                         # Barcode/QR reader

# ── Documentation & Markdown ──
brew "glow"                                         # Render markdown in terminal
brew "pandoc"                                       # Document format converter

# ── AI & LLM Tools ──
brew "claude-code"                                  # Claude Code CLI
brew "llmfit"                                       # LLM fine-tuning tool
brew "opencode"                                     # AI coding assistant (CLI)
cask "claude"                                       # Claude desktop app
cask "opencode-desktop"                             # OpenCode GUI

# ── Dotfile & Tap Management ──
brew "chezmoi"                                      # Manage dotfiles across machines
brew "defaultbrowser"                               # Set default browser from CLI
brew "mas"                                          # Mac App Store CLI

tap "gromgit/brewtils"
brew "gromgit/brewtils/taproom"                     # Interactive TUI for Homebrew

# ── Testing & Profiling ──
brew "antlr"                                        # Parser generator
brew "asciinema"                                    # Record terminal sessions
brew "bats-core"                                    # Bash test framework
brew "mactop"                                       # macOS activity monitor

# ── Misc CLI ──
brew "graphviz"                                     # Graph visualization (dot)
brew "lzip"                                         # Lossless data compressor
brew "mydumper"                                     # MySQL parallel backup
brew "mole"                                         # Mac cleaner & optimizer
brew "pkgconf"                                      # Package config helper

# ── Third-Party CLI ──
tap "4ier/tap"
brew "4ier/tap/notion-cli"                          # Notion CLI client

tap "ankitpokhrel/jira-cli"
brew "ankitpokhrel/jira-cli/jira-cli"               # Jira CLI client
# ── Keyboard ──
brew "kanata"                                        # Programmable keyboard remapper (layers, tap-hold)
cask "karabiner-elements"                            # Required for Kanata's VirtualHIDDevice driver

# ── Productivity Apps ──
cask "1password"                                    # Password manager
cask "adguard"                                      # Ad blocker
cask "bitwarden"                                    # Open-source password manager
cask "keka"                                         # File archiver (7z, zip, rar)
cask "localsend"                                    # Cross-platform file sharing
cask "notion"                                       # Notes & project management
cask "obsidian"                                     # Markdown knowledge base
cask "telegram"                                     # Messaging app

# ── Browsers ──
cask "google-chrome"                                # Web browser

# ── Terminals ──
cask "ghostty"                                      # GPU-accelerated terminal

# ── Developer Apps ──
cask "qlmarkdown"                                   # Quick Look markdown preview
cask "superkey"                                     # Keyboard shortcut overlay

# ── Utilities ──
cask "balenaetcher"                                 # USB/SD image flasher

# ── Virtualization ──
# parallels@20 — moved to manual install (requires sudo for .pkg)

# ── Design & 3D ──
cask "affinity"                                     # Photo/design suite
cask "creality-print"                               # 3D printer slicer
cask "openscad"                                     # Programmatic 3D CAD
cask "sweet-home3d"                                 # Interior design planner

# ── Gaming ──
cask "steam"                                        # Game distribution platform

# ── Education ──
cask "logisim-evolution"                            # Digital logic simulator

# ── Fonts ──
cask "font-iosevka"                                 # Monospace coding font

# ── Third-Party Casks ──
tap "crossoverjie/skilldeck"
cask "crossoverjie/skilldeck/skilldeck"             # Skill deck app

# ── Mac App Store ──
mas "Network Radar", id: 507659816                  # Network scanner
mas "Numbers", id: 361304891                        # Apple spreadsheet
mas "Pages", id: 361309726                          # Apple word processor
mas "Under My Roof", id: 1524335878                 # Home inventory tracker
mas "Windows App", id: 1295203466                   # Microsoft Remote Desktop
mas "WireGuard", id: 1451685025                     # WireGuard VPN client

# ── Setapp (installed via Setapp UI after cask "setapp") ──
cask "setapp"                                       # App subscription manager
# Bartender          — Menu bar manager
# BetterZip          — Archive tool
# CleanMyMac         — System cleaner
# CleanShot X        — Screenshot & recording
# CodeRunner         — Multi-language code editor
# Dato               — Menu bar calendar
# Lungo              — Keep Mac awake
# Marked             — Markdown previewer
# MindNode Classic   — Mind mapping
# Proxyman           — HTTP debugging proxy
# TablePlus          — Database GUI client
# Tiny Shield        — Ad blocker
# Ulysses            — Writing app

# ── Manual Install (not available via Homebrew) ──
# Soloterm           — https://soloterm.com
# Tuna               — https://tunaformac.com
