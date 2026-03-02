import type { Meta, StoryObj } from '@storybook/angular';
import { Spinner } from './spinner';

const meta: Meta<Spinner> = {
	component: Spinner,
	title: 'Components/Spinner',
	tags: ['autodocs'],
	parameters: {
		docs: {
			description: {
				component: `
A lightweight spinner component for indicating loading states.

## Features

- **SVG-Based**: Clean animated spinner using SVG
- **Inherits Color**: Uses \`currentColor\` to match parent text color
- **Accessible**: Hidden from screen readers via \`aria-hidden\`
- **Inline Display**: Renders as an inline-flex element for easy placement

## Usage

\`\`\`html
<app-spinner />
\`\`\`
				`,
			},
			canvas: {
				sourceState: 'shown',
			},
		},
	},
};

export default meta;

type Story = StoryObj<Spinner & { size: string }>;

/**
 * Default spinner with interactive size control.
 */
export const Default: Story = {
	args: {
		size: 'size-5',
	},
	argTypes: {
		size: {
			control: 'select',
			options: ['size-3', 'size-4', 'size-5', 'size-6', 'size-8', 'size-10', 'size-12'],
			description: 'Tailwind size class passed via [class] on the host element',
			table: {
				defaultValue: { summary: 'size-5' },
			},
		},
	},
	render: (args) => ({
		props: args,
		template: `
			<div class="space-y-4">
				<div>
					<h3 class="text-sm font-semibold text-gray-900 mb-2">Light</h3>
					<div class="bg-white p-4 rounded border border-gray-200 text-gray-500">
						<app-spinner [class]="size" />
					</div>
				</div>
				<div>
					<h3 class="text-sm font-semibold text-gray-900 mb-2">Dark</h3>
					<div class="dark bg-black p-4 rounded border border-gray-800 text-gray-400">
						<app-spinner [class]="size" />
					</div>
				</div>
			</div>
		`,
	}),
};

/**
 * Spinner inherits the parent's text color, making it easy to match any context.
 */
export const Colors: Story = {
	render: () => ({
		template: `
			<div class="flex gap-6 items-center">
				<span class="text-gray-500"><app-spinner /></span>
				<span class="text-default"><app-spinner /></span>
				<span class="text-destructive"><app-spinner /></span>
				<span class="text-green-500"><app-spinner /></span>
			</div>
		`,
	}),
};
