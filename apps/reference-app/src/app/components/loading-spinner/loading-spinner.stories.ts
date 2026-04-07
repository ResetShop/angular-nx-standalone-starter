import { LoadingSpinnerComponent } from '@resetshop/ui/loading-spinner/loading-spinner.component'
import type { Meta, StoryObj } from '@storybook/angular'

const meta: Meta<LoadingSpinnerComponent> = {
	component: LoadingSpinnerComponent,
	title: 'Components/Loading Spinner',
	tags: ['autodocs'],
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component: `
A full-screen loading overlay that blocks user interaction while a global operation is in progress.

## Features

- **Fixed Overlay**: Covers the entire viewport with a dark backdrop (\`bg-black/95\`)
- **Centered Card**: Displays a card with an animated ring spinner and "Loading..." text (overridable via the \`message\` input)
- **Dialog Element**: Uses native \`<dialog>\` for proper stacking and focus trapping
- **UIStore Integration**: Conditionally rendered in the Dashboard layout when \`UIStore.isGlobalLoading()\` is \`true\`

## Usage

\`\`\`html
@if (uiStore.isGlobalLoading()) {
  <app-loading-spinner />
}
\`\`\`
				`,
			},
			canvas: {
				sourceState: 'shown',
			},
		},
	},
}

export default meta

type Story = StoryObj<LoadingSpinnerComponent>

/**
 * Full-screen loading overlay with centered spinner card.
 * In production, this is rendered inside the Dashboard layout and covers the entire viewport.
 * In Storybook, the fixed positioning makes it fill the story canvas.
 */
export const Default: Story = {}
