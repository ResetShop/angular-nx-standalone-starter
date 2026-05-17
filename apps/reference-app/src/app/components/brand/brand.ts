import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { featherRefreshCw } from '@ng-icons/feather-icons'
import { Button } from '@resetshop/ui/button/button'
import { UIStore } from '@store/ui/ui.store'

@Component({
	selector: 'app-brand',
	imports: [Button, NgIcon, RouterLink],
	template: `
		<!--	TODO: Replace with the navigation to your home page / initial page -->
		<a
			[routerLink]="['..', 'dashboard']"
			[fullWidth]="true"
			appButton
			variant="default"
			size="sm"
			class="gap-2 font-semibold"
		>
			<ng-icon name="featherRefreshCw" data-icon="start" />
			@if (!collapsed()) {
				<span class="min-w-0 truncate">Reset Starter Repo</span>
			}
		</a>
	`,
	styles: `
		:host {
			@reference "tailwindcss";
			@apply flex items-center p-2;
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	viewProviders: [provideIcons({ featherRefreshCw })],
})
export class Brand {
	protected readonly collapsed = inject(UIStore).isSidebarEffectivelyCollapsed
}
