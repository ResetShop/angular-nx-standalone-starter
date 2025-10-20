import type { Meta, StoryObj } from '@storybook/angular';
import { Button } from './button';

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
- **Semantic HTML**: Works with both \`<button>\` and \`<a>\` elements
- **Accessible**: Built with Angular Signals and ng-primitives for enhanced accessibility
- **Tailwind CSS**: Styled with Tailwind utility classes following Angular Primitives patterns
- **Dark Mode Support**: Automatic dark mode styling with data attributes
- **Smooth Transitions**: 300ms ease-in-out transitions for all state changes

## Usage

\`\`\`typescript
import { Button } from '@components/button';

@Component({
  imports: [Button],
  template: \`
    <button appButton variant="default" size="md">
      Click me
    </button>
  \`
})
\`\`\`

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
};

export default meta;

type Story = StoryObj<Button>;

/**
 * The default button using primary colors from the theme.
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
};

/**
 * Outline variant with border and transparent background.
 * Good for secondary actions that need less emphasis.
 */
export const Outline: Story = {
	render: () => ({
		template: `<button appButton variant="outline">Outline</button>`,
	}),
};

/**
 * Secondary variant with subtle gray styling.
 * Use for secondary actions.
 */
export const Secondary: Story = {
	render: () => ({
		template: `<button appButton variant="secondary">Secondary</button>`,
	}),
};

/**
 * Ghost variant with no background until hover.
 * Ideal for tertiary or subtle actions.
 */
export const Ghost: Story = {
	render: () => ({
		template: `<button appButton variant="ghost">Ghost</button>`,
	}),
};

/**
 * Destructive variant using danger colors from the theme.
 * Use for dangerous or irreversible actions like deletion.
 */
export const Destructive: Story = {
	render: () => ({
		template: `<button appButton variant="destructive">Destructive</button>`,
	}),
};

/**
 * Link variant styled as a text link with underline on hover.
 * Use when a button should look like a hyperlink.
 */
export const Link: Story = {
	render: () => ({
		template: `<button appButton variant="link">Link</button>`,
	}),
};

/**
 * Small size button (h-9, px-3)
 */
export const Small: Story = {
	render: () => ({
		template: `<button appButton size="sm">Small Button</button>`,
	}),
};

/**
 * Medium size button (h-10, px-4) - default size
 */
export const Medium: Story = {
	render: () => ({
		template: `<button appButton size="md">Medium Button</button>`,
	}),
};

/**
 * Large size button (h-11, px-6)
 */
export const Large: Story = {
	render: () => ({
		template: `<button appButton size="lg">Large Button</button>`,
	}),
};

/**
 * Full width button that spans the container
 */
export const FullWidth: Story = {
	render: () => ({
		template: `<button appButton [fullWidth]="true">Full Width Button</button>`,
	}),
};

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
};

/**
 * Button as an anchor element
 */
export const AsAnchor: Story = {
	render: () => ({
		template: `<a appButton href="#">Anchor Button</a>`,
	}),
};

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
};
