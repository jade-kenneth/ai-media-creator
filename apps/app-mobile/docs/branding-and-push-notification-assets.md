# Mobile Branding and Push Notification Asset Notes

Last updated: 2026-04-19

## Summary

The mobile app branding was updated to:
- App display name: `Example Portal`
- Initial loading splash image: `assets/logo.png`
- Push notification icon image (Expo notifications plugin): `assets/logo.png`
- Android notification channel display name: `Example Portal`

## Files Updated

- `apps/org-system-mobile/app.json`
  - `expo.name` changed to `Example Portal`
  - `expo.plugins[expo-splash-screen].image` changed to `./assets/logo.png`
  - `expo.plugins[expo-notifications].icon` set to `./assets/logo.png`

- `apps/org-system-mobile/ios/OrganizationConnect/Info.plist`
  - `CFBundleDisplayName` changed to `Example Portal`

- `apps/org-system-mobile/features/notifications/push-notifications.ts`
  - Android default channel name changed from `Default` to `Example Portal`

- `apps/org-system-mobile/features/notifications/local-notification-testing.ts`
  - Android local test channel name changed from `Default` to `Example Portal`

## Important Notes

- Android notification icons are typically expected to be simple white glyphs on transparent background. Using a full image (like `logo.png`) may render differently across devices.
- Android notification channel metadata can be cached by the OS. If channel name changes do not appear, reinstall the app or clear app data.
- Because this project includes native folders (`android/`, `ios/`), app name changes should be kept in sync in both Expo config and native files.

## If You Need to Change Branding Again

1. Replace/update asset files in `apps/org-system-mobile/assets/`.
2. Update `apps/org-system-mobile/app.json` for `expo.name`, splash image, and `expo-notifications.icon`.
3. Update iOS display name in `apps/org-system-mobile/ios/OrganizationConnect/Info.plist` (`CFBundleDisplayName`).
4. Update Android channel names in:
   - `apps/org-system-mobile/features/notifications/push-notifications.ts`
   - `apps/org-system-mobile/features/notifications/local-notification-testing.ts`
5. Rebuild/reinstall app to verify branding and notification behavior.
