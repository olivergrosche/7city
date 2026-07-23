#!/bin/bash
# Re-apply all 7CITY project tweaks to the generated Capacitor Android project.
# Run after `npx cap add android` regenerates android/ (e.g. after an appId
# change) — mirrors the sed-override approach used in the 7CIV build script.
set -euo pipefail
cd "$(dirname "$0")/../android"

echo "== SDK override (Play requires targetSdk 36 from Aug 2026) =="
# AGP 8.7.2 is only officially tested up to compileSdk 35 — warning, not error.
sed -i '' 's/compileSdkVersion = 35/compileSdkVersion = 36/' variables.gradle
sed -i '' 's/targetSdkVersion = 35/targetSdkVersion = 36/' variables.gradle
grep -q "suppressUnsupportedCompileSdk" gradle.properties || cat >> gradle.properties <<'EOF'

# AGP 8.7.2 is only officially tested up to compileSdk 35; 36 works (warning only).
android.suppressUnsupportedCompileSdk=36
EOF

echo "== App name 7CITY =="
sed -i '' 's/>7city</>7CITY</g' app/src/main/res/values/strings.xml

echo "== Safe-area: black status/navigation bars =="
if grep -q '@null' app/src/main/res/values/styles.xml; then
  sed -i '' 's|<item name="android:background">@null</item>|<item name="android:background">@android:color/black</item>\
        <item name="android:statusBarColor">@android:color/black</item>\
        <item name="android:navigationBarColor">@android:color/black</item>|' app/src/main/res/values/styles.xml
fi

echo "== local.properties =="
echo "sdk.dir=$HOME/Library/Android/sdk" > local.properties

echo "== Adaptive icon XML (artwork as background layer) =="
cat > app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml <<'EOF'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_bgimage"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
EOF
cp app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml

echo "== Launcher icons from resources/icon-source.png =="
python3 "$(dirname "$0")/make_icons.py" 2>/dev/null || python3 ../scripts/make_icons.py

echo "== Keystore gitignore =="
grep -q "upload-keystore.jks" .gitignore || printf 'upload-keystore.jks\nkeystore.properties\n' >> .gitignore

echo
echo "Fertig. Manuell prüfen: versionCode/versionName + signingConfigs in app/build.gradle"
echo "(cap add überschreibt build.gradle — Signierung ggf. aus Git wiederherstellen:"
echo " git checkout -- android/app/build.gradle und dann Version erneut setzen)."
