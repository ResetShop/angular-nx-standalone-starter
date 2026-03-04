import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { NAVIGATION_CONFIG, NavigationConfig } from '@interfaces/navigation';
import { Navigation } from './navigation';

//Mocks
import {
	DetailPageComponent,
	RootPageComponent,
	SettingsPageComponent,
	WelcomePageComponent,
} from '@mocks/component.mocks';

describe('Navigation Provider', () => {
	let service: Navigation;
	let harness: RouterTestingHarness;

	const mockNavigationConfig: NavigationConfig = {
		sections: [
			{
				id: 'settings',
				name: 'Ajustes y mantenimiento',
				routes: [
					{
						id: 'welcome',
						name: 'Configuración inicial',
						route: 'welcome',
						icon: { featherHome: 'featherHome' },
					},
					{
						id: 'health',
						name: 'Salud',
						route: 'health',
						icon: { featherActivity: 'featherActivity' },
					},
				],
			},
		],
	};

	const routes = [
		{
			path: '',
			title: 'Root',
			component: RootPageComponent,
			children: [
				{
					path: 'welcome',
					title: 'Welcome',
					component: WelcomePageComponent,
				},
				{
					path: 'settings',
					title: 'Settings',
					component: SettingsPageComponent,
					children: [
						{
							path: 'detail',
							title: 'Detail',
							component: DetailPageComponent,
						},
					],
				},
			],
		},
	];

	beforeEach(async () => {
		TestBed.configureTestingModule({
			providers: [
				provideRouter(routes),
				{
					provide: NAVIGATION_CONFIG,
					useValue: mockNavigationConfig,
				},
			],
		});

		service = TestBed.inject(Navigation);
		harness = await RouterTestingHarness.create();
	});

	describe('Service Creation', () => {
		it('should be created', () => {
			expect(service).toBeTruthy();
		});

		it('should be a singleton (providedIn: root)', () => {
			const service1 = TestBed.inject(Navigation);
			const service2 = TestBed.inject(Navigation);
			expect(service1).toBe(service2);
		});
	});

	describe('Sections Signal', () => {
		it('should initialize sections from NAVIGATION_CONFIG', () => {
			const sections = service.sections();

			expect(sections).toBeDefined();
			expect(sections).toHaveLength(1);
			expect(sections[0].id).toBe('settings');
			expect(sections[0].name).toBe('Ajustes y mantenimiento');
		});

		it('should have correct routes in sections', () => {
			const sections = service.sections();
			const settingsSection = sections[0];

			expect(settingsSection.routes).toHaveLength(2);
			expect(settingsSection.routes[0].id).toBe('welcome');
			expect(settingsSection.routes[0].name).toBe('Configuración inicial');
			expect(settingsSection.routes[0].icon).toEqual({ featherHome: 'featherHome' });
			expect(settingsSection.routes[1].id).toBe('health');
			expect(settingsSection.routes[1].name).toBe('Salud');
			expect(settingsSection.routes[1].icon).toEqual({ featherActivity: 'featherActivity' });
		});

		it('should be reactive (computed signal)', () => {
			const sections = service.sections();
			expect(sections).toEqual(service.sections());
		});
	});

	describe('Breadcrumbs Signal', () => {
		it('should have breadcrumbs after initialization', () => {
			const breadcrumbs = service.breadcrumbs();
			expect(breadcrumbs).toBeDefined();
			expect(Array.isArray(breadcrumbs)).toBe(true);
		});

		it('should be reactive (computed signal)', () => {
			const breadcrumbs1 = service.breadcrumbs();
			const breadcrumbs2 = service.breadcrumbs();
			expect(breadcrumbs1).toEqual(breadcrumbs2);
		});
	});

	describe('Breadcrumb Generation on Navigation', () => {
		it('should generate single breadcrumb on navigation', async () => {
			await harness.navigateByUrl('/welcome', RootPageComponent);

			const breadcrumbs = service.breadcrumbs();
			expect(breadcrumbs).toHaveLength(2);
			expect(breadcrumbs[0].title).toBe('Root');
			expect(breadcrumbs[1].title).toBe('Welcome');
			expect(breadcrumbs[1].isActive).toBe(true);
		});

		it('should generate nested breadcrumbs on deep navigation', async () => {
			await harness.navigateByUrl('/settings/detail', RootPageComponent);

			const breadcrumbs = service.breadcrumbs();
			expect(breadcrumbs).toHaveLength(3);
			expect(breadcrumbs[0].title).toBe('Root');
			expect(breadcrumbs[0].isActive).toBe(false);
			expect(breadcrumbs[1].title).toBe('Settings');
			expect(breadcrumbs[1].isActive).toBe(false);
			expect(breadcrumbs[2].title).toBe('Detail');
			expect(breadcrumbs[2].isActive).toBe(true);
		});

		it('should only mark last breadcrumb as active', async () => {
			await harness.navigateByUrl('/settings/detail', RootPageComponent);

			const breadcrumbs = service.breadcrumbs();
			const activeCount = breadcrumbs.filter((b) => b.isActive).length;
			expect(activeCount).toBe(1);
			expect(breadcrumbs[breadcrumbs.length - 1].isActive).toBe(true);
		});

		it('should navigate between routes and update breadcrumbs', async () => {
			await harness.navigateByUrl('/welcome', RootPageComponent);
			let breadcrumbs = service.breadcrumbs();
			expect(breadcrumbs[breadcrumbs.length - 1].title).toBe('Welcome');

			await harness.navigateByUrl('/settings/detail', RootPageComponent);
			breadcrumbs = service.breadcrumbs();
			expect(breadcrumbs[breadcrumbs.length - 1].title).toBe('Detail');
		});
	});

	describe('Configuration Injection', () => {
		it('should correctly initialize sections from injected config', () => {
			const sections = service.sections();
			expect(sections).toEqual(mockNavigationConfig.sections);
		});

		it('should preserve config structure with all properties', () => {
			const sections = service.sections();
			const welcomeRoute = sections[0].routes[0];

			expect(welcomeRoute).toEqual({
				id: 'welcome',
				name: 'Configuración inicial',
				route: 'welcome',
				icon: { featherHome: 'featherHome' },
			});
		});
	});
});
