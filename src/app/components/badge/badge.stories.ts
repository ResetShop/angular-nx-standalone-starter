import type { Meta, StoryObj } from '@storybook/angular'
import { Badge } from './badge'

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
}

export default meta

type Story = StoryObj<Badge>

/**
 * The default badge using default colors from the theme.
 */
export const Default: Story = {
	args: {
		variant: 'default',
	},
	render: (args) => ({
		props: args,
		template: `
			<div class="space-y-4">
				<div>
					<h3 class="text-sm font-semibold text-foreground mb-2">Light</h3>
					<div class="bg-background p-4 rounded border border-border">
						<span appBadge [variant]="variant">Badge</span>
					</div>
				</div>
				<div>
					<h3 class="text-sm font-semibold text-foreground mb-2">Dark</h3>
					<div class="dark bg-background p-4 rounded border border-border">
						<span appBadge [variant]="variant">Badge</span>
					</div>
				</div>
			</div>
		`,
	}),
}

/**
 * All variants displayed together.
 */
export const AllVariants: Story = {
	render: () => ({
		template: `
			<div class="space-y-4">
				<div>
					<h3 class="text-sm font-semibold text-foreground mb-2">Light</h3>
					<div class="bg-background p-4 rounded border border-border">
						<div class="flex gap-3 flex-wrap items-center">
							<span appBadge variant="default">Default</span>
							<span appBadge variant="secondary">Secondary</span>
							<span appBadge variant="destructive">Error</span>
							<span appBadge variant="outline">Outline</span>
						</div>
					</div>
				</div>
				<div>
					<h3 class="text-sm font-semibold text-foreground mb-2">Dark</h3>
					<div class="dark bg-background p-4 rounded border border-border">
						<div class="flex gap-3 flex-wrap items-center">
							<span appBadge variant="default">Default</span>
							<span appBadge variant="secondary">Secondary</span>
							<span appBadge variant="destructive">Error</span>
							<span appBadge variant="outline">Outline</span>
						</div>
					</div>
				</div>
			</div>
		`,
	}),
}
