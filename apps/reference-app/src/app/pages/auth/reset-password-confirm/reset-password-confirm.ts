import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core'
import { form, minLength, required, schema, FormField as SignalFormField, type FieldTree } from '@angular/forms/signals'
import { ActivatedRoute, Router } from '@angular/router'
import { MIN_PASSWORD_LENGTH } from '@contracts/auth/auth.constants'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import type { TranslationKey } from '@resetshop/angular-core/i18n/translations.schema'
import { Alert, AlertDescription } from '@resetshop/ui/alert/alert'
import { Button } from '@resetshop/ui/button/button'
import { FormField } from '@resetshop/ui/form-field/form-field'
import ImmersivePanel from '@resetshop/ui/immersive-panel/immersive-panel'
import { AuthStore } from '@store/auth/auth.store'

interface ResetPasswordConfirmForm {
	newPassword: string
}

@Component({
	selector: 'app-reset-password-confirm-page',
	imports: [Alert, AlertDescription, ImmersivePanel, Button, FormField, SignalFormField, TranslatePipe],
	template: `
		<form (submit)="onSubmit($event)" aria-labelledby="reset-password-confirm-heading" class="w-full px-8 sm:w-[420px]">
			<app-immersive-panel [titleTemplate]="cardTitle" [contentTemplate]="cardContent" [footerTemplate]="cardFooter" />
			<ng-template #cardTitle>
				<span id="reset-password-confirm-heading" class="text-foreground mt-4 mb-8 block text-center">
					{{ 'AUTH.RESET_PASSWORD_CONFIRM.TITLE' | translate }}
				</span>
			</ng-template>

			<ng-template #cardContent>
				@if (token()) {
					<div class="flex w-full max-w-96 flex-col gap-4 sm:gap-6">
						<p class="text-muted-foreground text-center text-sm">
							{{ 'AUTH.RESET_PASSWORD_CONFIRM.DESCRIPTION' | translate }}
						</p>
						<app-form-field
							[label]="'AUTH.RESET_PASSWORD_CONFIRM.NEW_PASSWORD_LABEL' | translate"
							[showRequired]="false"
						>
							<input [formField]="resetForm.newPassword" type="password" autocomplete="new-password" />
						</app-form-field>
					</div>
				} @else {
					<div appAlert variant="destructive" class="w-full max-w-96">
						<p appAlertDescription>{{ 'AUTH.RESET_PASSWORD_CONFIRM.MISSING_TOKEN' | translate }}</p>
					</div>
				}

				@if (errorMessage()) {
					<div appAlert variant="destructive" class="mt-4">
						<p appAlertDescription>{{ errorMessage() }}</p>
					</div>
				}
			</ng-template>

			<ng-template #cardFooter>
				<div class="flex justify-center font-semibold">
					<button
						[fullWidth]="true"
						[disabled]="!isFormValid() || !token() || authStore.isResettingPassword()"
						appButton
						size="md"
						type="submit"
					>
						{{ 'AUTH.RESET_PASSWORD_CONFIRM.SUBMIT' | translate }}
					</button>
				</div>
			</ng-template>
		</form>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	styles: `
		@reference "#tailwind-theme";
		:host {
			@apply bg-card flex h-svh w-svw items-center justify-center sm:bg-black/95;
		}
	`,
})
export default class ResetPasswordConfirm {
	protected readonly authStore = inject(AuthStore)
	private readonly router = inject(Router)
	private readonly route = inject(ActivatedRoute)
	private readonly translation = inject(Translation)

	// The raw reset token from the email link (?token=…). Empty when the link is malformed/missing it.
	protected readonly token = signal(this.route.snapshot.queryParamMap.get('token') ?? '')
	protected readonly errorMessage = signal<string | null>(null)

	// Set on submit so the success effect only navigates after a reset this page initiated.
	private readonly submitted = signal(false)

	private readonly model = signal<ResetPasswordConfirmForm>({ newPassword: '' })
	protected readonly resetForm: FieldTree<ResetPasswordConfirmForm> = form(
		this.model,
		schema<ResetPasswordConfirmForm>((reset) => {
			required(reset.newPassword)
			minLength(reset.newPassword, MIN_PASSWORD_LENGTH)
		}),
	)

	protected readonly isFormValid = computed(() => {
		if (!this.model().newPassword) return false
		return this.resetForm.newPassword().errors().length === 0
	})

	private readonly resetEffect = effect(() => {
		const resetting = this.authStore.isResettingPassword()
		const error = this.authStore.resetPasswordError()

		if (error) {
			// REASON: every PublicAuthErrorCode value has a matching AUTH.ERRORS.* translation key, but
			// TS won't narrow the interpolated template-literal union against the full TranslationKey.
			this.errorMessage.set(this.translation.instant(`AUTH.ERRORS.${error.code}` as TranslationKey))
			return
		}

		// Success path: navigate to login once the request finished and this page initiated it.
		if (!resetting && untracked(() => this.submitted())) {
			untracked(() => this.submitted.set(false))
			this.router.navigate(['/auth/login'])
		}
	})

	protected onSubmit(event: Event) {
		event.preventDefault()
		if (!this.isFormValid() || !this.token()) {
			this.resetForm.newPassword().markAsTouched()
			return
		}

		this.errorMessage.set(null)
		this.submitted.set(true)
		this.authStore.resetPassword({ token: this.token(), newPassword: this.model().newPassword })
	}
}
