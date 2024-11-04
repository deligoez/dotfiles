echo "🍏🍏🍏 Setting up your Mac..."
echo ""

###############################################################################
# WindowManager                                                               #
###############################################################################

echo "🍏 Enable Standard Click to Show Desktop"
defaults write com.apple.WindowManager EnableStandardClickToShowDesktop -bool false

###############################################################################
# Dock                                                                        #
###############################################################################

echo "🍏 Clear the dock"
defaults write com.apple.dock persistent-apps -array

echo "🍏 Set the icon size of Dock items to 50 pixels"
defaults write com.apple.dock tilesize -int 50

echo "🍏 Don’t animate opening applications from the Dock"
defaults write com.apple.dock launchanim -bool false

echo "🍏 Automatically hide and show the Dock"
defaults write com.apple.dock autohide -bool true

echo "🍏 Don’t show recent applications in Dock"
defaults write com.apple.dock show-recents -bool false

echo "🍏 Speed up Mission Control animations"
defaults write com.apple.dock expose-animation-duration -float 0.1

echo "🍏 Don’t automatically rearrange Spaces based on most recent use"
defaults write com.apple.dock mru-spaces -bool false

###############################################################################
# Finder                                                                      #
###############################################################################

echo "🍏 Set sidebar icon size to medium"
defaults write NSGlobalDomain NSTableViewDefaultSizeMode -int 2

echo "🍏 Expand save panel by default"
defaults write NSGlobalDomain NSNavPanelExpandedStateForSaveMode -bool true
defaults write NSGlobalDomain NSNavPanelExpandedStateForSaveMode2 -bool true

echo "🍏 Expand print panel by default"
defaults write NSGlobalDomain PMPrintingExpandedStateForPrint -bool true
defaults write NSGlobalDomain PMPrintingExpandedStateForPrint2 -bool true

echo "🍏 Save to disk (not to iCloud) by default"
defaults write NSGlobalDomain NSDocumentSaveNewDocumentsToCloud -bool false

echo "🍏 Automatically quit printer app once the print jobs complete"
defaults write com.apple.print.PrintingPrefs "Quit When Finished" -bool true

echo "🍏 Disable the “Are you sure you want to open this application?” dialog"
defaults write com.apple.LaunchServices LSQuarantine -bool false

###############################################################################
# Input                                                                       #
###############################################################################

echo "🍏 Disable auto-correct"
defaults write NSGlobalDomain NSAutomaticSpellingCorrectionEnabled -bool false

echo "🍏 Disable automatic capitalization as it’s annoying when typing code"
defaults write NSGlobalDomain NSAutomaticCapitalizationEnabled -bool false

echo "🍏 Disable smart dashes as they’re annoying when typing code"
defaults write NSGlobalDomain NSAutomaticDashSubstitutionEnabled -bool false

echo "🍏 Disable automatic period substitution as it’s annoying when typing code"
defaults write NSGlobalDomain NSAutomaticPeriodSubstitutionEnabled -bool false

echo "🍏 Disable smart quotes as they’re annoying when typing code"
defaults write NSGlobalDomain NSAutomaticQuoteSubstitutionEnabled -bool false

echo "🍏 Enable full keyboard access for all controls"
defaults write NSGlobalDomain AppleKeyboardUIMode -int 3

echo "🍏 Disable press-and-hold for keys in favor of key repeat"
defaults write NSGlobalDomain ApplePressAndHoldEnabled -bool false

echo "🍏 Set a blazingly fast keyboard repeat rate"
defaults write NSGlobalDomain KeyRepeat -int 1
defaults write NSGlobalDomain InitialKeyRepeat -int 10

killall WindowManager
killall Dock
killall Finder
