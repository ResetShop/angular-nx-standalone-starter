import { NgOptimizedImage } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { email, form, required, schema, FormField as SignalFormField, type FieldTree } from '@angular/forms/signals'
import { Router, RouterLink } from '@angular/router'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Button } from '@resetshop/ui/button/button'
import { FormField } from '@resetshop/ui/form-field/form-field'
import ImmersivePanel from '@resetshop/ui/immersive-panel/immersive-panel'

interface ResetPasswordForm {
	email: string
}

@Component({
	selector: 'app-reset-password-page',
	imports: [ImmersivePanel, Button, NgOptimizedImage, RouterLink, FormField, SignalFormField, TranslatePipe],
	template: `
		<form (ngSubmit)="onSubmit()" aria-labelledby="reset-password-heading" class="w-full px-8 sm:w-[420px]">
			<app-immersive-panel [titleTemplate]="cardTitle" [contentTemplate]="cardContent" [footerTemplate]="cardFooter" />
			<ng-template #cardTitle>
				<div class="mt-4 flex flex-col gap-4">
					<img ngSrc="favicon.ico" width="47" height="40" alt="Your Company" class="mx-auto h-10 w-auto" />
					<div id="reset-password-heading" class="mb-8 text-center">
						{{ 'AUTH.RESET_PASSWORD.TITLE' | translate }}
					</div>
				</div>
			</ng-template>

			<ng-template #cardContent>
				<div class="flex w-full max-w-96 flex-col gap-6">
					<app-form-field [label]="'AUTH.RESET_PASSWORD.EMAIL_LABEL' | translate">
						<input [formField]="resetPasswordForm.email" type="email" autocomplete="email" autofocus />
					</app-form-field>
				</div>
			</ng-template>

			<ng-template #cardFooter>
				<div class="flex flex-col gap-4 font-semibold">
					<button [fullWidth]="true" [disabled]="!isFormValid()" appButton variant="default" size="md" type="submit">
						{{ 'AUTH.RESET_PASSWORD.SUBMIT' | translate }}
					</button>

					<div class="text-muted-foreground text-center text-sm">
						<a [routerLink]="loginUrl" appButton variant="link">
							{{ 'AUTH.RESET_PASSWORD.BACK_TO_LOGIN' | translate }}
						</a>
					</div>
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
export default class ResetPassword {
	private readonly router = inject(Router)

	protected readonly loginUrl = this.router.createUrlTree(['/auth/login'])

	private readonly model = signal<ResetPasswordForm>({ email: '' })
	protected readonly resetPasswordForm: FieldTree<ResetPasswordForm> = form(
		this.model,
		schema<ResetPasswordForm>((resetPassword) => {
			required(resetPassword.email)
			email(resetPassword.email)
		}),
	)

	protected readonly isFormValid = computed(() => {
		const { email } = this.model()
		if (!email) return false
		return this.resetPasswordForm.email().errors().length === 0
	})

	protected onSubmit() {
		if (!this.isFormValid()) {
			// Signal forms FieldState.markAsTouched() only marks a single field;
			// there is no markAllAsTouched() equivalent — each field must be touched individually.
			this.resetPasswordForm.email().markAsTouched()
			return
		}

		// TODO: Implement actual password reset logic
		// After successful request, could navigate to a confirmation page
		// this.router.navigate(["/reset-password-sent"]);
	}
}
