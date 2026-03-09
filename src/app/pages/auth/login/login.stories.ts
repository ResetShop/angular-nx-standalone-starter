import { NgOptimizedImage } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import {
	email,
	form,
	minLength,
	provideSignalFormsConfig,
	required,
	schema,
	FormField as SignalFormField,
	type FieldTree,
} from '@angular/forms/signals';
import { Button } from '@components/button/button';
import Card from '@components/card/card';
import { FormField } from '@components/form-field/form-field';
import { LoginErrorCode } from '@contracts/auth/auth.errors';
import type { LoginForm } from '@interfaces/auth';
import { Translation, type Language } from '@providers/i18n/translation';
import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig } from '@storybook/angular';

/**
 * Error code options for the story.
 * null represents no error state.
 */
type ErrorCodeOption = LoginErrorCode | null;

/**
 * Standalone presentational component for Storybook that mirrors the Login page UI.
 * Uses the Translation service to display localized error messages.
 */
@Component({
	selector: 'app-login-story',
	standalone: true,
	imports: [Card, Button, NgOptimizedImage, FormField, SignalFormField],
	template: `
		<div class="flex h-[600px] w-full items-center justify-center bg-black/95">
			<dialog open class="align-self-center flex justify-self-center bg-transparent">
				<div class="z-10 sm:h-[420px] sm:w-[420px]">
					<app-card [titleTemplate]="cardTitle" [contentTemplate]="cardContent" [footerTemplate]="cardFooter" />
					<ng-template #cardTitle>
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
									<a href="#" class="text-default hover:text-default/90 font-semibold hover:underline">
										¿Olvidaste tu contraseña?
									</a>
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
							<button [fullWidth]="true" appButton size="md" type="submit">Iniciar sesión</button>
						</div>
					</ng-template>
				</div>
			</dialog>
		</div>
	`,
})
class LoginStoryComponent {
	private readonly translation = inject(Translation);

	readonly errorCode = input<ErrorCodeOption>(null);
	readonly language = input<Language>('es');

	private readonly model = signal<LoginForm>({ email: '', password: '' });
	readonly loginForm: FieldTree<LoginForm> = form(
		this.model,
		schema<LoginForm>((login) => {
			required(login.email);
			email(login.email);
			required(login.password);
			minLength(login.password, 8);
		}),
	);

	/**
	 * Tracks when translations are loaded and ready for use.
	 * This signal triggers re-computation of errorMessage when language changes.
	 */
	private readonly isReady = signal(false);

	readonly errorMessage = computed(() => {
		const code = this.errorCode();
		const ready = this.isReady();
		if (!code || !ready) return null;
		return this.translation.instant(`AUTH.ERRORS.${code}`);
	});

	constructor() {
		effect(() => {
			const lang = this.language();
			this.isReady.set(false);
			this.translation.setLanguage(lang).then(() => {
				this.isReady.set(true);
			});
		});
	}
}

const meta: Meta<LoginStoryComponent> = {
	component: LoginStoryComponent,
	title: 'Pages/Auth/Login',
	tags: ['autodocs'],
	decorators: [
		applicationConfig({
			providers: [Translation, ...provideSignalFormsConfig({})],
		}),
	],
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component: `
Login page component with error message handling for various authentication states.

## Features

- Email and password form fields with validation
- Error message display for authentication failures
- Account lockout message for security
- Responsive design with dark mode support
- **i18n Support**: Error messages are localized using the Translation service

## Error States

The login page handles several error conditions (using \`LoginErrorCode\`):
- **INVALID_CREDENTIALS**: Displayed when email/password combination is incorrect
- **ACCOUNT_LOCKED**: Displayed when too many failed login attempts occur
- **GENERIC**: Displayed for unexpected server errors

## Language Support

Use the **language** control to switch between:
- **es** (Spanish) - Default
- **en** (English)

Error messages will automatically update to the selected language.
				`,
			},
		},
	},
	argTypes: {
		errorCode: {
			control: 'select',
			options: [null, LoginErrorCode.INVALID_CREDENTIALS, LoginErrorCode.ACCOUNT_LOCKED, LoginErrorCode.GENERIC],
			description: 'Error code to display (uses Translation service for localized message)',
			table: {
				type: { summary: 'LoginErrorCode | null' },
				defaultValue: { summary: 'null' },
			},
			labels: {
				null: 'No Error',
				[LoginErrorCode.INVALID_CREDENTIALS]: 'Invalid Credentials',
				[LoginErrorCode.ACCOUNT_LOCKED]: 'Account Locked',
				[LoginErrorCode.GENERIC]: 'Generic Error',
			},
		},
		language: {
			control: 'select',
			options: ['es', 'en'],
			description: 'Language for error messages',
			table: {
				type: { summary: 'Language' },
				defaultValue: { summary: 'es' },
			},
			labels: {
				es: 'Español',
				en: 'English',
			},
		},
	},
};

export default meta;

type Story = StoryObj<LoginStoryComponent>;

/**
 * Default login page state with no error message.
 */
export const Default: Story = {
	args: {
		errorCode: null,
		language: 'es',
	},
};
