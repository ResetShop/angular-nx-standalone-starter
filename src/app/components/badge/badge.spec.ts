import { render, screen } from '@testing-library/angular';
import { Badge } from './badge';

describe('Badge', () => {
	it('should render badge with text', async () => {
		await render(`<span appBadge>New</span>`, {
			imports: [Badge],
		});

		expect(screen.getByText('New')).toBeInTheDocument();
	});

	it('should apply base and transition classes', async () => {
		await render(`<span appBadge>Badge</span>`, {
			imports: [Badge],
		});

		const badge = screen.getByText('Badge');
		expect(badge).toHaveClass(
			'inline-flex',
			'items-center',
			'rounded-full',
			'text-xs',
			'font-semibold',
			'px-2.5',
			'py-0.5',
			'transition-colors',
			'duration-300',
			'ease-in-out',
		);
	});

	it('should apply default variant classes', async () => {
		await render(`<span appBadge>Default</span>`, {
			imports: [Badge],
		});

		const badge = screen.getByText('Default');
		expect(badge).toHaveClass('bg-primary', 'text-gray-50', 'dark:bg-gray-50', 'dark:text-primary');
	});

	it('should apply secondary variant classes', async () => {
		await render(`<span appBadge variant="secondary">Secondary</span>`, {
			imports: [Badge],
		});

		const badge = screen.getByText('Secondary');
		expect(badge).toHaveClass('bg-gray-200', 'text-gray-900', 'dark:bg-gray-800', 'dark:text-gray-100');
	});

	it('should apply destructive variant classes', async () => {
		await render(`<span appBadge variant="destructive">Error</span>`, {
			imports: [Badge],
		});

		const badge = screen.getByText('Error');
		expect(badge).toHaveClass('bg-danger', 'text-gray-50', 'dark:bg-danger', 'dark:text-gray-50');
	});

	it('should apply outline variant classes', async () => {
		await render(`<span appBadge variant="outline">Outline</span>`, {
			imports: [Badge],
		});

		const badge = screen.getByText('Outline');
		expect(badge).toHaveClass('border', 'border-gray-300', 'text-gray-700', 'bg-transparent', 'dark:border-gray-600', 'dark:text-gray-300');
	});
});
