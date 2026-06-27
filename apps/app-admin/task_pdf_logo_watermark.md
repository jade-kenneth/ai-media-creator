# PDF Logo Watermark — Implementation Plan

## Objective

Replace the plain text watermark (`OFFICIAL DOCUMENT`) on generated document PDFs with the **organization's logo**, rendered large and faint behind the document body — across all 11 document templates. Fall back to the existing text watermark when a organization has no logo set.

## Current State

- Organization logo (`logoUrl`) is already fetched and passed into the PDF pipeline:
  `pdf-download-sheet.tsx:204` → `OrganizationInfo.logoUrl` → `PdfHeader` (`pdf-header.tsx:21-27`), where it's shown small in the header.
- The watermark is a `Text` element rendered once per page in the shared layout:
  `pdf-document-layout.tsx:43-45`
  ```tsx
  <Text fixed style={pdfStyles.pageWatermark}>
    OFFICIAL DOCUMENT
  </Text>
  ```
- Its style is `pageWatermark` in `shared-styles.ts:34-45` — full-width text band at `top: 368`, `opacity: 0.12`.
- All 11 templates (`organization-clearance-pdf.tsx`, `certificate-of-residency-pdf.tsx`, etc.) render through this **one shared layout**, so the fix is centralized — no per-template changes needed.

## Affected Files

| File | Change |
|---|---|
| `apps/org-system-admin/features/requests/pdf/shared-styles.ts` | Add `pageWatermarkLayer` + `pageWatermarkLogo` styles; keep existing `pageWatermark` (text) as fallback style |
| `apps/org-system-admin/features/requests/pdf/pdf-document-layout.tsx` | Conditionally render logo `Image` watermark when `organization.logoUrl` is set, else fall back to `OFFICIAL DOCUMENT` text |

No other files (templates, header, footer, types) need changes — `OrganizationInfo.logoUrl` is already typed and threaded through.

---

## Step 1 — Add watermark styles

**File:** `shared-styles.ts`

Add two new styles near the existing `pageWatermark` (keep `pageWatermark` as-is for the fallback case):

```ts
pageWatermarkLayer: {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  alignItems: 'center',
  justifyContent: 'center',
},
pageWatermarkLogo: {
  width: 320,
  height: 320,
  objectFit: 'contain',
  opacity: 0.06,
},
```

- `opacity: 0.06` keeps the logo subtle enough not to interfere with text legibility (lower than the header logo's full opacity, and lower than the old text watermark's 0.12 since a full image reads "heavier" than thin text at the same alpha).
- `width/height: 320` centers a large mark within the A4 content area (page is ~595pt wide minus ~42pt frame padding either side ≈ 511pt usable — 320pt leaves comfortable margins).

## Step 2 — Swap the watermark in the shared layout

**File:** `pdf-document-layout.tsx`

Replace lines 43-45:

```tsx
<Text fixed style={pdfStyles.pageWatermark}>
  OFFICIAL DOCUMENT
</Text>
```

with:

```tsx
{organization.logoUrl ? (
  <View fixed style={pdfStyles.pageWatermarkLayer}>
    <Image src={organization.logoUrl} style={pdfStyles.pageWatermarkLogo} />
  </View>
) : (
  <Text fixed style={pdfStyles.pageWatermark}>
    OFFICIAL DOCUMENT
  </Text>
)}
```

Add `Image` to the existing `@react-pdf/renderer` import (`Page, Text, View` → `Image, Page, Text, View`).

## Step 3 — Verify rendering

1. Run the admin app, open a document request with status `Approved`, open the PDF download sheet.
2. **Organization with a logo set**: generate the PDF — confirm the logo appears centered behind the body content, faint enough to not obscure text, on every page (multi-page documents like Blotter Report / Katarungang Pamorganization).
3. **Organization without a logo**: confirm it falls back to the `OFFICIAL DOCUMENT` text watermark exactly as before (no regression).
4. Spot-check 2–3 templates (e.g. `organization-clearance-pdf.tsx`, `blotter-report-pdf.tsx`) since they have different body lengths/layouts — confirm watermark doesn't visually clash with the page frame border or footer.

## shadcn/ui Components

None. This is a `@react-pdf/renderer` rendering change only — no admin UI/dialog/page changes are required since the organization logo upload UI (`ImageUploadField` in `create-organization-dialog.tsx` / `update-organization-dialog.tsx`) already exists and is unchanged.

## Definition of Done

- [x] `pageWatermarkLayer` and `pageWatermarkLogo` styles added to `shared-styles.ts`
- [x] `pdf-document-layout.tsx` renders the organization logo as a centered, low-opacity watermark when `logoUrl` is set
- [x] Falls back to the original `OFFICIAL DOCUMENT` text watermark when no logo is set
- [ ] Verified on at least 3 of the 11 document templates, including a multi-page one (manual check pending)
- [ ] No regression to header logo or page frame/border (manual check pending)
</content>
