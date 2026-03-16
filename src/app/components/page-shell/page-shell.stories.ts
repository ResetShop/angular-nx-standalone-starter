import type { Meta, StoryObj } from '@storybook/angular';
import { PageShell } from './page-shell';

const meta: Meta<PageShell & { description: string; content: string }> = {
	component: PageShell,
	title: 'Components/PageShell',
	tags: ['autodocs'],
	parameters: {
		docs: {
			description: {
				component: `
A wrapper component for consistent page layouts with title, description, loading, and error states.

## Features

- **Required title** rendered as \`<h1>\`
- **Optional description** via \`[pageDescription]\` content projection (hidden when empty)
- **Loading state** shows a centered spinner
- **Error state** shows a destructive alert
- **Default content** projected when not loading and no error

## Usage

\`\`\`html
<app-page-shell title="Roles" [loading]="store.isLoading()" [error]="store.readError().list">
  <p pageDescription>Manage system roles.</p>
  <!-- page content here -->
</app-page-shell>
\`\`\`
				`,
			},
			canvas: {
				sourceState: 'shown',
			},
		},
	},
	argTypes: {
		title: {
			control: 'text',
			description: 'Page heading text',
		},
		loading: {
			control: 'boolean',
			description: 'Shows a centered spinner when true',
			table: { defaultValue: { summary: 'false' } },
		},
		error: {
			control: 'text',
			description: 'Shows a destructive alert when set',
			table: { defaultValue: { summary: 'null' } },
		},
		description: {
			control: 'text',
			description: 'Description text projected via [pageDescription]',
		},
	},
};

export default meta;

type Story = StoryObj<PageShell & { description: string }>;

export const Default: Story = {
	args: {
		title: 'Roles',
		loading: false,
		error: null,
		description: 'Manage system roles and their associated permissions.',
	},
	render: (args) => ({
		props: args,
		moduleMetadata: { imports: [PageShell] },
		template: `
			<div class="bg-background p-6 rounded border border-border">
				<app-page-shell [title]="title" [loading]="loading" [error]="error">
					<p pageDescription>{{ description }}</p>
					<div class="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
						Page content goes here
					</div>
				</app-page-shell>
			</div>
		`,
	}),
};

export const Loading: Story = {
	args: {
		title: 'Roles',
		loading: true,
		error: null,
		description: 'Manage system roles and their associated permissions.',
	},
	render: (args) => ({
		props: args,
		moduleMetadata: { imports: [PageShell] },
		template: `
			<div class="bg-background p-6 rounded border border-border">
				<app-page-shell [title]="title" [loading]="loading" [error]="error">
					<p pageDescription>{{ description }}</p>
					<div class="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
						This content is hidden while loading
					</div>
				</app-page-shell>
			</div>
		`,
	}),
};

export const Error: Story = {
	args: {
		title: 'Roles',
		loading: false,
		error: 'Failed to load roles. Please try again later.',
		description: 'Manage system roles and their associated permissions.',
	},
	render: (args) => ({
		props: args,
		moduleMetadata: { imports: [PageShell] },
		template: `
			<div class="bg-background p-6 rounded border border-border">
				<app-page-shell [title]="title" [loading]="loading" [error]="error">
					<p pageDescription>{{ description }}</p>
					<div class="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
						This content is hidden when there is an error
					</div>
				</app-page-shell>
			</div>
		`,
	}),
};

export const NoDescription: Story = {
	args: {
		title: 'Dashboard',
		loading: false,
		error: null,
	},
	render: (args) => ({
		props: args,
		moduleMetadata: { imports: [PageShell] },
		template: `
			<div class="bg-background p-6 rounded border border-border">
				<app-page-shell [title]="title" [loading]="loading" [error]="error">
					<div class="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
						Page without description — the empty paragraph is hidden via empty:hidden
					</div>
				</app-page-shell>
			</div>
		`,
	}),
};
