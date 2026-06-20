/**
 * PostCSS plugin that auto-injects `@reference "#tailwind-theme"` at the top of every component
 * stylesheet, so `@apply` resolves against the theme without the directive having to live in source.
 *
 * Registered first in `.postcssrc.json`, it runs before `@tailwindcss/postcss` in all three build
 * pipelines that read that config (the Angular esbuild builder, Storybook's webpack postcss-loader,
 * and Vite/Vitest). The reference is prepended as a top-level at-rule — never nested in a rule —
 * because it carries `@source` resolution, which Tailwind v4 forbids inside a rule block.
 *
 * Two guards:
 *  - Theme-entry files (imported into `tailwind.config.css`) must reference `tailwindcss` directly;
 *    injecting the `#tailwind-theme` alias into the theme it composes would be a circular reference.
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
