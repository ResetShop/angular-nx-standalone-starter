<!-- Source: extracted from packages/ui/src/theme/accessibility.css | Last updated: 2026-05-16 -->

# Accessibility Utilities

Global, opt-in CSS utilities motivated by accessibility standards rather than visual design. The CSS itself lives at `packages/ui/src/theme/accessibility.css` and is imported once from `tailwind.config.css`, so every utility documented here is available on any element across `apps/*` and `packages/ui` without per-component imports.

This file is the canonical narrative documentation for those utilities — rationale, usage, math, limitations, and review checklists. The CSS file stays minimal and points back here.

---

## `data-touch-target`

Extends an element's interactive hit area to at least 44px in both dimensions — the WCAG 2.5.5 Target Size (Minimum) requirement and the Apple HIG recommended minimum — **without changing the element's visual size**. Implemented as an invisible `::before` overlay anchored with `position: absolute` and the Tailwind `-inset-3` utility.

### Usage

Apply the attribute to any interactive element (or its semantic wrapper such as a `<label>`) that would otherwise be smaller than 44 × 44 px:

```html
<button appButton size="sm" data-touch-target>Save</button>

<label data-touch-target>
	<input type="checkbox" />
	<span>Enable notifications</span>
</label>
```

### Sizing math

`-inset-3` resolves to `calc(var(--spacing) * -3)` → **0.75rem (12 px)** with the default Tailwind `--spacing` token. The overlay therefore extends 12 px beyond every edge of the element's box. Applied to the two common small sizes in this project:

| Element                          | Base size | Effective hit area  |
| -------------------------------- | --------- | ------------------- |
| `appButton size="sm"`            | 32 × 32   | 56 × 56 (32 + 2×12) |
| Selector `<label>` row (compact) | ~20 high  | 44 high (20 + 2×12) |

Both clear the 44 px minimum.

### Known limitations

1. **Sibling overlap.** When elements sit close to siblings (for example, adjacent pagination number buttons with `gap-1`), the 12 px extensions of two neighbours overlap and can steal each other's clicks. **Mitigation:** apply `data-touch-target` selectively — for the pagination case, only on the `prev` / `next` buttons, not on every numbered button. The numbered buttons stay within their visible bounds and the prev/next get the comfortable hit area.

2. **Overflow clipping.** An ancestor with `overflow: hidden | auto | scroll` clips the `::before` overlay wherever it escapes the ancestor's box. The element's **base** hit area is unaffected; only the 12 px extension beyond the ancestor edge is lost. In practice this affects the topmost and bottommost rows inside scroll containers — for example the permission / role selector lists, which use `overflow-y-auto`. **This is accepted:** interior rows still get the full extension, and edge rows still have a comfortable hit area within the scroll viewport.

### `pointer-events: none` on `::before`

The overlay carries `pointer-events: none`. This is **defensive**. Current consumers are all interactive parents (`<label>`, `<button>`) where the click bubbles to the host regardless of which element is hit, so the rule is technically redundant today. It exists to prevent the overlay from intercepting clicks on **adjacent** interactive elements if a future consumer applies the attribute to a container whose extension overlaps an unrelated interactive sibling — a class of bug that would be invisible during development and only surface as "this button no longer responds on mobile."

---

## Review checklist for agents

When reviewing or planning UI changes, use the following checklist alongside the rest of CLAUDE.md:

- [ ] **New interactive element smaller than 44 × 44 px** (small button, compact checkbox row, icon-only control) carries `data-touch-target`, **unless** sibling overlap or overflow clipping make it unsafe — in which case the deviation is documented in code.
- [ ] **`data-touch-target` on elements with close siblings** (toolbar buttons, pagination numbers) has been reviewed for the sibling-overlap caveat. If overlap is possible, the attribute is applied selectively rather than to every sibling.
- [ ] **`data-touch-target` inside a scroll container** (anything with `overflow-y-auto`, `overflow-x-auto`, etc.) is acceptable — the limitation is known. Do **not** flag this as a bug.
- [ ] **Custom hit-area extensions** invented by individual components (e.g. inline `padding` hacks, transparent overlays, hand-rolled `::before` rules) should be flagged: the project has a single utility for this and proliferating alternatives defeats the centralization.
- [ ] **Visual padding is not a substitute** for `data-touch-target`. The attribute is specifically for cases where visual size must stay small but the hit area needs to be large.

---

## Future utilities

This section is a placeholder for additional accessibility utilities (focus-ring helpers, `prefers-reduced-motion` opt-outs, high-contrast variants, etc.) as they are added to `accessibility.css`. Document each new utility here with the same structure: purpose + standard reference, usage, math/rationale, limitations, and review checklist additions.
