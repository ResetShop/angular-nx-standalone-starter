import type { Meta, StoryObj } from '@storybook/angular';
import { Badge } from './badge';

const meta: Meta<Badge> = {
	component: Badge,
	title: 'Components/Badge',
	tags: ['autodocs'],
	parameters: {
		docs: {
			description: {
				component: `
A compact badge component for displaying status, labels, or counts.

## Features

- **4 Variants**: Default, Secondary, Destructive, Outline
- **Compact Pill Design**: Rounded-full with small padding
- **Dark Mode Support**: Automatic dark mode styling
- **Attribute Directive**: Applied via \`[appBadge]\` on span elements

## Usage

\`\`\`html
<span appBadge>Default</span>
<span appBadge variant="destructive">Error</span>
\`\`\`
				`,
			},
			canvas: {
				sourceState: 'shown',
			},
		},
	},
	argTypes: {
		variant: {
			control: 'select',
			options: ['default', 'secondary', 'destructive', 'outline'],
			description: 'Visual variant of the badge',
			table: {
				type: { summary: 'BadgeVariant' },
				defaultValue: { summary: 'default' },
			},
		},
	},
};

export default meta;

type Story = StoryObj<Badge>;

/**
 * The default badge using primary colors from the theme.
 */
export const Default: Story = {
	args: {
		variant: 'default',
	},
	render: (args) => ({
		props: args,
		template: `<span appBadge [variant]="variant">Badge</span>`,
	}),
};

/**
 * Secondary variant with subtle gray styling.
 */
export const Secondary: Story = {
	render: () => ({
		template: `<span appBadge variant="secondary">Secondary</span>`,
	}),
};

/**
 * Destructive variant using danger colors.
 */
export const Destructive: Story = {
	render: () => ({
		template: `<span appBadge variant="destructive">Error</span>`,
	}),
};

/**
 * Outline variant with border and transparent background.
 */
export const Outline: Story = {
	render: () => ({
		template: `<span appBadge variant="outline">Outline</span>`,
	}),
};

/**
 * All variants displayed together.
 */
export const AllVariants: Story = {
	render: () => ({
		template: `
			<div class="flex gap-3 flex-wrap items-center">
				<span appBadge variant="default">Default</span>
				<span appBadge variant="secondary">Secondary</span>
				<span appBadge variant="destructive">Error</span>
				<span appBadge variant="outline">Outline</span>
			</div>
		`,
	}),
};
