# 06 — Full-stack flows

Show how frontend, backend, and database connect by tracing complete flows.
Produce the "Full-stack flows" section of `index.html` and `learning-guide.md`.

## Flows to trace (include the ones that exist)

- Login flow
- Registration flow
- Generic API request flow
- Form submission flow
- File upload flow
- Admin approval flow (e.g. resident/registration approval)
- Notification flow
- Database read flow
- Database write flow
- Role-based access flow
- Error handling flow

## Each flow must answer

```
1. Where the action starts        (the user action + screen/page path:line)
2. Which frontend file is involved (hook/component path:line)
3. Which API endpoint is called    (query/mutation name)
4. Which backend file handles it    (resolver/controller path:line → service → repo)
5. Which DB table/collection is affected (model path:line)
6. What response returns
7. How the UI changes
8. What can go wrong (the failure mode)
```

Write each as a numbered trace. Pair the most important 2–3 flows with an animated
diagram (§09) embedded in this section.

## Grounding rules

- Every step cites a real `path:line`. If a step can't be located, keep the step
  and write `Not detected from current files.` rather than guessing.
- Prefer flows the scan clearly supports (auth module → login; a resolver +
  matching frontend mutation → that feature's flow).

## `learning-guide.md`

A markdown companion that lays out the same flows as prose + a short "read these
files in this order to follow the flow yourself" list. Auto-region markers.

## Output of this phase

- Full-stack flow traces (HTML section) + 2–3 embedded animated diagrams.
- `learning-guide.md`.
