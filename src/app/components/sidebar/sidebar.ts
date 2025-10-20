import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '@components/button/button';

export interface NavigationSection {
	id: string;
	name: string;
	routes: NavigationRoute[];
}

export interface NavigationRoute {
	id: string;
	name: string;
	route: string;
	children: Omit<NavigationRoute, 'children'>[]; // TODO: Remove Omit if navigation has more than 1 level of nesting
}

@Component({
	selector: 'app-sidebar',
	imports: [RouterLink, Button],
	template: `
		<div>
			@for (section of sections(); track section.id) {
				<span class="mb-2 text-sm font-medium text-gray-600">{{ section.name }}</span>
				<ul>
					@for (route of section.routes; track route.id) {
						<li>
							<a [routerLink]="route.route">{{ route.name }}</a>
						</li>
					}
				</ul>
			}
		</div>
		<div class="flex items-center justify-center border-t-1 border-gray-200">
			<!-- TODO: Implement signing off in AuthService and routing to login page-->
			<a [routerLink]="['..', 'auth', 'login']" appButton variant="link">Cerrar sesión</a>
		</div>
	`,
	styles: `
		:host {
			@reference "tailwindcss";
			@apply grid h-svh grid-rows-[1fr_64px];
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
	readonly sections = signal<NavigationSection[]>([
		{
			id: 'settings',
			name: 'Ajustes y mantenimiento',
			routes: [
				{
					id: 'health',
					name: 'Salud',
					route: 'health',
					children: [],
				},
			],
		},
	]);
}
