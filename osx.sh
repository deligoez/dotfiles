echo "🍏🍏🍏 Setting up your Mac..."
echo ""

# Close open System Preferences panes, to prevent them from overriding settings.
osascript -e 'tell application "System Preferences" to quit'

###############################################################################
# WindowManager                                                               #
###############################################################################

echo "🍏 WindowManager: Enable Standard Click to Show Desktop"
defaults write com.apple.WindowManager EnableStandardClickToShowDesktop -bool false

###############################################################################
# Dock                                                                        #
###############################################################################

echo "🍏 Dock: Clear"
defaults write com.apple.dock persistent-apps -array

echo "🍏 Dock: Set the icon size of items to 50 pixels"
defaults write com.apple.dock tilesize -int 50

echo "🍏 Dock: Don’t animate opening applications"
defaults write com.apple.dock launchanim -bool false

echo "🍏 Dock: Automatically hide and show"
defaults write com.apple.dock autohide -bool true

echo "🍏 Dock: Don’t show recent applications"
defaults write com.apple.dock show-recents -bool false

echo "🍏 Dock: Speed up Mission Control animations"
defaults write com.apple.dock expose-animation-duration -float 0.1

echo "🍏 Dock: Don’t automatically rearrange Spaces based on most recent use"
defaults write com.apple.dock mru-spaces -bool false

###############################################################################
# Input                                                                       #
###############################################################################

echo "🍏 Input: Disable auto-correct"
defaults write NSGlobalDomain NSAutomaticSpellingCorrectionEnabled -bool false

echo "🍏 Input: Disable automatic capitalization as it’s annoying when typing code"
defaults write NSGlobalDomain NSAutomaticCapitalizationEnabled -bool false

echo "🍏 Input: Disable smart dashes as they’re annoying when typing code"
defaults write NSGlobalDomain NSAutomaticDashSubstitutionEnabled -bool false

echo "🍏 Input: Disable automatic period substitution as it’s annoying when typing code"
defaults write NSGlobalDomain NSAutomaticPeriodSubstitutionEnabled -bool false

echo "🍏 Input: Disable smart quotes as they’re annoying when typing code"
defaults write NSGlobalDomain NSAutomaticQuoteSubstitutionEnabled -bool false

echo "🍏 Input: Enable full keyboard access for all controls"
defaults write NSGlobalDomain AppleKeyboardUIMode -int 3

echo "🍏 Input: Disable press-and-hold for keys in favor of key repeat"
defaults write NSGlobalDomain ApplePressAndHoldEnabled -bool false

echo "🍏 Input: Set a blazingly fast keyboard repeat rate"
defaults write NSGlobalDomain KeyRepeat -int 1
defaults write NSGlobalDomain InitialKeyRepeat -int 10

###############################################################################
# Login Window                                                                #
###############################################################################

echo "🍏 LoginWindow: Show language menu in the top right corner of the boot screen"
sudo defaults write /Library/Preferences/com.apple.loginwindow showInputMenu -bool true

###############################################################################
# Energy                                                                      #
###############################################################################

echo "🍏 Energy: Disable machine sleep while charging"
sudo pmset -c sleep 0

###############################################################################
# Screen                                                                      #
###############################################################################

echo "🍏 Screen: Require password immediately after sleep or screen saver begins"
defaults write com.apple.screensaver askForPassword -int 1
defaults write com.apple.screensaver askForPasswordDelay -int 0

echo "🍏 Screen: Save screenshots to the desktop"
defaults write com.apple.screencapture location -string "${HOME}/Desktop"

echo "🍏 Screen: Save screenshots in PNG format (other options: BMP, GIF, JPG, PDF, TIFF)"
defaults write com.apple.screencapture type -string "png"

echo "🍏 Screen: Enable subpixel font rendering on non-Apple LCDs"
# Reference: https://github.com/kevinSuttle/macOS-Defaults/issues/17#issuecomment-266633501
defaults write NSGlobalDomain AppleFontSmoothing -int 1

echo "🍏 Screen: Enable HiDPI display modes (requires restart)"
sudo defaults write /Library/Preferences/com.apple.windowserver DisplayResolutionEnabled -bool true

###############################################################################
# Finder                                                                      #
###############################################################################

echo "🍏 Finder: Set sidebar icon size to medium"
defaults write NSGlobalDomain NSTableViewDefaultSizeMode -int 2

