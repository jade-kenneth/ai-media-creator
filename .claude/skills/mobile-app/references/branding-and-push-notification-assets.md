# Mobile Branding and Push Notification Assets

## What to Configure

- **App display name** — shown on the home screen and in the app switcher
- **Splash screen image** — displayed during app load
- **Push notification icon** — shown in the notification tray (Android)
- **Android notification channel name** — displayed in system notification settings

## Files to Update

| File                                                                           | What to change                                                                                 |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `apps/*-mobile/app.json`                                             | `expo.name`, `expo.plugins[expo-splash-screen].image`, `expo.plugins[expo-notifications].icon` |
| `apps/*-mobile/ios/<AppName>/Info.plist`                             | `CFBundleDisplayName`                                                                          |
| `apps/*-mobile/features/notifications/push-notifications.ts`         | Android default channel name                                                                   |
| `apps/*-mobile/features/notifications/local-notification-testing.ts` | Android local test channel name                                                                |

## Steps to Change Branding

1. Replace or add asset files in `apps/*-mobile/assets/`.
2. Update `apps/*-mobile/app.json`:
   - `expo.name` — app display name
   - `expo.plugins[expo-splash-screen].image` — path to splash image
   - `expo.plugins[expo-notifications].icon` — path to notification icon
3. Update `CFBundleDisplayName` in `apps/*-mobile/ios/<AppName>/Info.plist`.
4. Update Android notification channel names in:
   - `apps/*-mobile/features/notifications/push-notifications.ts`
   - `apps/*-mobile/features/notifications/local-notification-testing.ts`
5. Rebuild and reinstall the app to verify branding and notification behavior.

## Important Notes

- **Android notification icons** must be simple white glyphs on a transparent background. Full-color images will render incorrectly on most devices.
- **Android notification channel metadata** is cached by the OS. If channel name changes do not appear, reinstall the app or clear app data.
- **Native folders present** — if the project includes `android/` and `ios/` directories, app name changes must be kept in sync in both the Expo config and the native files.
- **iOS** — changes to `expo.name` alone are not enough when native folders exist; `CFBundleDisplayName` in `Info.plist` must also be updated.
