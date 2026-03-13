import type { Meta, StoryObj } from '@storybook/angular';
import { Alert, AlertDescription, AlertTitle } from './alert';

const meta: Meta<Alert & { title: string; description: string; showDescription: boolean }> = {
	component: Alert,
	title: 'Components/Alert',
	tags: ['autodocs'],
	parameters: {
		docs: {
			description: {
				component: `
An alert component for displaying important messages or feedback.

## Features

- **2 Variants**: Default, Destructive
- **Composable Slots**: Title and Description sub-components
- **Accessible**: Uses \`role="status"\` (polite) for default, \`role="alert"\` (assertive) for destructive
- **Dark Mode Support**: Automatic dark mode styling
- **Attribute Directive**: Applied via \`[appAlert]\` on div elements

## Usage

\`\`\`html
<div appAlert>
  <h5 appAlertTitle>Heads up!</h5>
  <p appAlertDescription>You can add components to your app using the cli.</p>
</div>
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
			options: ['default', 'destructive'],
			description: 'Visual variant of the alert',
			table: {
				type: { summary: 'AlertVariant' },
				defaultValue: { summary: 'default' },
			},
		},
		title: {
			control: 'text',
			description: 'Title text displayed in the alert',
		},
		description: {
			control: 'text',
			description: 'Description text displayed in the alert',
		},
		showDescription: {
			control: 'boolean',
			description: 'Whether to show the description slot',
		},
	},
};

export default meta;

type Story = StoryObj<Alert & { title: string; description: string; showDescription: boolean }>;

/**
 * The default alert with configurable title, description, and variant.
 */
export const Default: Story = {
	args: {
		variant: 'default',
		title: 'Heads up!',
		description: 'You can add components to your app using the cli.',
		showDescription: true,
	},
	render: (args) => ({
		props: args,
		moduleMetadata: {
			imports: [Alert, AlertTitle, AlertDescription],
		},
		template: `
			<div class="space-y-4">
				<div>
					<h3 class="text-sm font-semibold text-foreground mb-2">Light</h3>
					<div class="bg-background p-4 rounded border border-border">
						<div appAlert [variant]="variant">
							<h5 appAlertTitle>{{ title }}</h5>
							@if (showDescription) {
								<p appAlertDescription>{{ description }}</p>
							}
						</div>
					</div>
				</div>
				<div>
					<h3 class="text-sm font-semibold text-foreground mb-2">Dark</h3>
					<div class="dark bg-background p-4 rounded border border-border">
						<div appAlert [variant]="variant">
							<h5 appAlertTitle>{{ title }}</h5>
							@if (showDescription) {
								<p appAlertDescription>{{ description }}</p>
							}
						</div>
					</div>
				</div>
			</div>
		`,
	}),
};
