import { NgOptimizedImage } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { email, form, required, schema, FormField as SignalFormField, type FieldTree } from '@angular/forms/signals'
import { Router, RouterLink } from '@angular/router'
import { Button } from '@components/button/button'
import Card from '@components/card/card'
import { FormField } from '@components/form-field/form-field'
import { TranslatePipe } from '@providers/i18n/translate.pipe'

interface ResetPasswordForm {
	email: string
}

@Component({
	selector: 'app-reset-password-page',
	imports: [Card, Button, NgOptimizedImage, RouterLink, FormField, SignalFormField, TranslatePipe],
	template: `
		<dialog open class="align-self-center flex justify-self-center bg-transparent">
			<form (ngSubmit)="onSubmit()" class="z-10">
				<app-card [titleTemplate]="cardTitle" [contentTemplate]="cardContent" [footerTemplate]="cardFooter" />
				<ng-template #cardTitle>
					<div class="mt-4 flex flex-col gap-4">
						<img ngSrc="favicon.ico" width="47" height="40" alt="Your Company" class="mx-auto h-10 w-auto" />
						<div class="mb-8 text-center">{{ 'AUTH.RESET_PASSWORD.TITLE' | translate }}</div>
					</div>
				</ng-template>

				<ng-template #cardContent>
					<div class="flex w-96 flex-col gap-6">
						<app-form-field [label]="'AUTH.RESET_PASSWORD.EMAIL_LABEL' | translate">
							<input [formField]="resetPasswordForm.email" type="email" autocomplete="email" />
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
		</dialog>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	styles: `
		@reference "#tailwind-theme";
		:host {
			@apply bg-muted flex h-svh w-svw items-center justify-center;
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

	protected readonly isFormValid = computed(() => this.resetPasswordForm().errors().length === 0)

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
