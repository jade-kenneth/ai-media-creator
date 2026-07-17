# Boilerplate update workflow

Each product created from this template is an independent repository. Its
`origin` remote points to the product, while its `boilerplate` remote points to
`jade-kenneth/app-boilerplate`.

## Initialize a new product

Run this once immediately after creating the product repository:

```bash
npm run boilerplate:setup
git add boilerplate.lock.json
git commit -m "chore: record boilerplate starting revision"
```

The command safely adds the `boilerplate` remote when missing, fetches `main`,
and detects the revision the product was actually created from. It uses shared
Git history for a normal clone and the initial tree for a GitHub template copy.
It never silently marks a newer upstream revision as reviewed. Re-running it is
safe, and it refuses to overwrite a remote with an unexpected URL.

If the source revision cannot be detected, provide the exact commit explicitly:

```bash
npm run boilerplate:setup -- --sha <full-source-sha>
```

If the same source tree appears at multiple upstream revisions, setup treats the
match as ambiguous and requires this explicit SHA rather than marking a newer
revision as reviewed.

## Check for updates

```bash
npm run boilerplate:check
```

The command fetches upstream and lists commits after the reviewed revision. The
classification is a conventional-commit heuristic, so inspect the actual diff:

```bash
git log --oneline <reviewed-sha>..boilerplate/main
git show <commit-sha>
```

## Port reviewed commits

Create a dedicated product branch, inspect every candidate diff, and preview the
explicit commits you selected:

```bash
git switch -c chore/update-boilerplate
npm run boilerplate:port -- \
  --dry-run \
  --sha <full-40-character-sha> \
  --sha <another-full-40-character-sha>
```

When the preview is correct, remove `--dry-run`:

```bash
npm run boilerplate:port -- \
  --sha <full-40-character-sha> \
  --sha <another-full-40-character-sha>
```

The command fetches the configured `boilerplate/main`, accepts only explicit full
SHAs from the unreviewed range after `reviewedThroughSha`, sorts selections by
upstream history, and applies them with `git cherry-pick -x`. It refuses to run:

- inside `app-boilerplate` itself;
- on `main`, `master`, the configured default branch, or detached HEAD;
- with a dirty worktree or unfinished cherry-pick;
- for a commit outside the permitted unreviewed range;
- for a merge commit or a commit already applied by lock record, ancestry, or
  cherry-pick provenance.

Merge commits are never given an automatic mainline parent. Inspect the merge and
select its applicable constituent commits explicitly.

Successful SHAs are appended to `boilerplate.lock.json.appliedUpdates` without
advancing `reviewedThroughSha`. The command does not commit the lock. If a
cherry-pick conflicts, Git's conflict state is preserved; resolve it semantically
and run:

```bash
git cherry-pick --continue
```

or abandon that cherry-pick with:

```bash
git cherry-pick --abort
```

The command never resolves conflicts or acknowledges updates automatically. Run
affected product tests after porting.

After every commit through a revision has been deliberately applied or declined:

```bash
npm run boilerplate:ack -- --sha <full-40-character-sha>
git add boilerplate.lock.json
git commit -m "chore: record reviewed boilerplate updates"
```

Acknowledging means the team reviewed every upstream commit through that SHA. It
does not copy code, apply commits, or infer that every available change was
accepted. Keep acknowledgement separate and run it only after every commit through
the selected boundary was applied or deliberately declined. The scheduled
`boilerplate-drift` workflow repeats the check weekly and writes available updates
to the GitHub Actions job summary.

## Detect reusable discoveries

Product PRs run `npm run boilerplate:contributions`. The command compares the PR
with its base branch and reports changes under reusable architecture paths such
as API common/libs and standard modules, GraphQL and React Query clients,
providers, shared packages, and CI/scripts. The protected surface is declared in
`boilerplate-sync.config.json`; the most specific matching pattern wins, so the
enumerated standard API modules stay foundation even though
`apps/app-api/src/modules/**` is product-owned by default.

Path detection cannot decide business intent, so the PR author must classify
every reported change, and in pull request CI the check **fails until a
classification is declared**. Declare it with one of:

- a PR label: `foundation:reusable`, `foundation:product-specific`, or
  `foundation:backported`;
- a line in the PR description: `Foundation-Change: <classification>`.

The classifications mean:

- **product-specific** stays only in the product repository.
- **reusable** is reimplemented or ported without product terminology to a new
  `app-boilerplate` branch, with a regression test.
- **backported** is fixed in the product immediately and then ported upstream.

Outside pull request CI the command stays advisory. API product modules/scripts
and web/mobile app/feature folders are treated as product-owned by default.
Architecture, common utilities, integrations, and shared infrastructure remain
possible reusable foundations.

`.github/CODEOWNERS` mirrors the foundation surface, so foundation changes also
request a review from the boilerplate maintainer. Keep CODEOWNERS and
`boilerplate-sync.config.json` in sync when the surface changes.

## Contribute reusable changes upstream

Once a change is classified **reusable** or **backported**, port it to
`app-boilerplate` from the product repository:

```bash
npm run boilerplate:contribute -- --dry-run --sha <full-40-character-sha>
npm run boilerplate:contribute -- --sha <full-40-character-sha> [--branch <name>]
```

The command accepts only explicit full SHAs from the product's history, refuses
merge commits, and refuses any commit that touches paths outside the foundation
surface — split mixed commits first so the upstream contribution is
foundation-only. It then creates a contribution branch in a temporary worktree
based on the fetched `boilerplate/main` and applies the commits with
`git cherry-pick -x`. Review the worktree, push the branch upstream (or to a
fork), and open a pull request against `app-boilerplate`. The maintainer accepts
or rejects the standard change there; nothing lands upstream without that PR
review.

## Detect foundation drift

```bash
npm run boilerplate:foundation-drift [-- --strict]
```

The command compares every foundation path against the reviewed upstream
revision and classifies each difference:

- **Pending acknowledgement** — the file matches a newer upstream revision (a
  ported update); finish the review and run `npm run boilerplate:ack`.
- **Diverged locally** — the file was changed or added in the product; classify
  the divergence and contribute reusable parts upstream with
  `npm run boilerplate:contribute`, or record why it stays product-specific.

The scheduled `boilerplate-drift` workflow runs this weekly alongside the update
check and writes the report to the job summary. With `--strict` the command
exits non-zero when local divergence exists, for teams that want a hard gate.
