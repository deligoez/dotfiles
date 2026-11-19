-- Herdr Markdown: the default app for .md files.
--
-- Opens each file in a herdr-md viewer pane beside the focused Herdr pane
-- (`mdh open`), so a Cmd-clicked .md link in a Herdr terminal renders inside
-- Herdr instead of in an outside editor. When Herdr isn't running or mdh
-- fails, the file goes to MarkText, or TextEdit if that is missing.
--
-- Built and registered by ansible/roles/macos/tasks/herdr-markdown.yml.
-- Bridge until Herdr ships terminal link handlers (after 0.1.16).

on open theFiles
	set mdh to POSIX path of (path to home folder) & ".local/bin/mdh"
	set env to "PATH=$HOME/.local/bin:/opt/homebrew/bin:/usr/bin:/bin "
	repeat with f in theFiles
		set p to quoted form of POSIX path of f
		try
			do shell script "pgrep -xq Herdr && " & env & quoted form of mdh & " open " & p
			do shell script "open -a Herdr"
		on error
			do shell script "open -b com.github.marktext.marktext " & p & " || open -e " & p
		end try
	end repeat
end open

on run
	display dialog "Herdr Markdown opens .md files in a Herdr viewer pane. Open a .md file to use it." buttons {"OK"} default button 1
end run
