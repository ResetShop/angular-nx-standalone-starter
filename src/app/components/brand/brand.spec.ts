import { render, screen } from '@testing-library/angular';
import { provideRouter } from '@angular/router';
import { Brand } from './brand';

describe('Brand', () => {
	const defaultProviders = () => [provideRouter([])];

	it('should create the brand component', async () => {
		const { fixture } = await render(Brand, {
			providers: defaultProviders(),
		});

		expect(fixture.componentInstance).toBeTruthy();
	});

	it('should render brand link button with reset text', async () => {
		await render(Brand, {
			providers: defaultProviders(),
		});

		const link = screen.getByRole('link', { name: /reset starter repo/i });
		expect(link).toBeInTheDocument();
	});

	it('should have navigation link to welcome page', async () => {
		await render(Brand, {
			providers: defaultProviders(),
		});

		const link = screen.getByRole('link', { name: /reset starter repo/i });
		expect(link).toHaveAttribute('href', '/welcome');
	});

	it('should render icon within the brand button', async () => {
		await render(Brand, {
			providers: defaultProviders(),
		});

		const link = screen.getByRole('link', { name: /reset starter repo/i });
		expect(link).toBeInTheDocument();

		const text = screen.getByText('Reset Starter Repo');
		expect(text).toBeInTheDocument();
	});

	it('should apply button styling with variant and size', async () => {
		await render(Brand, {
			providers: defaultProviders(),
		});

		const link = screen.getByRole('link', { name: /reset starter repo/i });
		expect(link).toHaveAttribute('variant', 'default');
		expect(link).toHaveAttribute('size', 'sm');
	});

	it('should apply gap styling for icon and text spacing', async () => {
		await render(Brand, {
			providers: defaultProviders(),
		});

		const link = screen.getByRole('link', { name: /reset starter repo/i });
		expect(link).toHaveClass('gap-2');
		expect(link).toHaveClass('font-semibold');
	});

	it('should render with proper semantic structure', async () => {
		await render(Brand, {
			providers: defaultProviders(),
		});

		const link = screen.getByRole('link');
		expect(link).toBeInTheDocument();
		expect(link).toHaveTextContent(/Reset Starter Repo/);
	});
});
