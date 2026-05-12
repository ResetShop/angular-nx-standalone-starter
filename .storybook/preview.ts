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
		viewport: {
			options: {
				mobile: { name: 'Mobile (375px)', styles: { width: '375px', height: '667px' } },
				tablet: { name: 'Tablet (768px)', styles: { width: '768px', height: '1024px' } },
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
