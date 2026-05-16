import type { Decorator, Preview } from '@storybook/angular'

export const tags = ['autodocs']

const preview: Preview = {
	parameters: {
		options: {
			storySort: {
				method: 'alphabetical',
			},
		},
		backgrounds: {
			options: {
				light: { name: 'light', value: '#ffffff' },
				dark: { name: 'dark', value: '#0a0a0a' },
			},
		},
		// Viewport presets are pinned to the Tailwind v4 breakpoint boundaries that this
		// codebase actually uses (sm: 640, md: 768, lg: 1024). xl/2xl/3xl variants are
		// not currently in use, so a single "Desktop" preset covers everything from lg up.
		// Each preset below is annotated with the active variant set so reviewers know
		// exactly which layout deltas they're exercising when switching presets.
		viewport: {
			options: {
				// Below the sm: breakpoint. Tests the "pure mobile" range: stacked selector
				// rows, text-base form inputs, em-dash separator hidden, single-column grids.
				mobile: { name: 'Mobile (375px)', styles: { width: '375px', height: '667px' } },

				// At the sm: breakpoint, below md:. Tests the sm-only band in isolation —
				// form typography switches to text-sm, selector rows go inline with em-dash,
				// but md: grid-column changes have not yet kicked in. Width is the Tailwind
				// sm boundary, not a specific phone landscape size.
				'mobile-landscape': {
					name: 'Mobile landscape (640px)',
					styles: { width: '640px', height: '800px' },
				},

				// At the md: breakpoint, below lg:. Tests md:grid-cols-2 layouts and the
				// md: padding step-up on cards. sm: variants are also active.
				tablet: { name: 'Tablet (768px)', styles: { width: '768px', height: '1024px' } },

				// Above the lg: breakpoint (and at the xl: boundary, though no xl: variants
				// exist in the codebase). Tests the persistent sidebar layout, lg:grid-cols-3,
				// and the lg:hidden mobile-drawer/hamburger trigger being hidden.
				desktop: { name: 'Desktop (1280px)', styles: { width: '1280px', height: '800px' } },
			},
		},
	},

	initialGlobals: {
		backgrounds: {
			value: 'light',
		},
	},
}

export default preview

// Defer class toggle until after Storybook renders the story frame
export const decorators: Decorator[] = [
	(story, context) => {
		const selectedBackground = context.globals['backgrounds']?.value

		setTimeout(() => {
			const isDark = selectedBackground === 'dark'

			document.documentElement.classList.toggle('dark', isDark)

			const sbdocsElements = document.querySelectorAll('.sbdocs')
			sbdocsElements.forEach((element) => {
				element.classList.toggle('dark', isDark)
			})
		}, 0)

		return story()
	},
]
