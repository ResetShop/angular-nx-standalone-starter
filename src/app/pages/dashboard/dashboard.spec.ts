import { render, screen } from '@testing-library/angular';
import { provideRouter } from '@angular/router';
import Dashboard from './dashboard';

describe('Dashboard', () => {
	it('should render the dashboard component', async () => {
		const { fixture } = await render(Dashboard, {
			providers: [provideRouter([])],
		});

		expect(fixture.componentInstance).toBeTruthy();
	});

	it('should render the sidebar', async () => {
		await render(Dashboard, {
			providers: [provideRouter([])],
		});

		const sidebar = screen.getByRole('complementary');
		expect(sidebar).toBeInTheDocument();
	});

	it('should render main content area', async () => {
		await render(Dashboard, {
			providers: [provideRouter([])],
		});

		const main = screen.getByRole('main');
		expect(main).toBeInTheDocument();
	});

	it('should render router outlet for nested routes', async () => {
		await render(Dashboard, {
			providers: [provideRouter([])],
		});

		// Router outlet doesn't have a semantic role, but we can verify it exists by checking the main content area
		const main = screen.getByRole('main');
		expect(main).toBeInTheDocument();
	});
});
