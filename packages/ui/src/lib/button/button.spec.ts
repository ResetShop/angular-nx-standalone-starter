import { clearAllMocks } from '@resetshop/util/test-utils'
import { render, screen } from '@testing-library/angular'
import { Button } from './button'

describe('Button', () => {
	beforeEach(() => clearAllMocks())

	it('should apply default classes to a button', async () => {
		await render(`<button appButton>Click me</button>`, {
			imports: [Button],
		})

		const button = screen.getByRole('button', { name: /click me/i })
		expect(button).toBeInTheDocument()
		expect(button).toHaveClass('inline-flex')
		expect(button).toHaveClass('items-center')
		expect(button).toHaveClass('justify-center')
		expect(button).toHaveClass('bg-default')
		expect(button).toHaveClass('shadow')
	})

	it('should apply default variant classes by default', async () => {
		await render(`<button appButton>Default</button>`, {
			imports: [Button],
		})

		const button = screen.getByRole('button')
		expect(button).toHaveClass('bg-default')
		expect(button).toHaveClass('text-default-foreground')
		expect(button).toHaveClass('shadow')
		expect(button).toHaveClass('data-[hover]:bg-default/90')
	})

	it('should apply secondary variant classes', async () => {
		await render(`<button appButton variant="secondary">Secondary</button>`, {
			imports: [Button],
		})

		const button = screen.getByRole('button')
		expect(button).toHaveClass('bg-secondary')
		expect(button).toHaveClass('text-secondary-foreground')
		expect(button).toHaveClass('shadow')
	})

	it('should apply destructive variant classes', async () => {
		await render(`<button appButton variant="destructive">Destructive</button>`, {
			imports: [Button],
		})

		const button = screen.getByRole('button')
		expect(button).toHaveClass('bg-destructive')
		expect(button).toHaveClass('text-destructive-foreground')
		expect(button).toHaveClass('shadow')
	})

	it('should apply outline variant classes', async () => {
		await render(`<button appButton variant="outline">Outline</button>`, {
			imports: [Button],
		})

		const button = screen.getByRole('button')
		expect(button).toHaveClass('border')
		expect(button).toHaveClass('border-input')
		expect(button).toHaveClass('text-foreground')
	})

	it('should apply ghost variant classes', async () => {
		await render(`<button appButton variant="ghost">Ghost</button>`, {
			imports: [Button],
		})

		const button = screen.getByRole('button')
		expect(button).toHaveClass('bg-transparent')
		expect(button).toHaveClass('text-foreground')
	})

	it('should apply ghost-muted variant classes', async () => {
		await render(`<button appButton variant="ghost-muted">Ghost Muted</button>`, {
			imports: [Button],
		})

		const button = screen.getByRole('button')
		expect(button).toHaveClass('bg-transparent')
		expect(button).toHaveClass('text-muted-foreground')
		// Button hover lift to full foreground (also applies bg-accent).
		expect(button).toHaveClass('data-[hover]:bg-accent')
		expect(button).toHaveClass('data-[hover]:text-foreground')
		// Row hover lift to full foreground — opt-in via a `group/row` ancestor (set by `<app-data-table>`).
		// Consumers outside such an ancestor get the button-hover lift only.
		expect(button).toHaveClass('group-hover/row:text-foreground')
		expect(button).toHaveClass('data-[focus-visible]:outline-ring')
		expect(button).not.toHaveClass('text-foreground')
	})

	it('should apply link variant classes', async () => {
		await render(`<button appButton variant="link">Link</button>`, {
			imports: [Button],
		})

		const button = screen.getByRole('button')
		expect(button).toHaveClass('bg-transparent')
		expect(button).toHaveClass('text-default')
		expect(button).toHaveClass('underline-offset-4')
	})

	it('should apply small size classes', async () => {
		await render(`<button appButton size="sm">Small</button>`, {
			imports: [Button],
		})

		const button = screen.getByRole('button')
		expect(button).toHaveClass('h-8')
		expect(button).toHaveClass('px-2')
		expect(button).toHaveClass('text-sm')
	})

	it('should apply medium size classes by default', async () => {
		await render(`<button appButton>Medium</button>`, {
			imports: [Button],
		})

		const button = screen.getByRole('button')
		expect(button).toHaveClass('h-10')
		expect(button).toHaveClass('px-3')
		expect(button).toHaveClass('text-base')
	})

	it('should apply large size classes', async () => {
		await render(`<button appButton size="lg">Large</button>`, {
			imports: [Button],
		})

		const button = screen.getByRole('button')
		expect(button).toHaveClass('h-12')
		expect(button).toHaveClass('px-4')
		expect(button).toHaveClass('text-lg')
	})

	it('should apply full width class when fullWidth is true', async () => {
		await render(`<button appButton [fullWidth]="true">Full Width</button>`, {
			imports: [Button],
		})

		const button = screen.getByRole('button')
		expect(button).toHaveClass('w-full')
	})

	it('should not apply full width class by default', async () => {
		await render(`<button appButton>Not Full Width</button>`, {
			imports: [Button],
		})

		const button = screen.getByRole('button')
		expect(button).not.toHaveClass('w-full')
	})

	it('should set type attribute to button by default', async () => {
		await render(`<button appButton>Button</button>`, {
			imports: [Button],
		})

		const button = screen.getByRole('button')
		expect(button).toHaveAttribute('type', 'button')
	})

	it('should set type attribute to submit', async () => {
		await render(`<button appButton type="submit">Submit</button>`, {
			imports: [Button],
		})

		const button = screen.getByRole('button')
		expect(button).toHaveAttribute('type', 'submit')
	})

	it('should include disabled utility classes', async () => {
		await render(`<button appButton>Button</button>`, {
			imports: [Button],
		})

		const button = screen.getByRole('button')
		expect(button).toHaveClass('disabled:pointer-events-none')
		expect(button).toHaveClass('disabled:opacity-50')
	})

	it('should be disabled when disabled input is true', async () => {
		await render(`<button appButton [disabled]="true">Btn</button>`, {
			imports: [Button],
		})

		expect(screen.getByRole('button')).toBeDisabled()
	})

	it('should work with anchor elements', async () => {
		await render(`<a appButton href="#">Link Button</a>`, {
			imports: [Button],
		})

		const link = screen.getByRole('link', { name: /link button/i })
		expect(link).toBeInTheDocument()
		expect(link).toHaveClass('bg-default')
		expect(link).toHaveClass('shadow')
		expect(link).toHaveClass('inline-flex')
	})

	it('should combine variant, size, and fullWidth', async () => {
		await render(`<button appButton variant="destructive" size="lg" [fullWidth]="true">Combined</button>`, {
			imports: [Button],
		})

		const button = screen.getByRole('button')
		expect(button).toHaveClass('bg-destructive')
		expect(button).toHaveClass('h-12')
		expect(button).toHaveClass('px-4')
		expect(button).toHaveClass('w-full')
	})

	describe('icon projection', () => {
		it('should render a child with data-icon="start" inside the button', async () => {
			await render(
				`<button appButton>
					<svg data-icon="start" data-testid="start-icon"></svg>
					Label
				</button>`,
				{ imports: [Button] },
			)

			expect(screen.getByTestId('start-icon')).toBeInTheDocument()
			expect(screen.getByRole('button', { name: /label/i })).toBeInTheDocument()
		})

		it('should render a child with data-icon="end" inside the button', async () => {
			await render(
				`<button appButton>
					Label
					<svg data-icon="end" data-testid="end-icon"></svg>
				</button>`,
				{ imports: [Button] },
			)

			expect(screen.getByTestId('end-icon')).toBeInTheDocument()
			expect(screen.getByRole('button', { name: /label/i })).toBeInTheDocument()
		})

		it('should render both start and end icons simultaneously', async () => {
			await render(
				`<button appButton>
					<svg data-icon="start" data-testid="start-icon"></svg>
					Label
					<svg data-icon="end" data-testid="end-icon"></svg>
				</button>`,
				{ imports: [Button] },
			)

			expect(screen.getByTestId('start-icon')).toBeInTheDocument()
			expect(screen.getByTestId('end-icon')).toBeInTheDocument()
			expect(screen.getByText('Label')).toBeInTheDocument()
		})

		it('should render text content alongside data-icon projections', async () => {
			await render(
				`<button appButton>
					<svg data-icon="start" data-testid="start-icon"></svg>
					Create Role
				</button>`,
				{ imports: [Button] },
			)

			expect(screen.getByText('Create Role')).toBeInTheDocument()
			expect(screen.getByTestId('start-icon')).toBeInTheDocument()
		})

		it('should work without any icons (text-only)', async () => {
			await render(`<button appButton>Text Only</button>`, {
				imports: [Button],
			})

			expect(screen.getByRole('button', { name: /text only/i })).toBeInTheDocument()
		})
	})
})
