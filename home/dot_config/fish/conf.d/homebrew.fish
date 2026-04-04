# GitHub API token for Homebrew (via gh CLI, lazy-loaded)
if not set -q HOMEBREW_GITHUB_API_TOKEN; and command -q gh
    set -gx HOMEBREW_GITHUB_API_TOKEN (gh auth token 2>/dev/null)
end
