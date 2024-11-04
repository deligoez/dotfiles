echo "🍏🍏🍏 Setting up your Mac..."
echo ""

echo "🍏 Enable Standard Click to Show Desktop"
defaults write com.apple.WindowManager EnableStandardClickToShowDesktop -bool false

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

killall WindowManager
killall Dock
killall Finder
