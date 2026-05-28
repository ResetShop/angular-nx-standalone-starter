import { ChangeDetectionStrategy, Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { ThemeToggle } from '@components/theme-toggle/theme-toggle'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Button } from '@resetshop/ui/button/button'
import { AuthStore } from '@store/auth/auth.store'

@Component({
	selector: 'app-landing-header',
	imports: [RouterLink, ThemeToggle, Button, TranslatePipe],
	template: `
		<header class="border-b border-gray-200 bg-white dark:border-white/10 dark:bg-black/95">
			<div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
				<a [routerLink]="['/']" class="text-foreground text-base font-semibold sm:text-lg">
					{{ 'LANDING.BRAND_NAME' | translate }}
				</a>
				<div class="flex items-center gap-2">
					<app-theme-toggle />
					@if (isAuthenticated()) {
						<a [routerLink]="['/dashboard']" appButton variant="outline" size="sm">
							{{ 'LANDING.GO_TO_DASHBOARD' | translate }}
						</a>
					}
					<a [routerLink]="['/auth/login']" appButton variant="default" size="sm">
						{{ 'LANDING.LOGIN_BUTTON' | translate }}
					</a>
				</div>
			</div>
		</header>
	`,
	styles: `
		:host {
			display: block;
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingHeader {
	private readonly authStore = inject(AuthStore)

	protected readonly isAuthenticated = this.authStore.isAuthenticated
}
