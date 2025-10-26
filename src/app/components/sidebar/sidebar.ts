import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Brand } from '@components/brand/brand';
import { Button } from '@components/button/button';
import NavSection from '@components/nav-section/nav-section';
import { Auth } from '@providers/auth/auth';
import { Navigation } from '@providers/navigation/navigation';

@Component({
	// eslint-disable-next-line @angular-eslint/component-selector
	selector: '[appSidebar]',
	imports: [Button, NavSection, Brand],
	template: `
		<div class="p-2">
			<app-brand />
		</div>
		<div class="flex flex-col gap-2">
			@for (section of sections(); track section.id) {
				<app-nav-section [section]="section" class="px-2" />
			}
		</div>
		<div class="flex items-center justify-center border-gray-200">
			<button (click)="logout()" appButton variant="link">Cerrar sesión</button>
		</div>
	`,
	styles: `
		:host {
			@reference "tailwindcss";
			@apply grid h-svh grid-rows-[64px_1fr_64px];
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
	auth = inject(Auth);
	navigation = inject(Navigation);
	router = inject(Router);
	readonly sections = computed(() => this.navigation.sections());

	logout() {
		this.auth.logout();
		this.router.navigate(['..', 'auth', 'login']);
	}
}
