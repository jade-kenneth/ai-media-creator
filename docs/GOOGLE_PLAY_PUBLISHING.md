# Google Play publishing

The mobile boilerplate contains generic EAS build profiles in
`apps/app-mobile/eas.json`. Replace every placeholder in `app.json`, connect the
app to your own EAS project, and supply your own store assets before release.

## Prerequisites

- An Expo/EAS project owned by your organization
- A Google Play developer account
- Android package ID, signing credentials, privacy policy, and store listing
- Production API, Firebase, and push-notification configuration

## Build profiles

| Profile       | Artifact           | Intended use             |
| ------------- | ------------------ | ------------------------ |
| `development` | Development client | Local native development |
| `preview`     | APK                | Internal verification    |
| `production`  | AAB                | Play Console release     |

Build from the workspace root:

```bash
pnpm exec eas build --platform android --profile preview --project-dir apps/app-mobile
pnpm exec eas build --platform android --profile production --project-dir apps/app-mobile
```

Use a cloud build unless a reproducible local Android toolchain is required.

## Before the first release

1. Replace the Expo owner, EAS project ID, Android package, iOS bundle ID, URL
   scheme, display name, icons, splash art, and notification icon.
2. Add environment-specific Firebase configuration outside source control.
3. Build and exercise authentication, tenant selection, deep links, uploads,
   offline/error states, account deletion, and push registration on real devices.
4. Complete the Play Console app-access, data-safety, target-audience, content
   rating, privacy-policy, and store-listing sections for the actual product.
5. Upload to internal testing before promoting the same tested artifact.

## Subsequent releases

Update the user-facing version, let EAS increment the Android version code, run
the repository checks, build a new AAB, and add product-specific release notes.
Never reuse signing credentials or store assets from this boilerplate.
