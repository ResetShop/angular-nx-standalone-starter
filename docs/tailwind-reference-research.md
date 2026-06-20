# Tailwind `@reference` Elimination — Research & Decision (#489)

## Decision

**Avenue C — reduce-only.** Migrate qualifying `:host { @apply … }` rules to `host: { class }`, standardize the `@reference` target across consumer stylesheets, and **keep `@apply`/`@reference` where it earns its place** (projected-child rules and standalone stylesheets). Full project-wide elimination of `@apply`/`@reference` (avenues A and B) is **not** pursued in this change.

This was a deliberate scope decision: the value of the work is convention alignment and dead-CSS removal, not payload reduction (see the measured delta below) or directive elimination.

## Measured payload delta

App production CSS (`dist/reference-app/browser/*.css`), cold `npm run build`:

| Build               | Total CSS          | Files |
| ------------------- | ------------------ | ----- |
| `main` (before)     | 49,292 B           | 1     |
| this branch (after) | 49,531 B           | 1     |
| **delta**           | **+239 B (+0.5%)** | —     |

The migration **slightly increases** payload. Moving host utilities to `host: { class }` emits them once in the global layer (most were already there from template usage), while the per-component encapsulated `:host` rules they replace were tiny. Net change is within noise and is an increase, not a reduction — confirming payload was never the justification. (Storybook payload is dominated by the same global layer; it was not separately diffed to conserve build cycles, and is expected to be comparably negligible.)

## Key finding — the two `@reference` targets are NOT interchangeable

`#tailwind-theme` is a `package.json` `imports` alias:

- root `package.json`: `"#tailwind-theme": "./tailwind.config.css"`
- `packages/ui/package.json`: `"#tailwind-theme": "./src/theme/tailwind-theme.css"` → which re-imports `tailwind.config.css`

`tailwind.config.css` carries `@source 'apps'` / `@source 'packages'`. That has two consequences that make a blanket "standardize to one string" impossible:

1. **Theme-entry files must use `@reference "tailwindcss"`, not `#tailwind-theme`.** `tailwind.config.css` does `@import './packages/ui/src/theme/accessibility.css'`, so `accessibility.css` is _part of_ the theme that `#tailwind-theme` resolves to. Pointing it at `#tailwind-theme` is circular → build error: `Exceeded maximum recursion depth while resolving '#tailwind-theme'`. It must reference the upstream package (`tailwindcss`) directly.

2. **A `@reference "#tailwind-theme"` must sit at the top of the stylesheet, never nested inside a rule.** Because `#tailwind-theme` pulls in `tailwind.config.css`'s `@source`, placing the `@reference` inside a `:host { … }` block makes the `@source` nested → build error: `` `@source` cannot be nested. `` (`@reference "tailwindcss"` did not trip this because the package entry carries no `@source`.) `dashboard.ts` had its `@reference` nested in `:host`; it was hoisted to the top of the `styles` block.

**Resulting convention (this is the standardization):**

| Stylesheet kind                                                                                        | Target                                                       | Why                                                                |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------ |
| Isolated consumer styles (app components, `packages/ui` components, component `.css`)                  | `@reference "#tailwind-theme"`, at the top of the stylesheet | resolves the project theme layer; the generator already emits this |
| Theme-entry files imported into `tailwind.config.css` (e.g. `packages/ui/src/theme/accessibility.css`) | `@reference "tailwindcss"`                                   | cannot self-reference the theme they compose                       |

So acceptance criterion "standardize to a single form" is satisfied **for all consumers** (`#tailwind-theme`); `accessibility.css` is a documented, structurally-required exception.

## Avenues considered (not adopted now)

- **A — build-time auto-injection** (prepend `@reference` to every component stylesheet via a build step, deleting it from source while keeping `@apply`). Still the most promising path to _fully_ removing the directive from source without rewriting CSS. Deferred: it requires changes to the Angular/esbuild + Tailwind v4 style pipeline and a generator update, out of scope for this reduce-only pass. Recommended as the follow-up if full elimination is later desired.
- **B — rewrite `@apply` → raw CSS using theme `var(--…)`**. Removes `@apply`/`@reference` but is verbose and fragile for ring/shadow/variant utilities (e.g. `form-field`'s input rules). Not recommended; high authoring/maintenance cost, ~zero payload benefit (final CSS is token-referenced either way).

## What still uses `@apply`/`@reference` after this change (by design)

- Projected-child rules: `button.ts` (`::ng-deep [data-icon]`), `form-field.ts` (`::ng-deep input/select/textarea`).
- Conditional/nested host rules: `nav-item.ts` (`:host(.collapsed)`), `sidebar.ts`, and `dashboard.ts`'s remaining grid layout.
- Standalone stylesheets: `select.css`, `combobox.css`, `toast-notification.css`, `accessibility.css`.

These are left intentionally — `host: { class }` cannot express projected-child, conditional, or non-utility (custom-property / grid-template / `@media`) styling, and rewriting them to raw CSS (avenue B) was rejected.
