#!/bin/sh
# Builds ~/Applications/Herdr Markdown.app from main.applescript and makes it
# the default app for Markdown. Idempotent: prints "unchanged" when the built
# app already matches the source and is already the default.
set -eu

HERE=$(cd "$(dirname "$0")" && pwd)
SRC="$HERE/main.applescript"
APP="$HOME/Applications/Herdr Markdown.app"
ID="me.deligoz.herdr-markdown"
UTI="net.daringfireball.markdown"
STAMP="$APP/Contents/Resources/source.applescript"
PB=/usr/libexec/PlistBuddy
LSREGISTER=/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister
changed=0

if ! cmp -s "$SRC" "$STAMP" 2>/dev/null; then
  mkdir -p "$HOME/Applications"
  rm -rf "${APP:?}"
  osacompile -o "$APP" "$SRC"
  PL="$APP/Contents/Info.plist"
  $PB -c "Set :CFBundleIdentifier $ID" "$PL" 2>/dev/null || $PB -c "Add :CFBundleIdentifier string $ID" "$PL"
  $PB -c "Delete :CFBundleDocumentTypes" "$PL" 2>/dev/null || true
  $PB -c "Add :CFBundleDocumentTypes array" \
      -c "Add :CFBundleDocumentTypes:0 dict" \
      -c "Add :CFBundleDocumentTypes:0:CFBundleTypeName string Markdown" \
      -c "Add :CFBundleDocumentTypes:0:CFBundleTypeRole string Viewer" \
      -c "Add :CFBundleDocumentTypes:0:LSHandlerRank string Default" \
      -c "Add :CFBundleDocumentTypes:0:LSItemContentTypes array" \
      -c "Add :CFBundleDocumentTypes:0:LSItemContentTypes:0 string $UTI" "$PL"
  $PB -c "Add :LSUIElement bool true" "$PL" 2>/dev/null || $PB -c "Set :LSUIElement true" "$PL"
  cp "$SRC" "$STAMP"
  codesign --force --sign - "$APP" >/dev/null 2>&1
  "$LSREGISTER" -f "$APP"
  sleep 2 # registration settles asynchronously; duti -s right away is ignored
  changed=1
fi

if [ "$(duti -x md 2>/dev/null | tail -1)" != "$ID" ]; then
  duti -s "$ID" "$UTI" all
  changed=1
fi

[ "$changed" = 1 ] && echo changed || echo unchanged
