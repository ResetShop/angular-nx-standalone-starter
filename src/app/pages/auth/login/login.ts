import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Button } from '@components/button/button';
import Card from '@components/card/card';
import { LoginForm } from '@interfaces/auth';
import { Translation } from '@providers/i18n/translation';
import { AuthStore } from '@store/auth/auth.store';

@Component({
	selector: 'app-login-page',
	imports: [Card, Button, NgOptimizedImage, RouterLink, ReactiveFormsModule],
	template: `
		<dialog open class="align-self-center flex justify-self-center bg-transparent">
			<form (ngSubmit)="onSubmit()" [formGroup]="loginForm" class="z-10 sm:h-[420px] sm:w-[420px]">
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
								@if (loginForm.controls.email.invalid && loginForm.controls.email.dirty) {
									<p class="text-destructive mt-2 text-sm">
										@if (loginForm.controls.email.errors?.['required']) {
											El email es requerido
										}
										@if (loginForm.controls.email.errors?.['email']) {
											Ingrese un email válido
										}
									</p>
								}
							</div>
						</div>
						<div>
							<div class="flex items-center justify-between">
								<label for="password" class="text-foreground block text-sm/6 font-medium">Contraseña</label>
								<div class="text-sm">
									<a
										[routerLink]="resetPassword"
										class="text-default hover:text-default/90 font-semibold hover:underline"
									>
										¿Olvidaste tu contraseña?
									</a>
								</div>
							</div>
							<div class="mt-2">
								<input
									id="password"
									type="password"
									formControlName="password"
									autocomplete="current-password"
									class="text-foreground outline-input placeholder:text-muted-foreground focus:outline-ring bg-background block w-full rounded-md px-3 py-1.5 text-base outline-1 -outline-offset-1 focus:outline-2 focus:-outline-offset-2 sm:text-sm/6"
								/>
								@if (loginForm.controls.password.invalid && loginForm.controls.password.dirty) {
									<p class="text-destructive mt-2 text-sm">
										@if (loginForm.controls.password.errors?.['required']) {
											La contraseña es requerida
										}
										@if (loginForm.controls.password.errors?.['minlength']) {
											La contraseña debe tener al menos 8 caracteres
										}
									</p>
								}
							</div>
						</div>
					</div>

					@if (errorMessage()) {
						<div
							class="border-destructive/30 bg-destructive/10 text-destructive mt-4 rounded-md border p-3 text-sm"
							role="alert"
						>
							{{ errorMessage() }}
						</div>
					}
				</ng-template>

				<ng-template #cardFooter>
					<div class="flex justify-center font-semibold">
						<button [fullWidth]="true" [disabled]="loginForm.invalid" appButton size="md" type="submit">
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
	private authStore = inject(AuthStore);
	private router = inject(Router);
	private translation = inject(Translation);

	readonly resetPassword = this.router.createUrlTree(['/auth/reset-password']);
	readonly errorMessage = signal<string | null>(null);

	readonly loginForm = new FormGroup<LoginForm>({
		email: new FormControl('', {
			nonNullable: true,
			validators: [Validators.required, Validators.email],
		}),
		password: new FormControl('', {
			nonNullable: true,
			validators: [Validators.required, Validators.minLength(8)],
		}),
	});

	constructor() {
		// Handle login state changes: navigation on success, error display on failure
		effect(() => {
			const user = this.authStore.currentUser();
			const error = this.authStore.loginError();

			if (user) {
				// Clear any previous error and navigate to dashboard
				this.errorMessage.set(null);
				this.router.navigate(['/dashboard']);
			} else if (error) {
				// Display translated error message
				this.errorMessage.set(
					this.translation.instant(error.code ? `AUTH.ERRORS.${error.code}` : 'AUTH.ERRORS.GENERIC'),
				);
			}
		});
	}

	onSubmit() {
		if (this.loginForm.invalid) {
			this.loginForm.markAllAsTouched();
			return;
		}

		// Clear previous error
		this.errorMessage.set(null);

		const { email, password } = this.loginForm.value;
		this.authStore.login({ email, password });
	}
}
