# Resume the coding agent a Herdr terminal lost to a reboot or a core restart
# (dmazlum/herdr-revive, installed as a Herdr mod by chezmoi). Revive ships
# rc blocks for zsh and bash only; this is the fish twin of its shellBlock.
#
# One change on purpose: an automatic resume drops --dangerously-skip-permissions
# (Revive only keeps it for a resume started from its cmd-shift-r dialog). Here
# it is put back, but only for a session that was started with it: Revive
# writes the original flags into REVIVE_RESUME, and that is what is checked.
#
# REVIVE_DEBUG=1 says why it did or didn't. REVIVE_AUTO=0 skips the resume.

status is-interactive; or return
set -q HC_TERMINAL_ID; or return

# `hc` on PATH is the hunk-commit tool here; Revive must talk to herdr-core.
set -q REVIVE_HC; or set -gx REVIVE_HC $HOME/.local/bin/herdr-core

set -l __revive_engine $HOME/.config/herdr-app/mods/revive/revive.mjs
test -f $__revive_engine; and type -q node; or return

if not string match -q '*"revive.session"*' -- ($REVIVE_HC get $HC_TERMINAL_ID --json 2>/dev/null | string collect)
    set -q REVIVE_DEBUG; and echo "revive: nothing remembered on $HC_TERMINAL_ID" >&2
else if test "$REVIVE_SHELL" = (ps -o ppid= -p $fish_pid | string trim)
    set -q REVIVE_DEBUG; and echo "revive: a shell started inside the terminal's own shell" >&2
else
    set -l script (node $__revive_engine check --shell $fish_pid 2>/dev/null | string collect)
    if test -n "$script"
        if string match -q '*REVIVE_RESUME=*--dangerously-skip-permissions*' -- $script
            set script (string replace -ar "(REVIVE_RESUME='[^']*' '?claude'?) " '$1 --dangerously-skip-permissions ' -- $script | string collect)
            set script (string match -v '*only a resume from the Revive dialog*' -- (string split \n -- $script) | string join \n | string collect)
        end
        set -g __revive_script $script
        # Start the agent at the first prompt, once config files are done.
        function __revive_run --on-event fish_prompt
            functions -e __revive_run
            zsh -c $__revive_script
            set -e __revive_script
        end
    end
end

# Shells started from this one know it ran here (Revive's ownShell check).
set -gx REVIVE_SHELL $fish_pid
