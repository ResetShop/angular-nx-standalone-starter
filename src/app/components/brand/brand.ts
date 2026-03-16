import { ChangeDetectionStrategy, Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Button } from '@components/button/button'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { featherRefreshCw } from '@ng-icons/feather-icons'

@Component({
	selector: 'app-brand',
	imports: [Button, NgIcon, RouterLink],
	template: `
		<!--	TODO: Replace with the navigation to your home page / initial page -->
		<a [routerLink]="['welcome']" [fullWidth]="true" appButton variant="default" size="sm" class="gap-2 font-semibold">
			<ng-icon name="featherRefreshCw" data-icon="start" />
			<span>Reset Starter Repo</span>
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
export class Brand {}
