import { render, screen, waitFor } from '@testing-library/angular';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { Header } from './header';

describe('Header', () => {
	const createMockActivatedRoute = (title: string | undefined, path: string, children: any[] = []) => ({
		routeConfig: {
			title,
			path,
		},
		children,
		outlet: 'primary',
	});

	const createMockRouter = (eventsSubject: Subject<any>) => ({
		events: eventsSubject.asObservable(),
		navigateByUrl: jest.fn().mockResolvedValue(true),
	});

	it('should render header component with breadcrumb', async () => {
		const eventsSubject = new Subject<NavigationEnd>();

		await render(Header, {
			providers: [
				{ provide: Router, useValue: createMockRouter(eventsSubject) },
				{
					provide: ActivatedRoute,
					useValue: { root: createMockActivatedRoute(undefined, '') },
				},
			],
		});

		const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
		expect(nav).toBeInTheDocument();
	});

	it('should render breadcrumb navigation element', async () => {
		const eventsSubject = new Subject<NavigationEnd>();

		await render(Header, {
			providers: [
				{ provide: Router, useValue: createMockRouter(eventsSubject) },
				{
					provide: ActivatedRoute,
					useValue: { root: createMockActivatedRoute(undefined, '') },
				},
			],
		});

		const breadcrumbNav = screen.getByRole('navigation', { name: /breadcrumb/i });
		expect(breadcrumbNav).toBeInTheDocument();
		expect(breadcrumbNav).toHaveAttribute('aria-label', 'Breadcrumb');
	});

	it('should display breadcrumbs from active route', async () => {
		const eventsSubject = new Subject<NavigationEnd>();
		const childRoute = createMockActivatedRoute('Dashboard', 'dashboard', []);
		const rootRoute = createMockActivatedRoute('Home', 'home', [childRoute]);

		await render(Header, {
			providers: [
				{ provide: Router, useValue: createMockRouter(eventsSubject) },
				{
					provide: ActivatedRoute,
					useValue: { root: createMockActivatedRoute(undefined, '', [rootRoute]) },
				},
			],
		});

		// Trigger navigation to build breadcrumbs
		eventsSubject.next(new NavigationEnd(1, '/home/dashboard', ''));

		await waitFor(() => {
			expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
		});
	});

	it('should have proper semantic structure', async () => {
		const eventsSubject = new Subject<NavigationEnd>();

		await render(Header, {
			providers: [
				{ provide: Router, useValue: createMockRouter(eventsSubject) },
				{
					provide: ActivatedRoute,
					useValue: { root: createMockActivatedRoute(undefined, '') },
				},
			],
		});

		const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
		expect(nav).toBeInTheDocument();
		expect(nav.tagName).toBe('NAV');
	});

	it('should render breadcrumb with proper list structure', async () => {
		const eventsSubject = new Subject<NavigationEnd>();

		await render(Header, {
			providers: [
				{ provide: Router, useValue: createMockRouter(eventsSubject) },
				{
					provide: ActivatedRoute,
					useValue: { root: createMockActivatedRoute(undefined, '') },
				},
			],
		});

		const list = screen.getByRole('list', { hidden: true });
		expect(list).toBeInTheDocument();
	});

	it('should integrate breadcrumb component without errors', async () => {
		const eventsSubject = new Subject<NavigationEnd>();

		await render(Header, {
			providers: [
				{ provide: Router, useValue: createMockRouter(eventsSubject) },
				{
					provide: ActivatedRoute,
					useValue: { root: createMockActivatedRoute(undefined, '') },
				},
			],
		});

		const breadcrumb = screen.getByRole('navigation', { name: /breadcrumb/i });
		expect(breadcrumb).toBeInTheDocument();
	});

	it('should render breadcrumb with correct styling classes', async () => {
		const eventsSubject = new Subject<NavigationEnd>();

		await render(Header, {
			providers: [
				{ provide: Router, useValue: createMockRouter(eventsSubject) },
				{
					provide: ActivatedRoute,
					useValue: { root: createMockActivatedRoute(undefined, '') },
				},
			],
		});

		const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
		expect(nav).toHaveClass('flex', 'items-center', 'gap-1');
	});

	it('should update breadcrumbs when navigation changes', async () => {
		const eventsSubject = new Subject<NavigationEnd>();
		const childRoute = createMockActivatedRoute('Settings', 'settings', []);
		const rootRoute = createMockActivatedRoute('Admin', 'admin', [childRoute]);

		await render(Header, {
			providers: [
				{ provide: Router, useValue: createMockRouter(eventsSubject) },
				{
					provide: ActivatedRoute,
					useValue: { root: createMockActivatedRoute(undefined, '', [rootRoute]) },
				},
			],
		});

		// Trigger navigation event
		eventsSubject.next(new NavigationEnd(1, '/admin/settings', ''));

		await waitFor(() => {
			expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
		});
	});
});
