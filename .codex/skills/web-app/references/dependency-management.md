# Dependency Management

## Dependency Management Rules

Keep dependencies current and intentional.

- Prefer the latest stable versions of dependencies unless the repository intentionally pins versions for compatibility.
- Review changelogs before major upgrades.
- Keep lockfiles updated.
- Verify the app builds and critical flows still work after dependency changes.
- Regularly check for stale packages to reduce technical debt and security risk.

---

## Keep Dependencies Current

- Install the latest stable versions of all dependencies.
- Run `npm outdated` regularly to identify stale packages (use the repo's package manager — this monorepo uses npm workspaces).
- Review changelogs for breaking changes before major version upgrades.
- Update lockfiles and verify builds after every dependency change.
- Schedule regular maintenance (weekly or biweekly) for dependency updates.

**Why:** Latest versions include security patches, performance improvements, and bug fixes. Falling behind creates compounding technical debt — major version gaps become increasingly risky to bridge.

---

## Upgrade Workflow

1. Run `npm outdated` to see what's behind.
2. Update patch and minor versions together: `npm update` (or selectively per package).
3. For major version bumps, read the changelog and migration guide first.
4. Run `npx nx run-many -t build,lint,typecheck` after updates to catch regressions.
5. Commit lockfile changes in a dedicated dependency-update commit for clean history.

---

## Rules

| Rule | Why |
| --- | --- |
| Never pin to a patch version without a documented reason | Makes updates harder, hides legitimate fixes |
| Do not add a new library if an existing one already solves the problem | Reduces bundle size and maintenance surface |
| Remove unused dependencies | Dead weight in the bundle and lockfile |
| Prefer packages with active maintenance and strong TypeScript support | Reduces long-term risk |
| For security advisories, patch immediately regardless of the update schedule | Security vulnerabilities don't wait for maintenance windows |

---

## Related References

- `references/security.md` — security advisories and third-party review rules
- `references/eslint-prettier.md` — keeping tooling configs current when upgrading
