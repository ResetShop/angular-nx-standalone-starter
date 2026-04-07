import { NgIcon, provideIcons } from '@ng-icons/core'
import { featherArrowRight, featherDownload, featherPlus, featherTrash2 } from '@ng-icons/feather-icons'
import type { Meta, StoryObj } from '@storybook/angular'
import { moduleMetadata } from '@storybook/angular'
import { Spinner } from '../spinner/spinner'
import { Button } from './button'

const meta: Meta<Button> = {
	component: Button,
	title: 'Components/Button',
	tags: ['autodocs'],
	parameters: {
		docs: {
			description: {
				component: `
A versatile button component with multiple variants and sizes. Supports both button and anchor elements while maintaining native HTML capabilities.

## Features

- **6 Variants**: Default, Secondary, Destructive, Outline, Ghost, Link
- **3 Sizes**: Small, Medium (default), Large
- **Full Width Option**: Span the full container width
- **Icon Support**: Project icons via \`data-icon="start"\` and \`data-icon="end"\` attributes
- **Compounding Padding**: Button padding + label padding auto-adjusts spacing whether icons are present or not
- **Semantic HTML**: Works with both \`<button>\` and \`<a>\` elements
- **Accessible**: Built with Angular Signals and ng-primitives for enhanced accessibility
- **Tailwind CSS**: Styled with Tailwind utility classes following Angular Primitives patterns
- **Dark Mode Support**: Automatic dark mode styling with data attributes
- **Smooth Transitions**: 300ms ease-in-out transitions for all state changes

## Icon Usage

Project icons or spinners as direct children with \`data-icon="start"\` or \`data-icon="end"\`:

\`\`\`html
<!-- Start icon -->
<button appButton>
  <ng-icon data-icon="start" name="featherPlus" />
  Create
</button>

<!-- End icon -->
<button appButton>
  Next
  <ng-icon data-icon="end" name="featherArrowRight" />
</button>

<!-- Loading spinner (consumer controls visibility) -->
<button appButton [disabled]="isLoading()">
  @if (isLoading()) {
    <app-spinner data-icon="start" />
  }
  Save
</button>
\`\`\`

Icons are automatically sized based on the button size (16px for sm, 20px for md, 24px for lg).

## Interactive Demo

Try the controls below to customize the button appearance. Use the background selector in the toolbar to toggle dark mode.
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
			options: ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link'],
			description: 'Visual variant of the button',
			table: {
				type: { summary: 'ButtonVariant' },
				defaultValue: { summary: 'default' },
			},
		},
		size: {
			control: 'select',
			options: ['sm', 'md', 'lg'],
			description: 'Size of the button',
			table: {
				type: { summary: 'ButtonSize' },
				defaultValue: { summary: 'md' },
			},
		},
		fullWidth: {
			control: 'boolean',
			description: 'Whether the button should take full width',
			table: {
				type: { summary: 'boolean' },
				defaultValue: { summary: 'false' },
			},
		},
		type: {
			control: 'select',
			options: ['button', 'submit', 'reset'],
			description: 'Button type attribute (only applies to button elements)',
			table: {
				type: { summary: '"button" | "submit" | "reset"' },
				defaultValue: { summary: 'button' },
			},
		},
	},
}

export default meta

type Story = StoryObj<Button>

/**
 * The default button using default colors from the theme.
 * Use this for primary actions.
 */
export const Default: Story = {
	args: {
		variant: 'default',
		size: 'md',
		fullWidth: false,
		type: 'button',
	},
	render: (args) => ({
		props: args,
		template: `<button appButton [variant]="variant" [size]="size" [fullWidth]="fullWidth" [type]="type">Button</button>`,
	}),
}

/**
 * Outline variant with border and transparent background.
 * Good for secondary actions that need less emphasis.
 */
export const Outline: Story = {
	render: () => ({
		template: `<button appButton variant="outline">Outline</button>`,
	}),
}

/**
 * Secondary variant with subtle gray styling.
 * Use for secondary actions.
 */
export const Secondary: Story = {
	render: () => ({
		template: `<button appButton variant="secondary">Secondary</button>`,
	}),
}

/**
 * Ghost variant with no background until hover.
 * Ideal for tertiary or subtle actions.
 */
export const Ghost: Story = {
	render: () => ({
		template: `<button appButton variant="ghost">Ghost</button>`,
	}),
}

/**
 * Destructive variant using danger colors from the theme.
 * Use for dangerous or irreversible actions like deletion.
 */
export const Destructive: Story = {
	render: () => ({
		template: `<button appButton variant="destructive">Destructive</button>`,
	}),
}

/**
 * Link variant styled as a text link with underline on hover.
 * Use when a button should look like a hyperlink.
 */
export const Link: Story = {
	render: () => ({
		template: `<button appButton variant="link">Link</button>`,
	}),
}

/**
 * Small size button (h-8, px-2 + label px-1)
 */
export const Small: Story = {
	render: () => ({
		template: `<button appButton size="sm">Small Button</button>`,
	}),
}

/**
 * Medium size button (h-10, px-3 + label px-1) - default size
 */
export const Medium: Story = {
	render: () => ({
		template: `<button appButton size="md">Medium Button</button>`,
	}),
}

/**
 * Large size button (h-12, px-4 + label px-2)
 */
export const Large: Story = {
	render: () => ({
		template: `<button appButton size="lg">Large Button</button>`,
	}),
}

/**
 * Full width button that spans the container
 */
export const FullWidth: Story = {
	render: () => ({
		template: `<button appButton [fullWidth]="true">Full Width Button</button>`,
	}),
}

/**
 * Disabled button state
 */
export const Disabled: Story = {
	render: () => ({
		template: `
			<div class="flex gap-3">
				<button appButton disabled>Default</button>
				<button appButton variant="secondary" disabled>Secondary</button>
				<button appButton variant="destructive" disabled>Destructive</button>
			</div>
		`,
	}),
}

/**
 * Button as an anchor element
 */
export const AsAnchor: Story = {
	render: () => ({
		template: `<a appButton href="#">Anchor Button</a>`,
	}),
}

/**
 * All variants in shadcn/ui order
 */
export const AllVariants: Story = {
	render: () => ({
		template: `
			<div class="flex gap-3 flex-wrap items-center">
				<button appButton variant="default">Default</button>
				<button appButton variant="outline">Outline</button>
				<button appButton variant="secondary">Secondary</button>
				<button appButton variant="ghost">Ghost</button>
				<button appButton variant="destructive">Destructive</button>
				<button appButton variant="link">Link</button>
			</div>
		`,
	}),
}

/**
 * Button with a start icon (left side).
 * Icons are projected via `data-icon="start"`.
 */
export const WithStartIcon: Story = {
	decorators: [
		moduleMetadata({
			imports: [NgIcon],
			providers: [provideIcons({ featherPlus })],
		}),
	],
	render: () => ({
		template: `<button appButton><ng-icon data-icon="start" name="featherPlus" /> Create Role</button>`,
	}),
}

/**
 * Button with an end icon (right side).
 * Icons are projected via `data-icon="end"`.
 */
export const WithEndIcon: Story = {
	decorators: [
		moduleMetadata({
			imports: [NgIcon],
			providers: [provideIcons({ featherArrowRight })],
		}),
	],
	render: () => ({
		template: `<button appButton>Next <ng-icon data-icon="end" name="featherArrowRight" /></button>`,
	}),
}

/**
 * Button with both start and end icons simultaneously.
 */
export const WithBothIcons: Story = {
	decorators: [
		moduleMetadata({
			imports: [NgIcon],
			providers: [provideIcons({ featherDownload, featherArrowRight })],
		}),
	],
	render: () => ({
		template: `<button appButton><ng-icon data-icon="start" name="featherDownload" /> Export <ng-icon data-icon="end" name="featherArrowRight" /></button>`,
	}),
}

/**
 * Button with a loading spinner projected via `data-icon="start"`.
 * The consumer controls spinner visibility — the button has no loading-specific logic.
 */
export const WithSpinner: Story = {
	decorators: [
		moduleMetadata({
			imports: [Spinner],
		}),
	],
	render: () => ({
		template: `<button appButton disabled><app-spinner data-icon="start" /> Saving...</button>`,
	}),
}

/**
 * Icon buttons across all variants to verify icon sizing and spacing.
 */
export const IconVariants: Story = {
	decorators: [
		moduleMetadata({
			imports: [NgIcon],
			providers: [provideIcons({ featherPlus, featherTrash2 })],
		}),
	],
	render: () => ({
		template: `
			<div class="flex gap-3 flex-wrap items-center">
				<button appButton variant="default"><ng-icon data-icon="start" name="featherPlus" /> Create</button>
				<button appButton variant="outline"><ng-icon data-icon="start" name="featherPlus" /> Create</button>
				<button appButton variant="secondary"><ng-icon data-icon="start" name="featherPlus" /> Create</button>
				<button appButton variant="ghost"><ng-icon data-icon="start" name="featherTrash2" /> Delete</button>
				<button appButton variant="destructive"><ng-icon data-icon="start" name="featherTrash2" /> Delete</button>
				<button appButton variant="link"><ng-icon data-icon="start" name="featherPlus" /> Add</button>
			</div>
		`,
	}),
}

/**
 * Icon buttons across all sizes to verify icon auto-sizing (16px sm, 20px md, 24px lg).
 */
export const IconSizes: Story = {
	decorators: [
		moduleMetadata({
			imports: [NgIcon],
			providers: [provideIcons({ featherPlus })],
		}),
	],
	render: () => ({
		template: `
			<div class="flex gap-3 items-center">
				<button appButton size="sm"><ng-icon data-icon="start" name="featherPlus" /> Small</button>
				<button appButton size="md"><ng-icon data-icon="start" name="featherPlus" /> Medium</button>
				<button appButton size="lg"><ng-icon data-icon="start" name="featherPlus" /> Large</button>
			</div>
		`,
	}),
}
