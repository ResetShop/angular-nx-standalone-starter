import { clearAllMocks } from '@test-utils'
import { render, screen } from '@testing-library/angular'
import { Alert, AlertDescription, AlertTitle } from './alert'

describe('Alert', () => {
	beforeEach(() => {
		clearAllMocks()
	})

	describe('Alert container', () => {
		it('should render projected content', async () => {
			await render(`<div appAlert>Alert message</div>`, {
				imports: [Alert],
			})

			expect(screen.getByRole('status')).toBeInTheDocument()
			expect(screen.getByText('Alert message')).toBeInTheDocument()
		})

		it('should have role="status" for the default variant', async () => {
			await render(`<div appAlert>Content</div>`, {
				imports: [Alert],
			})

			expect(screen.getByRole('status')).toBeInTheDocument()
		})

		it('should have role="alert" for the destructive variant', async () => {
			await render(`<div appAlert variant="destructive">Content</div>`, {
				imports: [Alert],
			})

			expect(screen.getByRole('alert')).toBeInTheDocument()
		})

		it('should apply base structural classes', async () => {
			await render(`<div appAlert>Content</div>`, {
				imports: [Alert],
			})

			const el = screen.getByRole('status')
			expect(el).toHaveClass(
				'relative',
				'grid',
				'gap-0.5',
				'rounded-lg',
				'border',
				'px-2.5',
				'py-2',
				'text-left',
				'text-sm',
			)
		})

		it('should apply default variant classes when no variant is provided', async () => {
			await render(`<div appAlert>Content</div>`, {
				imports: [Alert],
			})

			const el = screen.getByRole('status')
			expect(el).toHaveClass('bg-card', 'text-card-foreground')
		})

		it('should apply default variant classes when variant="default"', async () => {
			await render(`<div appAlert variant="default">Content</div>`, {
				imports: [Alert],
			})

			const el = screen.getByRole('status')
			expect(el).toHaveClass('bg-card', 'text-card-foreground')
		})

		it('should apply destructive variant classes when variant="destructive"', async () => {
			await render(`<div appAlert variant="destructive">Content</div>`, {
				imports: [Alert],
			})

			const el = screen.getByRole('alert')
			expect(el).toHaveClass('text-destructive', 'bg-card')
		})

		it('should not apply destructive classes for the default variant', async () => {
			await render(`<div appAlert>Content</div>`, {
				imports: [Alert],
			})

			const el = screen.getByRole('status')
			expect(el).not.toHaveClass('text-destructive')
		})

		it('should not apply default text class for the destructive variant', async () => {
			await render(`<div appAlert variant="destructive">Content</div>`, {
				imports: [Alert],
			})

			const el = screen.getByRole('alert')
			expect(el).not.toHaveClass('text-card-foreground')
		})
	})

	describe('AlertTitle', () => {
		it('should render projected title content', async () => {
			await render(`<p appAlertTitle>Heads up!</p>`, {
				imports: [AlertTitle],
			})

			expect(screen.getByText('Heads up!')).toBeInTheDocument()
		})

		it('should set data-slot="alert-title" on the host element', async () => {
			await render(`<p appAlertTitle>Title</p>`, {
				imports: [AlertTitle],
			})

			const title = screen.getByText('Title')
			expect(title).toHaveAttribute('data-slot', 'alert-title')
		})

		it('should apply font-medium class', async () => {
			await render(`<p appAlertTitle>Title</p>`, {
				imports: [AlertTitle],
			})

			const title = screen.getByText('Title')
			expect(title).toHaveClass('font-medium')
		})
	})

	describe('AlertDescription', () => {
		it('should render projected description content', async () => {
			await render(`<p appAlertDescription>You can add components here.</p>`, {
				imports: [AlertDescription],
			})

			expect(screen.getByText('You can add components here.')).toBeInTheDocument()
		})

		it('should set data-slot="alert-description" on the host element', async () => {
			await render(`<p appAlertDescription>Description</p>`, {
				imports: [AlertDescription],
			})

			const description = screen.getByText('Description')
			expect(description).toHaveAttribute('data-slot', 'alert-description')
		})

		it('should apply muted text classes', async () => {
			await render(`<p appAlertDescription>Description</p>`, {
				imports: [AlertDescription],
			})

			const description = screen.getByText('Description')
			expect(description).toHaveClass('text-muted-foreground', 'text-sm')
		})
	})

	describe('Alert with title and description composed together', () => {
		it('should render full alert with title and description', async () => {
			await render(
				`<div appAlert>
					<p appAlertTitle>Heads up!</p>
					<p appAlertDescription>You can add components here.</p>
				</div>`,
				{ imports: [Alert, AlertTitle, AlertDescription] },
			)

			expect(screen.getByRole('status')).toBeInTheDocument()
			expect(screen.getByText('Heads up!')).toBeInTheDocument()
			expect(screen.getByText('You can add components here.')).toBeInTheDocument()
		})

		it('should have correct data-slot attributes on title and description', async () => {
			await render(
				`<div appAlert>
					<p appAlertTitle>Title</p>
					<p appAlertDescription>Description</p>
				</div>`,
				{ imports: [Alert, AlertTitle, AlertDescription] },
			)

			expect(screen.getByText('Title')).toHaveAttribute('data-slot', 'alert-title')
			expect(screen.getByText('Description')).toHaveAttribute('data-slot', 'alert-description')
		})

		it('should apply destructive description modifier class in destructive variant', async () => {
			await render(
				`<div appAlert variant="destructive">
					<p appAlertTitle>Error</p>
					<p appAlertDescription>Something went wrong.</p>
				</div>`,
				{ imports: [Alert, AlertTitle, AlertDescription] },
			)

			const el = screen.getByRole('alert')
			expect(el).toHaveClass('[&_[data-slot=alert-description]]:text-destructive/90')
		})
	})
})
