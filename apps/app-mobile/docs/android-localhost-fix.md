# Android Emulator: `localhost` Does Not Resolve to Host Machine

## Problem

Login (and all API calls) fail on the Android emulator but work fine on the iOS simulator.

The root cause is that `localhost` behaves differently across platforms:

| Platform | `localhost` resolves to |
|---|---|
| iOS Simulator | Your Mac (host machine) ✅ |
| Android Emulator | The emulator itself ❌ |

Since `.env` uses `http://localhost:3001/graphql`, the Android emulator tries to reach its own port 3001 — which has nothing running — so every request fails.

## Fix

Use `adb reverse` to tunnel the Android emulator's `localhost:3001` to your Mac's `localhost:3001`:

```sh
adb reverse tcp:3001 tcp:3001
```

This keeps the `.env` unchanged and makes both platforms work with the same URL.

### When to run it

Run this once each time you:

- Start a new dev session with the Android emulator
- Restart the emulator
- Reconnect the emulator after it was killed

## Why Not Change `.env`?

| Option | Downside |
|---|---|
| `http://10.0.2.2:3001/graphql` | Android-only, breaks iOS |
| Machine's local IP (e.g. `192.168.1.x`) | Changes per network, breaks CI and teammates |
| `adb reverse` | No `.env` change needed, works for all teammates |

## Prerequisites

`adb` must be installed and on your PATH. See [android-adb-setup.md](./android-adb-setup.md) if `adb` is not found.