echo "🍏 Finder: Expand save panel by default"
defaults write NSGlobalDomain NSNavPanelExpandedStateForSaveMode -bool true
defaults write NSGlobalDomain NSNavPanelExpandedStateForSaveMode2 -bool true

echo "🍏 Finder: Expand print panel by default"
defaults write NSGlobalDomain PMPrintingExpandedStateForPrint -bool true
defaults write NSGlobalDomain PMPrintingExpandedStateForPrint2 -bool true

echo "🍏 Finder: Save to disk (not to iCloud) by default"
defaults write NSGlobalDomain NSDocumentSaveNewDocumentsToCloud -bool false

echo "🍏 PrintingPrefs: Automatically quit printer app once the print jobs complete"
defaults write com.apple.print.PrintingPrefs "Quit When Finished" -bool true

echo "🍏 LaunchServices: Disable the “Are you sure you want to open this application?” dialog"
defaults write com.apple.LaunchServices LSQuarantine -bool false

echo "🍏 Finder: disable window animations and Get Info animations"
defaults write com.apple.finder DisableAllAnimations -bool true

echo "🍏 Finder: Set Desktop as the default location for new Finder windows"
defaults write com.apple.finder NewWindowTarget -string "PfHm"
defaults write com.apple.finder NewWindowTargetPath -string "file://${HOME}/"

echo "🍏 Finder: show all filename extensions"
defaults write NSGlobalDomain AppleShowAllExtensions -bool true

echo "🍏 Finder: show status bar"
defaults write com.apple.finder ShowStatusBar -bool true

echo "🍏 Finder: show path bar"
defaults write com.apple.finder ShowPathbar -bool true

echo "🍏 Finder: Hide tags in sidebar"
defaults write com.apple.finder ShowRecentTags -bool false

echo "🍏 Finder: Set search scope"
# This Mac       : `SCev`
# Current Folder : `SCcf`
# Previous Scope : `SCsp`
defaults write com.apple.finder FXDefaultSearchScope SCcf

echo "🍏 Finder: Set preferred view style"
# Icon View   : `icnv`
# List View   : `Nlsv`
# Column View : `clmv`
# Cover Flow  : `Flwv`
defaults write com.apple.finder FXPreferredViewStyle Nlsv
rm -rf ~/.DS_Store

echo "🍏 Finder: Display full POSIX path as Finder window title"
defaults write com.apple.finder _FXShowPosixPathInTitle -bool true

echo "🍏 Finder: Keep folders on top when sorting by name"
defaults write com.apple.finder _FXSortFoldersFirst -bool true

echo "🍏 Finder: When performing a search, search the current folder by default"
defaults write com.apple.finder FXDefaultSearchScope -string "SCcf"

echo "🍏 Finder: Disable the warning when changing a file extension"
defaults write com.apple.finder FXEnableExtensionChangeWarning -bool false

echo "🍏 Finder: Enable spring loading for directories"
defaults write NSGlobalDomain com.apple.springing.enabled -bool true

echo "🍏 Finder: Remove the spring loading delay for directories"
defaults write NSGlobalDomain com.apple.springing.delay -float 2

echo "🍏 Finder: Avoid creating .DS_Store files on network or USB volumes"
defaults write com.apple.desktopservices DSDontWriteNetworkStores -bool true
defaults write com.apple.desktopservices DSDontWriteUSBStores -bool true

# Disable disk image verification
# defaults write com.apple.frameworks.diskimages skip-verify -bool true
# defaults write com.apple.frameworks.diskimages skip-verify-locked -bool true
# defaults write com.apple.frameworks.diskimages skip-verify-remote -bool true

# Automatically open a new Finder window when a volume is mounted
# defaults write com.apple.frameworks.diskimages auto-open-ro-root -bool true
# defaults write com.apple.frameworks.diskimages auto-open-rw-root -bool true
# defaults write com.apple.finder OpenWindowForNewRemovableDisk -bool true

###############################################################################
# TextEdit                                                                    #
###############################################################################

echo "🍏 TextEdit: Use plain text mode for new TextEdit documents."
defaults write com.apple.TextEdit RichText -int 0

echo "🍏 TextEdit: Open and save files as UTF-8 in TextEdit."
defaults write com.apple.TextEdit PlainTextEncoding -int 4
defaults write com.apple.TextEdit PlainTextEncodingForWrite -int 4

killall WindowManager
killall Dock
killall Finder
