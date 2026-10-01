import { Component, inject } from '@angular/core'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Alert, AlertDescription } from '@resetshop/ui/alert/alert'
import { Button } from '@resetshop/ui/button/button'
import { AuthStore } from '@store/auth/auth.store'

@Component({
	selector: 'app-login',
	imports: [Alert, AlertDescription, Button, TranslatePipe],
	template: `
		<main class="bg-background flex min-h-svh items-center justify-center p-4">
			<section class="border-border bg-card w-full max-w-md space-y-6 rounded-xl border p-8 shadow-sm">
				<header class="space-y-2 text-center">
					<h1 class="text-foreground text-2xl font-bold">{{ 'SHELL.LOGIN.TITLE' | translate }}</h1>
					<p class="text-muted-foreground text-sm">{{ 'SHELL.LOGIN.DESCRIPTION' | translate }}</p>
				</header>

				@if (authStore.loginError()) {
					<div appAlert variant="destructive" role="alert">
						<p appAlertDescription>{{ 'SHELL.LOGIN.ERROR' | translate }}</p>
					</div>
				}

				<button (click)="signIn()" [disabled]="authStore.isLoggingIn()" appButton class="w-full" type="button">
					{{ (authStore.isLoggingIn() ? 'SHELL.LOGIN.SIGNING_IN' : 'SHELL.LOGIN.BUTTON') | translate }}
				</button>
			</section>
		</main>
	`,
})
export default class Login {
	protected readonly authStore = inject(AuthStore)

	protected signIn(): void {
		this.authStore.redirectToLogin()
	}
}
