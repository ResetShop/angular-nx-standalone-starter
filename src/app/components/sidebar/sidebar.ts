import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Button } from '@components/button/button';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { featherActivity, featherHome, featherRefreshCw } from '@ng-icons/feather-icons';
import NavSection from '@components/nav-section/nav-section';
import { Navigation } from '@providers/navigation/navigation';

@Component({
	selector: 'app-sidebar',
	imports: [RouterLink, Button, NgIcon, NavSection],
	template: `
		<div class="flex items-center border-gray-200 px-2">
			<!--	TODO: Replace with the navigation to your home page / initial page -->
			<a [routerLink]="['welcome']" [fullWidth]="true" appButton variant="default" class="gap-2 font-semibold">
				<ng-icon name="featherRefreshCw" />
				<span>Reset Starter Repo</span>
			</a>
		</div>
		<div class="flex flex-col gap-2">
			@for (section of sections(); track section.id) {
				<app-nav-section [section]="section" />
			}
		</div>
		<div class="flex items-center justify-center border-gray-200">
			<!-- TODO: Implement signing off in AuthService and routing to login page-->
			<a [routerLink]="['..', 'auth', 'login']" appButton variant="link">Cerrar sesión</a>
		</div>
	`,
	styles: `
		:host {
			@reference "tailwindcss";
			@apply grid h-svh grid-rows-[64px_1fr_64px] p-2;
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	viewProviders: [provideIcons({ featherActivity, featherHome, featherRefreshCw })],
})
export class Sidebar {
	navigation = inject(Navigation);
	readonly sections = computed(() => this.navigation.sections());
}
