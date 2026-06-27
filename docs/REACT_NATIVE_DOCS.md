# React Native Mobile Troubleshooting (org-system-mobile)

This runbook documents the issues we encountered in `apps/org-system-mobile` and how to fix them quickly.

## 1) `No development build (...) for this project is installed`

### Error
`CommandError: No development build (com.jeidochan.orgsystemmobile) for this project is installed.`

### Cause
You started a dev-client session without installing a native dev build on the device/emulator.

### Fix
1. Build and install a dev client:
```bash
cd apps/org-system-mobile
npx expo run:android
```
2. Start Metro for dev client:
```bash
npx expo start --dev-client
```
3. If using EAS development build:
```bash
npx eas build --platform android --profile development
```
4. If package/application ID changed, uninstall old app from device and reinstall.

---

## 2) Duplicate React versions in monorepo

### Error
Example:
`Found duplicates for react: react@X (node_modules/react) and react@Y (../../node_modules/react)`

### Cause
Workspace hoisting + app-level installs can create mismatched React versions.

### Fix
1. Keep a single React/ReactDOM version via root overrides in `package.json`:
```json
"overrides": {
  "react": "19.1.0",
  "react-dom": "19.1.0"
}
```
2. Install dependencies from workspace root only.
3. Remove app-local `node_modules` if needed, then reinstall from root:
```bash
rm -rf apps/org-system-mobile/node_modules
npm install
```
4. Recheck:
```bash
npm ls react react-dom
```

---

## 3) Expo Router bundling error (`EXPO_ROUTER_APP_ROOT`)

### Error
`Invalid call at line 2: process.env.EXPO_ROUTER_APP_ROOT`

### Cause
Babel config is incorrect, duplicated, or the Expo Router Babel plugin is not running.

### Fix
1. Keep one active Babel config for the app (avoid conflicting duplicate configs).
2. Ensure Expo Router plugin is included:
```js
module.exports = {
  presets: ['babel-preset-expo', 'nativewind/babel'],
  plugins: ['expo-router/babel'],
};
```
3. Clear Metro cache:
```bash
npx expo start -c
```

---

## 4) Android CMake configure fails for Expo/Worklets/Screens

### Error
Tasks fail like:
- `:expo-modules-core:configureCMakeDebug[arm64-v8a]`
- `:react-native-worklets:configureCMakeDebug[arm64-v8a]`
- `:react-native-screens:configureCMakeDebug[arm64-v8a]`

Message:
`WARNING: A restricted method in java.lang.System has been called`

### Cause
JDK 24+ + Android/Gradle prefab flow can surface restricted native-access warnings as fatal.

### Fix options
1. Preferred: use JDK 21 (Android Studio JBR):
```bash
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew app:assembleDebug
```
2. Keep compatibility flag in `apps/org-system-mobile/android/gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m --enable-native-access=ALL-UNNAMED
```

---

## 5) Push token fetch fails: `Default FirebaseApp is not initialized`

### Error
`Default FirebaseApp is not initialized in this process ...`

### Cause
Firebase Android integration is incomplete, or app was not rebuilt after native config changes.

### Required setup
1. Put `google-services.json` in:
`apps/org-system-mobile/android/app/google-services.json`
2. Add Google Services plugin classpath in project Gradle:
`apps/org-system-mobile/android/build.gradle`
```gradle
classpath('com.google.gms:google-services:4.4.2')
```
3. Apply plugin in app Gradle:
`apps/org-system-mobile/android/app/build.gradle`
```gradle
apply plugin: "com.google.gms.google-services"
```
4. Add Firebase BoM in app dependencies:
```gradle
implementation platform('com.google.firebase:firebase-bom:34.12.0')
```
5. Add Firebase product dependency as needed (example):
```gradle
implementation 'com.google.firebase:firebase-messaging'
```
6. Rebuild native app (required after any native Gradle/Firebase change):
```bash
cd apps/org-system-mobile
npx expo run:android
```

### Notes
- Expo Go is not enough for this push setup; use a development build/dev client.
- Expo push still requires FCM credentials configured in Expo/EAS for Android delivery.

---

## 6) `Plugin with id 'com.google.gms.google-services' not found`

### Cause
Plugin applied at app-level but missing classpath in project-level Gradle.

### Fix
Ensure both are present:
1. `android/build.gradle` has classpath:
```gradle
classpath('com.google.gms:google-services:4.4.2')
```
2. `android/app/build.gradle` applies:
```gradle
apply plugin: "com.google.gms.google-services"
```

---

## 7) Quick verification commands

From `apps/org-system-mobile/android`:
```bash
./gradlew app:assembleDebug -x lint -x test -PreactNativeArchitectures=arm64-v8a
```

With Android Studio JDK 21 explicitly:
```bash
JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" ./gradlew app:assembleDebug -x lint -x test -PreactNativeArchitectures=arm64-v8a
```

From `apps/org-system-mobile`:
```bash
npx expo start --dev-client
```

---

## 8) `npx expo start --tunnel` fails with `remote gone away`

### Error
`CommandError: failed to start tunnel`
`remote gone away`

### Cause
Usually network/tunnel transport related (VPN/proxy/firewall/ISP or temporary tunnel backend issue), not app code.

### Fix
1. Install tunnel dependency in the mobile app (one-time):
```bash
cd /Users/jadekennethdarunday/personal/org-system
npm install -D -w apps/org-system-mobile @expo/ngrok
```
2. Use LAN mode first (fastest unblock):
```bash
cd apps/org-system-mobile
npx expo start --host lan
```
3. Restart tunnel cleanly:
```bash
pkill -f "expo|ws-tunnel|ngrok" || true
cd apps/org-system-mobile
npx expo start --tunnel --clear
```
4. Run with debug logs:
```bash
cd apps/org-system-mobile
EXPO_DEBUG=1 npx expo start --tunnel
```
5. Disable VPN/proxy temporarily or switch network (for example, mobile hotspot), then retry.
6. For Android on USB (no tunnel required):
```bash
adb reverse tcp:8081 tcp:8081
cd apps/org-system-mobile
npx expo start --host localhost --dev-client
```

### Project scripts added
From `apps/org-system-mobile/package.json`:
```bash
npm run dev:tunnel
npm run dev:tunnel:debug
```
