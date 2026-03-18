import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { Button } from '@components/button/button'
import { ThemeToggle } from '@components/theme-toggle/theme-toggle'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { featherMenu } from '@ng-icons/feather-icons'
import { UIStore } from '@store/ui/ui.store'
import { Breadcrumb } from '../breadcrumb/breadcrumb'

@Component({
	// eslint-disable-next-line @angular-eslint/component-selector
	selector: '[appHeader]',
	imports: [Breadcrumb, ThemeToggle, Button, NgIcon],
	viewProviders: [provideIcons({ featherMenu })],
	template: `
		<div class="flex w-full items-center justify-between">
			<div class="flex items-center gap-2">
				<button
					(click)="uiStore.toggleSidebar()"
					appButton
					variant="ghost"
					size="sm"
					class="lg:hidden"
					aria-label="Open navigation menu"
				>
					<ng-icon name="featherMenu" />
				</button>
				<app-breadcrumb />
			</div>
			<app-theme-toggle />
		</div>
	`,
	styles: `
		:host {
			@reference "tailwindcss";
			@apply flex h-full items-center px-4 dark:text-gray-50;
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
	protected readonly uiStore = inject(UIStore)
}
