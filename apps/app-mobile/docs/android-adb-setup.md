# Android ADB Setup (macOS)

## Problem

Running `npx react-native log-android` or `adb reverse` fails with:

```
error spawnSync adb ENOENT
```

`adb` (Android Debug Bridge) is not installed or not on your PATH.

## Fix

### 1. Install Android SDK Platform Tools

Open **Android Studio** → SDK Manager → **SDK Tools** tab → check **Android SDK Platform-Tools** → Apply.

### 2. Add `adb` to your PATH

Add these lines to `~/.zshrc`:

```sh
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### 3. Reload your shell

```sh
source ~/.zshrc
```

### 4. Verify

```sh
adb --version
adb devices
```

You should see your emulator listed under `adb devices`.

<!-- ### Stop all Gradle daemons and wipe the broken caches: -->
