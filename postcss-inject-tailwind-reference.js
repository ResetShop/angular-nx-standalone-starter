const THEME_ENTRY_SUFFIXES = ['tailwind.config.css', 'accessibility.css']

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
		const from = result.opts.from ?? ''
		if (THEME_ENTRY_SUFFIXES.some((suffix) => from.endsWith(suffix))) return

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
