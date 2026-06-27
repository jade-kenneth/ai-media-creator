# Google Play Store Publishing Guide

App: **App Boilerplate**
Package: `com.jeidochan.orgmobile`
EAS Project ID: `09c401cd-0c05-40f4-a9a7-fa65af2bd8cd`

---

## Prerequisites

- Google Play Developer account (one-time $25 fee)
- EAS CLI installed (`npm install -g eas-cli`)
- Java 17 and Android SDK configured (see [Android Local Build Setup in CLAUDE.md](~/.claude/CLAUDE.md))

---

## 1. EAS Configuration

`apps/org-system-mobile/eas.json` is configured with three profiles:

| Profile | Type | Purpose |
|---|---|---|
| `development` | APK (internal) | Local dev with dev client |
| `preview` | APK (internal) | Testing / verification builds |
| `production` | AAB | Google Play release |

The `production` profile uses `autoIncrement: true` so EAS manages `versionCode` automatically via `appVersionSource: "remote"`.

---

## 2. Building

### Production AAB (for Play Store upload)

```bash
cd apps/org-system-mobile && \
JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home \
ANDROID_HOME=$HOME/Library/Android/sdk \
eas build -p android --profile production --local
```

Output: a `.aab` file — this is what gets uploaded to Google Play.

### Verification APK (for ownership proof)

```bash
cd apps/org-system-mobile && \
JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home \
ANDROID_HOME=$HOME/Library/Android/sdk \
eas build -p android --profile preview --local
```

Output: a `.apk` file — used only for Play Console ownership verification.

---

## 3. Ownership Verification

Google Play requires you to prove you own the signing key before registering the package name.

### Steps

1. Create `apps/org-system-mobile/assets/adi-registration.properties`
2. Paste the unique token from Play Console into the file (e.g. `DIFYRBQPLOHAYAAAAAAAAAAAAA`)
3. The `withAdiRegistration` config plugin (`plugins/withAdiRegistration.js`) copies this file into the Android APK's `assets/` directory at build time
4. Build a preview APK (see above)
5. Upload the APK to Play Console → ownership verified

> **Why the plugin?** Expo's `assets/` folder is bundled by Metro, not mapped to the Android raw `assets/` directory. Without the plugin, the `.properties` file is not present in the APK's `assets/` folder and verification fails.

### Key fingerprint on file with Google

```
CD:D1:76:5C:6B:33:F2:63:6A:E2:E9:50:F8:7F:AA:E2:BA:6B:6C:F4:1B:CA:03:11:AE:72:6B:20:9C:0B:7A:30
```

To check your EAS keystore fingerprint:
```bash
cd apps/org-system-mobile && eas credentials -p android
```

---

## 4. Store Assets

All assets are saved in `apps/org-system-mobile/screenshots/`.

| Asset | File | Spec |
|---|---|---|
| App icon | `icon-512.png` | 512×512 PNG, ~242KB |
| Feature graphic | `feature-graphic.png` | 1024×500 PNG |
| Screenshots | `welcome.png`, `login.png`, `register.png`, `choice.png`, `organization.png`, `home-screen.png` | PNG, 9:16 ratio |

### Regenerating the feature graphic

```bash
magick \
  -size 1024x500 \
  gradient:"#0f172a-#1e3a5f" \
  \( assets/logo.png -resize 180x180 \) \
  -gravity center -geometry -200+0 \
  -composite \
  -font "/System/Library/Fonts/Geneva.ttf" \
  -fill white -pointsize 44 -gravity center -annotate +130-20 "App Boilerplate" \
  -fill "#94a3b8" -pointsize 20 -gravity center -annotate +130+35 "Your Organization. Anytime. Anywhere." \
  screenshots/feature-graphic.png
```

### Regenerating the app icon

```bash
magick assets/logo.png -resize 512x512 screenshots/icon-512.png
```

---

## 5. Play Console Checklist

Complete all items under **Dashboard** before promoting to production.

| Section | Location in Console | Notes |
|---|---|---|
| Store listing | Grow → Store listing | App name, description, screenshots, feature graphic, icon |
| Content rating | Policy → App content → Content rating | Fill out questionnaire |
| Privacy policy | Policy → App content → Privacy policy | Must be a live HTTPS URL |
| Target audience | Policy → App content → Target audience | |
| Data safety | Policy → App content → Data safety | Declare all personal data collected (names, phone numbers, etc.) |
| App access | Policy → App content → App access | |

---

## 6. Release Flow

```
Internal testing → Open testing (optional) → Production
```

1. Go to **Testing → Internal testing → Create new release**
2. Upload the `.aab` file
3. Add release notes
4. Add yourself as a tester (jadekennethdarunday@gmail.com)
5. Roll out → you receive an opt-in link via email
6. Once all checklist items are green → promote to **Production**

Google review for first submission typically takes **1–3 business days**.

---

## 7. Future Releases

For every subsequent release:

1. EAS auto-increments `versionCode` (handled by `appVersionSource: "remote"`)
2. Bump `version` in `app.json` (e.g. `1.0.0` → `1.1.0`)
3. Build a new production AAB
4. Upload to Play Console → **Production → Create new release**

---

## 8. Key Files

| File | Purpose |
|---|---|
| `app.json` | App config — package name, version, plugins |
| `eas.json` | Build profiles — development, preview, production |
| `plugins/withAdiRegistration.js` | Config plugin that copies `adi-registration.properties` into Android assets |
| `assets/adi-registration.properties` | Google Play ownership verification token |
| `screenshots/` | All Play Store graphics and screenshots |
