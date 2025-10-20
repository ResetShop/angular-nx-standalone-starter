import { render, screen } from '@testing-library/angular';
import { provideRouter } from '@angular/router';
import { Sidebar } from './sidebar';

describe('Sidebar', () => {
	it('should render the sidebar', async () => {
		await render(Sidebar, {
			providers: [provideRouter([])],
		});

		expect(screen.getByText('Ajustes y mantenimiento')).toBeInTheDocument();
	});

	it('should display navigation section titles', async () => {
		await render(Sidebar, {
			providers: [provideRouter([])],
		});

		const sectionTitle = screen.getByText('Ajustes y mantenimiento');
		expect(sectionTitle).toHaveClass('text-gray-600');
	});

	it('should render navigation route links', async () => {
		await render(Sidebar, {
			providers: [provideRouter([])],
		});

		const healthLink = screen.getByRole('link', { name: /salud/i });
		expect(healthLink).toBeInTheDocument();
	});

	it('should render sign out button with link variant', async () => {
		await render(Sidebar, {
			providers: [provideRouter([])],
		});

		const signOutButton = screen.getByRole('link', { name: /cerrar sesión/i });
		expect(signOutButton).toBeInTheDocument();
		expect(signOutButton).toHaveAttribute('variant', 'link');
	});

	it('should have correct route on navigation items', async () => {
		await render(Sidebar, {
			providers: [provideRouter([])],
		});

		const healthLink = screen.getByRole('link', { name: /salud/i });
		console.log(healthLink);
		expect(healthLink).toHaveAttribute('href', '/health');
	});

	it('should route to login page on sign out', async () => {
		await render(Sidebar, {
			providers: [provideRouter([])],
		});

		const signOutButton = screen.getByRole('link', { name: /cerrar sesión/i });
		expect(signOutButton).toHaveAttribute('href', expect.stringContaining('/auth/login'));
	});
});
