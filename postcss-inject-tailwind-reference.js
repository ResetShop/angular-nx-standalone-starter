/**
 * PostCSS plugin that auto-injects `@reference "#tailwind-theme"` at the top of every component
 * stylesheet that uses `@apply`, so the utilities resolve against the theme without the directive
 * having to live in source.
 *
 * Registered first in `.postcssrc.json`, it runs before `@tailwindcss/postcss` in all three build
 * pipelines that read that config (the Angular esbuild builder, Storybook's webpack postcss-loader,
 * and Vite/Vitest). The reference is prepended as a top-level at-rule — never nested in a rule —
 * because it carries `@source` resolution, which Tailwind v4 forbids inside a rule block.
 *
 * Three guards:
 *  - Theme-entry files (imported into `tailwind.config.css`) must reference `tailwindcss` directly;
 *    injecting the `#tailwind-theme` alias into the theme it composes would be a circular reference.
 *  - Only stylesheets that use `@apply` are injected — `@reference` exists solely to resolve `@apply`.
 *    Global/entry stylesheets (e.g. `styles.css`) instead `@import` the theme to EMIT it; adding a
 *    `@reference` there double-references the theme and suppresses its `@theme` output (the
 *    `--font-*` tokens etc.), which is why injecting everywhere broke font application.
 *  - Idempotent: a stylesheet that already declares `@reference` keeps its own and is left untouched.
 *
 * @type {import('postcss').PluginCreator}
 */
const plugin = () => ({
	postcssPlugin: 'postcss-inject-tailwind-reference',
	Once(root, { postcss, result }) {
		// Theme-entry files compose the theme itself and must reference `tailwindcss` directly;
		// injecting the `#tailwind-theme` alias into them would be a circular reference. Match on a
		// normalized path (specific to the theme dir / repo root) so the separator does not matter.
		const from = (result.opts.from ?? '').replace(/\\/g, '/')
		const themeEntrySuffixes = ['/tailwind.config.css', '/theme/accessibility.css']
		if (themeEntrySuffixes.some((suffix) => from.endsWith(suffix))) return

		// Only inject where it is needed: `@reference` exists to make `@apply` resolve against the
		// theme. A stylesheet with no `@apply` (a global entry, a plain reset, an empty stub) does not
		// need it — and injecting it into a stylesheet that already `@import`s the theme suppresses the
		// theme's emitted `@theme` tokens.
		let usesApply = false
		root.walkAtRules('apply', () => {
			usesApply = true
		})
		if (!usesApply) return

		// Idempotent: leave any stylesheet that already declares an `@reference` untouched. This both
		// avoids re-injecting our directive on watch-mode rebuilds and respects a hand-written one.
		for (const node of root.nodes) {
			if (node.type === 'atrule' && node.name === 'reference') return
		}

		root.prepend(
			postcss.atRule({
				name: 'reference',
				params: '"#tailwind-theme"',
				raws: { afterName: ' ', between: '', semicolon: true, after: '\n\n' },
			}),
		)
	},
})

plugin.postcss = true

export default plugin
