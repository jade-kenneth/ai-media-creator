# React Native troubleshooting

This runbook covers recurring Expo monorepo issues for `apps/app-mobile`.

## Development client is not installed

`expo start --dev-client` requires a native development build on the device.

```bash
pnpm --filter app-mobile android
pnpm --filter app-mobile dev:client
```

Rebuild after changing native plugins, notification credentials, package IDs,
or files under `plugins/`.

## Duplicate React versions

Install from the repository root and keep the root React overrides aligned with
Expo's supported version.

```bash
pnpm install
pnpm -r list react react-dom
```

Avoid running a separate install inside `apps/app-mobile`.

## Metro or Expo Router cache errors

Start with a clean Metro cache:

```bash
pnpm --filter app-mobile start
```

The checked-in script already passes `--clear`. Verify that the app uses
`expo-router/entry` and has one active Babel configuration.

## Android native build failures

Use the JDK supported by the current Expo/React Native toolchain (normally the
Android Studio bundled runtime) and verify `ANDROID_HOME` before rebuilding.

```bash
cd apps/app-mobile/android
./gradlew app:assembleDebug -x lint -x test
```

Do not commit generated native folders unless the project intentionally uses
the bare/prebuild workflow.

## Push-token failures on Android

- Put the environment-specific `google-services.json` where Expo config expects
  it; never commit production credentials.
- Configure FCM credentials in Expo/EAS.
- Test with a development build or release build, not Expo Go.
- Rebuild after changing Firebase or `expo-notifications` configuration.

## Tunnel failures

Prefer LAN mode first. For a USB-connected Android device, reverse Metro's port:

```bash
adb reverse tcp:8081 tcp:8081
pnpm --filter app-mobile dev:client
```

Use the checked-in tunnel scripts only when LAN or USB access is unavailable.
