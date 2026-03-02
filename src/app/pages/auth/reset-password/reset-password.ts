import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Button } from '@components/button/button';
import Card from '@components/card/card';

interface ResetPasswordForm {
	email: FormControl<string>;
}

@Component({
	selector: 'app-reset-password-page',
	imports: [Card, Button, NgOptimizedImage, RouterLink, ReactiveFormsModule],
	template: `
		<dialog open class="align-self-center flex justify-self-center bg-transparent">
			<form (ngSubmit)="onSubmit()" [formGroup]="resetPasswordForm" class="z-10">
				<app-card [titleTemplate]="cardTitle" [contentTemplate]="cardContent" [footerTemplate]="cardFooter" />
				<ng-template #cardTitle>
					<div class="mt-4 flex flex-col gap-4">
						<img ngSrc="favicon.ico" width="47" height="40" alt="Your Company" class="mx-auto h-10 w-auto" />
						<div class="mb-8 text-center">Restablecer contraseña</div>
					</div>
				</ng-template>

				<ng-template #cardContent>
					<div class="flex w-96 flex-col gap-6">
						<div>
							<label for="email" class="text-foreground block text-sm/6 font-medium">Dirección de email</label>
							<div class="mt-2">
								<input
									id="email"
									type="email"
									formControlName="email"
									autocomplete="email"
									class="text-foreground outline-input placeholder:text-muted-foreground focus:outline-ring bg-background block w-full rounded-md px-3 py-1.5 text-base outline-1 -outline-offset-1 focus:outline-2 focus:-outline-offset-2 sm:text-sm/6"
								/>
								@if (resetPasswordForm.controls.email.invalid && resetPasswordForm.controls.email.touched) {
									<p class="text-destructive mt-2 text-sm">
										@if (resetPasswordForm.controls.email.errors?.['required']) {
											El email es requerido
										}
										@if (resetPasswordForm.controls.email.errors?.['email']) {
											Ingrese un email válido
										}
									</p>
								}
							</div>
						</div>
					</div>
				</ng-template>

				<ng-template #cardFooter>
					<div class="flex flex-col gap-4 font-semibold">
						<button
							[fullWidth]="true"
							[disabled]="resetPasswordForm.invalid"
							appButton
							variant="default"
							size="md"
							type="submit"
						>
							Enviar enlace de restablecimiento
						</button>

						<div class="text-muted-foreground text-center text-sm">
							<a [routerLink]="loginUrl" appButton variant="link">Volver al inicio de sesión</a>
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
	router = inject(Router);

	readonly loginUrl = this.router.createUrlTree(['/auth/login']);

	readonly resetPasswordForm = new FormGroup<ResetPasswordForm>({
		email: new FormControl('', {
			nonNullable: true,
			validators: [Validators.required, Validators.email],
		}),
	});

	onSubmit() {
		if (this.resetPasswordForm.invalid) {
			this.resetPasswordForm.markAllAsTouched();
			return;
		}

		// TODO: Implement actual password reset logic
		// After successful request, could navigate to a confirmation page
		// this.router.navigate(["/reset-password-sent"]);
	}
}
