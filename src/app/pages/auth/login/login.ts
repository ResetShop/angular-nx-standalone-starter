import { NgOptimizedImage } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core'
import {
	email as emailValidator,
	form,
	minLength,
	required,
	schema,
	FormField as SignalFormField,
	type FieldTree,
} from '@angular/forms/signals'
import { Router, RouterLink } from '@angular/router'
import { Alert, AlertDescription } from '@components/alert/alert'
import { Button } from '@components/button/button'
import Card from '@components/card/card'
import { FormField } from '@components/form-field/form-field'
import type { LoginForm } from '@interfaces/auth'
import { Translation } from '@providers/i18n/translation'
import { AuthStore } from '@store/auth/auth.store'

@Component({
	selector: 'app-login-page',
	imports: [Alert, AlertDescription, Card, Button, NgOptimizedImage, RouterLink, FormField, SignalFormField],
	template: `
		<dialog open class="align-self-center flex justify-self-center bg-transparent">
			<form (submit)="onSubmit($event)" class="z-10 sm:h-[420px] sm:w-[420px]">
				<app-card
					[titleTemplate]="cardTitle"
					[contentTemplate]="cardContent"
					[footerTemplate]="cardFooter"
					class="h-svh w-svw"
				/>
				<ng-template #cardTitle>
					<!-- TODO: Replace the image for your system/company logo -->
					<div class="mt-4 flex flex-col gap-4">
						<img ngSrc="favicon.ico" width="47" height="40" alt="Your Company" class="mx-auto h-10 w-auto" />
						<div class="text-foreground mb-8 text-center">Ingresar al sistema</div>
					</div>
				</ng-template>

				<ng-template #cardContent>
					<div class="flex w-96 flex-col gap-6">
						<app-form-field [label]="'Dirección de email'" [showRequired]="false">
							<input [formField]="loginForm.email" type="email" autocomplete="email" />
						</app-form-field>

						<div>
							<app-form-field [label]="'Contraseña'" [showRequired]="false">
								<input [formField]="loginForm.password" type="password" autocomplete="current-password" />
							</app-form-field>
							<div class="mt-1 text-right text-sm">
								<a
									[routerLink]="resetPassword"
									class="text-default hover:text-default/90 font-semibold hover:underline"
								>
									¿Olvidaste tu contraseña?
								</a>
							</div>
						</div>
					</div>

					@if (errorMessage()) {
						<div appAlert variant="destructive" class="mt-4">
							<p appAlertDescription>{{ errorMessage() }}</p>
						</div>
					}
				</ng-template>

				<ng-template #cardFooter>
					<div class="flex justify-center font-semibold">
						<button [fullWidth]="true" [disabled]="!isFormValid()" appButton size="md" type="submit">
							Iniciar sesión
						</button>
					</div>
				</ng-template>
			</form>
		</dialog>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	styles: `
		@reference "tailwindcss";
		:host {
			@apply flex h-svh w-svw items-center justify-center bg-black/95;
		}
	`,
})
export default class Login {
	private readonly authStore = inject(AuthStore)
	private readonly router = inject(Router)
	private readonly translation = inject(Translation)

	protected readonly resetPassword = this.router.createUrlTree(['/auth/reset-password'])
	protected readonly errorMessage = signal<string | null>(null)

	private readonly model = signal<LoginForm>({ email: '', password: '' })
	protected readonly loginForm: FieldTree<LoginForm> = form(
		this.model,
		schema<LoginForm>((login) => {
			required(login.email)
			emailValidator(login.email)
			required(login.password)
			minLength(login.password, 8)
		}),
	)

	protected readonly isFormValid = computed(() => this.loginForm().errors().length === 0)

	private readonly loginEffect = effect(() => {
		const user = this.authStore.currentUser()
		const error = this.authStore.loginError()

		if (user) {
			this.errorMessage.set(null)
			this.loginEffect.destroy() // safe: field is assigned before this callback runs
			this.router.navigate(['/dashboard'])
		} else if (error) {
			this.errorMessage.set(this.translation.instant(error.code ? `AUTH.ERRORS.${error.code}` : 'AUTH.ERRORS.GENERIC'))
		}
	})

	protected onSubmit(event: Event) {
		event.preventDefault()
		if (!this.isFormValid()) {
			// Signal forms FieldState.markAsTouched() only marks a single field;
			// there is no markAllAsTouched() equivalent — each field must be touched individually.
			this.loginForm.email().markAsTouched()
			this.loginForm.password().markAsTouched()
			return
		}

		this.errorMessage.set(null)

		const { email, password } = this.model()
		this.authStore.login({ email, password })
	}
}
