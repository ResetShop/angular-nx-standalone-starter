import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { Breadcrumb } from '@components/breadcrumb/breadcrumb'

// Navigation test mock components
@Component({
	selector: 'app-root-page',
	standalone: true,
	template: '<router-outlet />',
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [RouterOutlet],
})
export class RootPageComponent {}

@Component({
	selector: 'app-detail-page',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: '<div>Detail Page</div>',
})
export class DetailPageComponent {}

// Breadcrumb test mock components
@Component({
	selector: 'app-home-page',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: '<div>Home Page</div>',
})
export class HomePageComponent {}

@Component({
	selector: 'app-health-page',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: '<div>Health Page</div>',
})
export class HealthPageComponent {}

@Component({
	selector: 'app-dashboard-page',
	standalone: true,
	template: '<app-breadcrumb /><router-outlet/>',
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [RouterOutlet, Breadcrumb],
})
export class MockDashboardComponentPage {}

@Component({
	selector: 'app-settings-page',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: '<div>Settings Page</div>',
})
export class SettingsPageComponent {}

@Component({
	selector: 'app-admin-page',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: '<div>Admin Page</div>',
})
export class AdminPageComponent {}

@Component({
	selector: 'app-test-page',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: '<div>Test Page</div>',
})
export class TestPageComponent {}

@Component({
	selector: 'app-current-page',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: '<div>Current Page</div>',
})
export class CurrentPageComponent {}
