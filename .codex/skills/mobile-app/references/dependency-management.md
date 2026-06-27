# Dependency Management

## Rules

Keep dependencies current and intentional.

- Prefer stable versions of dependencies unless the repository intentionally pins versions for compatibility.
- Review changelogs before major upgrades.
- Keep lockfiles updated.
- Verify the app builds and critical flows still work after dependency changes.
- Regularly check for stale packages to reduce technical debt and security risk.
- Prefer Expo-compatible packages before adding custom native dependencies.
- Run `npm audit` / `pnpm audit` regularly — fix critical and high vulnerabilities before release.

---

## Native Dependency Decision Guide

| Situation | Action |
| --- | --- |
| Need a device feature | Check Expo SDK first (`expo-camera`, `expo-haptics`, `expo-image`, etc.) |
| Expo package exists | Use it — no custom native build required |
| No Expo equivalent | Evaluate native library; confirm it works with Expo managed workflow or requires bare workflow |
| Library is unmaintained | Find an alternative or fork — do not take on dead dependencies |
