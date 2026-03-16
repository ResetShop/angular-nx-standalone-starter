import { render, screen } from '@testing-library/angular'
import { Badge } from './badge'

describe('Badge', () => {
	it('should render badge with text', async () => {
		await render(`<span appBadge>New</span>`, {
			imports: [Badge],
		})

		expect(screen.getByText('New')).toBeInTheDocument()
	})

	it('should apply base and transition classes', async () => {
		await render(`<span appBadge>Badge</span>`, {
			imports: [Badge],
		})

		const badge = screen.getByText('Badge')
		expect(badge).toHaveClass(
			'inline-flex',
			'items-center',
			'rounded-full',
			'border',
			'text-xs',
			'font-semibold',
			'px-2.5',
			'py-0.5',
			'transition-colors',
			'duration-300',
			'ease-in-out',
		)
	})

	it('should apply default variant classes', async () => {
		await render(`<span appBadge>Default</span>`, {
			imports: [Badge],
		})

		const badge = screen.getByText('Default')
		expect(badge).toHaveClass('bg-default', 'border-transparent', 'text-default-foreground')
	})

	it('should apply secondary variant classes', async () => {
		await render(`<span appBadge variant="secondary">Secondary</span>`, {
			imports: [Badge],
		})

		const badge = screen.getByText('Secondary')
		expect(badge).toHaveClass('bg-secondary', 'border-transparent', 'text-secondary-foreground')
	})

	it('should apply destructive variant classes', async () => {
		await render(`<span appBadge variant="destructive">Error</span>`, {
			imports: [Badge],
		})

		const badge = screen.getByText('Error')
		expect(badge).toHaveClass('bg-destructive/10', 'border-transparent', 'text-destructive', 'dark:bg-destructive/20')
	})

	it('should apply outline variant classes', async () => {
		await render(`<span appBadge variant="outline">Outline</span>`, {
			imports: [Badge],
		})

		const badge = screen.getByText('Outline')
		expect(badge).toHaveClass('border-border', 'text-foreground')
	})
})
