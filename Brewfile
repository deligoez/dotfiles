# ── Dotfile Management ──
brew "chezmoi"                                      # Manage dotfiles across machines

# ── Core CLI Tools ──
brew "git"                                          # Version control
brew "curl"                                         # HTTP client
brew "bat"                                          # cat with syntax highlighting
brew "difftastic"                                   # Structural diff tool
brew "gh"                                           # GitHub CLI
brew "jq"                                           # JSON processor
brew "pv"                                           # Pipe viewer (progress bar)
brew "ripgrep"                                      # Fast recursive search

# ── Shell & Terminal ──
brew "fish"                                         # Friendly interactive shell
brew "starship"                                     # Cross-shell prompt
brew "zoxide"                                       # Smarter cd command
brew "zellij"                                       # Terminal workspace (Rust)

# ── Git Extras ──
brew "forgit"                                       # Interactive git with fzf
brew "lazygit"                                      # Terminal UI for git
brew "scmpuff"                                      # Numbered git status shortcuts
tap "unhappychoice/tap"
brew "unhappychoice/tap/gitlogue"                   # Git log viewer

# ── Editors ──
brew "neovim"                                       # Vim-based editor
cask "sublime-text"                                 # Fast text editor
cask "zed"                                          # GPU-accelerated editor

# ── PHP ──
tap "shivammathur/php"
tap "shivammathur/extensions"
tap "laradumps/app"
tap "deligoez/cask"
brew "shivammathur/php/php"                         # PHP (shivammathur tap)
brew "php", restart_service: :changed               # PHP (homebrew core)
brew "composer"                                     # PHP dependency manager
brew "shivammathur/extensions/igbinary@8.4"         # Binary serializer
brew "shivammathur/extensions/igbinary@8.5"
brew "shivammathur/extensions/imagick@8.4"          # Image processing
brew "shivammathur/extensions/imagick@8.5"
brew "shivammathur/extensions/msgpack@8.4"          # Binary serialization
brew "shivammathur/extensions/msgpack@8.5"
brew "shivammathur/extensions/pcov@8.4"             # Code coverage
brew "shivammathur/extensions/pcov@8.5"
brew "shivammathur/extensions/phpredis@8.5"         # Redis extension
brew "shivammathur/extensions/xdebug@8.4"           # Debugger & profiler
brew "shivammathur/extensions/xdebug@8.5"
cask "laradumps/app/laradumps"                      # Laravel debug tool
cask "tinkerwell"                                   # PHP REPL / scratchpad
cask "deligoez/cask/xdebug-toggler"                 # Toggle Xdebug on/off

# ── Node.js ──
brew "node@22"                                      # JavaScript runtime (LTS)
brew "pnpm"                                         # Fast package manager

# ── Go ──
brew "go"                                           # Go programming language

# ── Python ──
brew "pipx"                                         # Install Python CLI tools
brew "uv"                                           # Fast Python package manager

# ── Databases ──
brew "mysql@8.0", restart_service: :changed, link: true  # MySQL server
brew "redis", restart_service: :changed             # In-memory key-value store
cask "tableplus"                                    # Database GUI client

# ── DevOps & Infrastructure ──
brew "awscli"                                       # AWS command line
brew "kubernetes-cli"                               # kubectl
brew "nginx", restart_service: :changed             # Web server / reverse proxy
brew "dnsmasq"                                      # Local DNS resolver
cask "docker-desktop"                               # Container runtime
cask "ngrok"                                        # Expose localhost to internet

# ── Networking & VPN ──
brew "openvpn"                                      # OpenVPN client
brew "wireguard-tools"                              # WireGuard VPN tools
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
brew "mdcat"                                        # Render markdown with images
brew "pandoc"                                       # Document format converter

# ── AI & LLM Tools ──
brew "llmfit"                                       # LLM fine-tuning tool
brew "opencode"                                     # AI coding assistant (CLI)
cask "codex"                                        # OpenAI Codex app
cask "opencode-desktop"                             # OpenCode GUI

# ── Productivity Apps ──
cask "1password"                                    # Password manager
cask "bitwarden"                                    # Open-source password manager
cask "keka"                                         # File archiver (7z, zip, rar)
cask "notion"                                       # Notes & project management
cask "obsidian"                                     # Markdown knowledge base
cask "raycast"                                      # Launcher & productivity
cask "telegram"                                     # Messaging app
cask "spotify"                                      # Music streaming

# ── Browsers ──
cask "google-chrome"                                # Web browser

# ── Developer Apps ──
cask "ghostty"                                      # GPU-accelerated terminal
cask "wezterm"                                      # GPU-accelerated terminal (Lua config)
cask "jetbrains-toolbox"                            # JetBrains IDE manager
cask "qlmarkdown"                                   # Quick Look markdown preview

# ── Virtualization ──
cask "parallels@19"                                 # macOS/Windows VM
cask "utm"                                          # QEMU-based VM (free)

# ── Design & 3D ──
cask "affinity"                                     # Photo/design suite
cask "autodesk-fusion"                              # CAD/CAM 3D modeling
cask "creality-print"                               # 3D printer slicer
cask "openscad"                                     # Programmatic 3D CAD
cask "sweet-home3d"                                 # Interior design planner

# ── Gaming ──
cask "steam"                                        # Game distribution platform

# ── Education ──
cask "logisim-evolution"                            # Digital logic simulator

# ── Fonts ──
cask "font-iosevka"                                 # Monospace coding font

# ── Testing & Profiling ──
brew "antlr"                                        # Parser generator
brew "asciinema"                                    # Record terminal sessions
brew "bats-core"                                    # Bash test framework
brew "jmeter"                                       # Load testing tool
brew "mactop"                                       # macOS activity monitor (Rust)

# ── Misc CLI ──
brew "graphviz"                                     # Graph visualization (dot)
brew "lzip"                                         # Lossless data compressor
brew "mas"                                          # Mac App Store CLI
brew "mydumper"                                     # MySQL parallel backup
brew "mole"                                         # SSH tunnel manager
brew "pkgconf"                                      # Package config helper

# ── Misc Taps & Tools ──
tap "4ier/tap"
brew "4ier/tap/notion-cli"                          # Notion CLI client
tap "ankitpokhrel/jira-cli"
brew "ankitpokhrel/jira-cli/jira-cli"               # Jira CLI client
tap "atlassian-labs/acli"
brew "atlassian-labs/acli/acli"                     # Atlassian CLI (Confluence, Jira)
tap "gromgit/brewtils"
brew "gromgit/brewtils/taproom"                     # Manage Homebrew taps
tap "steveyegge/beads"
brew "steveyegge/beads/bd"                          # Beads language tools
tap "zjrosen/perles"
brew "zjrosen/perles/perles"                        # Perl-like CLI utils
tap "zurawiki/brews"
brew "zurawiki/brews/gptcommit"                     # AI-generated commit messages
tap "crossoverjie/skilldeck"
cask "crossoverjie/skilldeck/skilldeck"             # Skill deck app

# ── Mac App Store ──
mas "1Password for Safari", id: 1569813296          # Safari password autofill
mas "Network Radar", id: 507659816                  # Network scanner
mas "Numbers", id: 409203825                        # Apple spreadsheet
mas "Pages", id: 409201541                          # Apple word processor
mas "Under My Roof", id: 1524335878                 # Home inventory tracker
mas "Windows App", id: 1295203466                   # Microsoft Remote Desktop
mas "WireGuard", id: 1451685025                     # WireGuard VPN client
