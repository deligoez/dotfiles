-- Herdr Markdown: the default app for .md files.
--
-- Opens each file in glow's TUI (`glow -t`) in a new terminal pane to the
-- right of the focused Herdr pane (`herdr-app do pane.split` with an argv),
-- so a Cmd-clicked .md link in a Herdr terminal renders inside Herdr instead
-- of in an outside editor. The TUI reloads when the file changes; `q` quits
-- glow and the pane closes with it (Esc goes to glow's file list instead).
-- For images or diagrams, open the file in herdr-md by hand: `mdh open FILE`.
-- When Herdr isn't running or the split fails, the file goes to MarkText, or
-- TextEdit if that is missing.
--
-- Text wraps at the pane's width and rewraps when the pane is resized. glow
-- 3.0.0 needs two nudges for that: `--width=1000` lifts the cap (glow.yml says
-- 80, and the wrap is min(cap, pane width)), and a pressed `r` 0.4 s after the
-- start replaces the first render, which races the pane's size and comes out
-- either unwrapped or empty. After that reload every resize rewraps.
--
-- Built and registered by ansible/roles/macos/tasks/herdr-markdown.yml.
-- Bridge until Herdr ships terminal link handlers (after 0.1.16).

property glow : "/opt/homebrew/bin/glow"
property starter : "( sleep 0.4; \"$HOME/.local/bin/herdr-core\" keys \"$HC_TERMINAL_ID\" r ) >/dev/null 2>&1 & exec \"$1\" -s \"$2\" -t --width=1000 \"$3\""

on open theFiles
	set herdr to POSIX path of (path to home folder) & ".local/bin/herdr-app"
	set glowStyle to my appearance()
	repeat with f in theFiles
		set p to POSIX path of f
		set args to "{\"direction\":\"right\",\"argv\":[\"/bin/sh\",\"-c\"," & my jstr(starter) & ",\"herdr-markdown\"," & my jstr(glow) & "," & my jstr(glowStyle) & "," & my jstr(p) & "]}"
		try
			do shell script "pgrep -xq Herdr && " & quoted form of herdr & " do pane.split " & quoted form of args
			do shell script "open -a Herdr"
		on error
			do shell script "open -b com.github.marktext.marktext " & quoted form of p & " || open -e " & quoted form of p
		end try
	end repeat
end open

-- glow's style for the system's appearance at the moment the file opens:
-- "dark" or "light". glow's own "auto" asks the terminal for its background,
-- gets no answer in a Herdr pane and falls back to dark, which a light system
-- can't read. An open pane keeps its style; reopen the file after a switch.
on appearance()
	try
		if (do shell script "defaults read -g AppleInterfaceStyle") is "Dark" then return "dark"
	end try
	return "light"
end appearance

-- A JSON string literal: backslashes and double quotes escaped.
on jstr(s)
	set out to ""
	repeat with c in characters of s
		set c to contents of c
		if c is "\\" or c is "\"" then set out to out & "\\"
		set out to out & c
	end repeat
	return "\"" & out & "\""
end jstr

on run
	display dialog "Herdr Markdown opens .md files with glow in a Herdr pane. Open a .md file to use it." buttons {"OK"} default button 1
end run
