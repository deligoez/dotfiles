echo "✅ Enable Standard Click to Show Desktop"
defaults write com.apple.WindowManager EnableStandardClickToShowDesktop -bool false

echo "✅ Clear the dock"
defaults write com.apple.dock persistent-apps -array

killall WindowManager
killall Dock
killall Finder
