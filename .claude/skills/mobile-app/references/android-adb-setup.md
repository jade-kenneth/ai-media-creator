# Android Build Setup (macOS)

## EAS Local Build — Correct Command

```bash
JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home ANDROID_HOME=$HOME/Library/Android/sdk eas build -p android --profile preview --local
```

Both env vars must be prepended inline — sourcing `~/.zshrc` alone is not enough because EAS spawns its own subprocess.

---

## Java

- Must use **Java 17** (not 24 — Java 24 breaks native CMake builds with "restricted method" error)
- Java 17 installed via Homebrew: `/opt/homebrew/opt/openjdk@17`
- Java 24 is at `$HOME/OpenJDK/jdk-24.0.2.jdk` — do not use

`~/.zshrc` Java config (correct state):

```sh
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export PATH=$JAVA_HOME/bin:$PATH
```

---

## Android SDK

- Installed at `$HOME/Library/Android/sdk`
- Must be set via `ANDROID_HOME` — EAS local build does not inherit shell env automatically

Add to `~/.zshrc` for ADB access:

```sh
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

Verify ADB:

```sh
adb --version
adb devices
```

---

## Gradle Version

- **Use `8.13`** — set in `apps/*-mobile/android/gradle/wrapper/gradle-wrapper.properties`
- **Do not upgrade to 8.14.x** — confirmed bug where `metadata.bin` files in the Kotlin DSL cache are never created, crashing both `expo run:android` and `eas build --local`

---

## Gradle Daemon Stale State

When any Android build fails with:

```
Could not read workspace metadata from ~/.gradle/caches/<version>/<dsl-type>/.../metadata.bin
> metadata.bin (No such file or directory)
```

**Root cause:** Stale Gradle daemons hold a lock on the DSL workspace cache, preventing `metadata.bin` from being written.

**Fix — Gradle 8.13 (`expo run:android` / direct `gradlew`):**

```bash
~/.gradle/wrapper/dists/gradle-8.13-bin/5xuhj0ry160q40clulazy9h7d/gradle-8.13/bin/gradle --stop
rm -rf ~/.gradle/caches/8.13/kotlin-dsl/
```

**Fix — Gradle 8.14.3 (EAS local build):**

```bash
~/.gradle/wrapper/dists/gradle-8.14.3-bin/cv11ve7ro1n3o1j4so8xd9n66/gradle-8.14.3/bin/gradle --stop
rm -rf ~/.gradle/caches/8.14.3/groovy-dsl/
```

Retry the build after either fix — Gradle will reinitialize the cache cleanly.

---

## Past Errors and Fixes

| Error | Cause | Fix |
|---|---|---|
| `restricted method in java.lang.System` | Java 24 incompatible with Gradle/CMake | Switch to Java 17 |
| `Unable to locate a Java Runtime` | Java PATH not set | `source ~/.zshrc` or prepend `JAVA_HOME` inline |
| `ENOSPC: no space left on device` | Disk full during `npm ci` | Clear caches (see below) |
| `SDK location not found` | `ANDROID_HOME` not set in EAS subprocess | Prepend `ANDROID_HOME=$HOME/Library/Android/sdk` inline |
| `Could not read workspace metadata from .../metadata.bin` | Stale Gradle daemons / 8.14.x bug | Stop daemons and delete DSL cache (see above) |
| `globalconfig and/or prefix setting incompatible with nvm` | nvm prefix conflict | `nvm use --delete-prefix v22.15.0 --silent` |

---

## Disk Space

Android builds need ~5–10 GB free. Clear with:

```bash
npm cache clean --force
rm -rf ~/.gradle/caches/
rm -rf /var/folders/2q/3slkmgv94sv3c_75h8fwm2h00000gn/T/eas-build-local-nodejs/
```
