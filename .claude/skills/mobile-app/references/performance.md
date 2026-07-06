# Performance Standards

## Priority Order

Protect perceived performance by default. Optimize in this order:

1. App startup and first screen render
2. Input responsiveness
3. Scroll performance
4. Layout stability

---

## Rules

- Optimize the largest visible content first.
- Avoid unnecessary re-renders in large lists and heavy screens.
- Use `FlatList` or `SectionList` for long collections instead of mapping everything in a `ScrollView`.
- Memoize expensive derived values only when profiling shows it helps.
- Code-split or lazy-load heavy optional flows when appropriate.
- Lazy-load large non-critical features such as charts, maps, editors, and heavy modals only when needed.
- Avoid long synchronous tasks in render paths and event handlers.
- Keep images sized correctly and compressed appropriately.
- Reserve layout space for images and delayed content when possible to reduce visible jumping.
- Prefer preserving user context with inline flows rather than unnecessary full-screen navigation.

---

## Reporting Requirement

When making a performance-focused change, state which metric is expected to improve and why.

| Metric | What it measures |
| --- | --- |
| Startup time | Time to first interactive screen |
| Input latency | Time from tap/type to visual response |
| Scroll FPS | Smoothness of list and scroll interaction |
| Layout stability | Absence of content jumping after load |

---

## Related References

- `references/react-hooks.md` — when `useMemo`/`useCallback` actually help (memoize only after profiling)
- `references/ux-patterns.md` § Lists — `FlatList`/`SectionList` usage for long collections
- `references/caching.md` — prefetching and cache strategy to cut perceived load time
- `references/common-anti-patterns.md` — unnecessary re-renders and effect loops that regress the metrics above
