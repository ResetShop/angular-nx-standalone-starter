import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Button } from '@components/button/button';
import Card from '@components/card/card';
import { LoginForm } from '@interfaces/auth';
import { Auth } from '@providers/auth/auth';
import { first } from 'rxjs';

@Component({
	selector: 'app-login-page',
	imports: [CommonModule, Card, Button, NgOptimizedImage, RouterLink, ReactiveFormsModule],
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
						<div class="mb-8 text-center dark:text-white">Ingresar al sistema</div>
					</div>
				</ng-template>

				<ng-template #cardContent>
					<div class="flex w-96 flex-col gap-6">
						<div>
							<label for="email" class="block text-sm/6 font-medium text-gray-900">Dirección de email</label>
							<div class="mt-2">
								<input
									id="email"
									type="email"
									formControlName="email"
									autocomplete="email"
									class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
								/>
								@if (loginForm.controls.email.invalid && loginForm.controls.email.dirty) {
									<p class="text-danger mt-2 text-sm">
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
								<label for="password" class="block text-sm/6 font-medium text-gray-900">Contraseña</label>
								<div class="text-sm">
									<a
										[routerLink]="resetPassword"
										class="text-primary hover:text-primary/90 font-semibold hover:underline"
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
									class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
								/>
								@if (loginForm.controls.password.invalid && loginForm.controls.password.dirty) {
									<p class="text-danger mt-2 text-sm">
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
	auth = inject(Auth);
	router = inject(Router);

	readonly resetPassword = this.router.createUrlTree(['/auth/reset-password']);

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
		effect(() => {
			const user = this.auth.currentUser();
			if (user) {
				this.router.navigate(['/dashboard']);
			}
		});
	}

	onSubmit() {
		if (this.loginForm.invalid) {
			this.loginForm.markAllAsTouched();
			return;
		}

		const { email, password } = this.loginForm.value;
		this.auth.login({ email, password }).pipe(first()).subscribe();
	}
}
