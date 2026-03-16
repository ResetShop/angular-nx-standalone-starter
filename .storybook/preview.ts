import type { Preview } from '@storybook/angular'

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
	},

	initialGlobals: {
		backgrounds: {
			value: 'light',
		},
	},
}

export default preview

// Global decorator to handle dark mode
export const decorators = [
	(story: any, context: any) => {
		const selectedBackground = context.globals.backgrounds?.value

		// Use setTimeout to ensure DOM is ready
		setTimeout(() => {
			const isDark = selectedBackground === 'dark'

			// Apply to document root
			document.documentElement.classList.toggle('dark', isDark)

			// Also apply to all .sbdocs elements (Storybook docs containers)
			const sbdocsElements = document.querySelectorAll('.sbdocs')
			sbdocsElements.forEach((element) => {
				element.classList.toggle('dark', isDark)
			})
		}, 0)

		return story()
	},
]
