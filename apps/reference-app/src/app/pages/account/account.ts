import { Component, inject } from '@angular/core'
import { PageShell } from '@components/page-shell/page-shell'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { AuthStore } from '@store/auth/auth.store'

@Component({
	selector: 'app-account',
	imports: [PageShell, TranslatePipe],
	template: `
		<app-page-shell [title]="'ACCOUNT.TITLE' | translate" [loading]="false">
			<p pageDescription>{{ 'ACCOUNT.DESCRIPTION' | translate }}</p>

			@if (authStore.currentUser(); as user) {
				<section
					class="border-border bg-card max-w-2xl rounded-xl border p-4 sm:p-5"
					aria-labelledby="account-profile-title"
				>
					<h2 id="account-profile-title" class="text-foreground text-lg font-semibold">
						{{ 'ACCOUNT.PROFILE.TITLE' | translate }}
					</h2>

					<dl class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div>
							<dt class="text-muted-foreground text-sm">{{ 'ACCOUNT.PROFILE.FIRST_NAME' | translate }}</dt>
							<dd class="text-foreground mt-1 font-medium break-words">{{ user.firstName }}</dd>
						</div>
						<div>
							<dt class="text-muted-foreground text-sm">{{ 'ACCOUNT.PROFILE.LAST_NAME' | translate }}</dt>
							<dd class="text-foreground mt-1 font-medium break-words">{{ user.lastName }}</dd>
						</div>
						<div class="sm:col-span-2">
							<dt class="text-muted-foreground text-sm">{{ 'ACCOUNT.PROFILE.EMAIL' | translate }}</dt>
							<dd class="text-foreground mt-1 font-medium break-all">{{ user.email }}</dd>
						</div>
					</dl>
				</section>
			}
		</app-page-shell>
	`,
})
export default class Account {
	protected readonly authStore = inject(AuthStore)
}
