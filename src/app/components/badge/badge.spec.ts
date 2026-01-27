import { render, screen } from '@testing-library/angular';
import { Badge } from './badge';

describe('Badge', () => {
	it('should render badge with text', async () => {
		await render(`<span appBadge>New</span>`, {
			imports: [Badge],
		});

		expect(screen.getByText('New')).toBeInTheDocument();
	});

	it('should apply base classes', async () => {
		await render(`<span appBadge>Badge</span>`, {
			imports: [Badge],
		});

		const badge = screen.getByText('Badge');
		expect(badge).toHaveClass('inline-flex');
		expect(badge).toHaveClass('items-center');
		expect(badge).toHaveClass('rounded-full');
		expect(badge).toHaveClass('text-xs');
		expect(badge).toHaveClass('font-semibold');
		expect(badge).toHaveClass('px-2.5');
		expect(badge).toHaveClass('py-0.5');
	});

	it('should apply default variant classes by default', async () => {
		await render(`<span appBadge>Default</span>`, {
			imports: [Badge],
		});

		const badge = screen.getByText('Default');
		expect(badge).toHaveClass('bg-primary');
		expect(badge).toHaveClass('text-gray-50');
	});

	it('should apply secondary variant classes', async () => {
		await render(`<span appBadge variant="secondary">Secondary</span>`, {
			imports: [Badge],
		});

		const badge = screen.getByText('Secondary');
		expect(badge).toHaveClass('bg-gray-200');
		expect(badge).toHaveClass('text-gray-900');
	});

	it('should apply destructive variant classes', async () => {
		await render(`<span appBadge variant="destructive">Error</span>`, {
			imports: [Badge],
		});

		const badge = screen.getByText('Error');
		expect(badge).toHaveClass('bg-danger');
		expect(badge).toHaveClass('text-gray-50');
	});

	it('should apply outline variant classes', async () => {
		await render(`<span appBadge variant="outline">Outline</span>`, {
			imports: [Badge],
		});

		const badge = screen.getByText('Outline');
		expect(badge).toHaveClass('border');
		expect(badge).toHaveClass('border-gray-300');
		expect(badge).toHaveClass('text-gray-700');
		expect(badge).toHaveClass('bg-transparent');
	});

	it('should include dark mode classes for default variant', async () => {
		await render(`<span appBadge>Dark</span>`, {
			imports: [Badge],
		});

		const badge = screen.getByText('Dark');
		expect(badge).toHaveClass('dark:bg-gray-50');
		expect(badge).toHaveClass('dark:text-primary');
	});

	it('should include transition classes', async () => {
		await render(`<span appBadge>Transition</span>`, {
			imports: [Badge],
		});

		const badge = screen.getByText('Transition');
		expect(badge).toHaveClass('transition-colors');
		expect(badge).toHaveClass('duration-300');
		expect(badge).toHaveClass('ease-in-out');
	});
});
