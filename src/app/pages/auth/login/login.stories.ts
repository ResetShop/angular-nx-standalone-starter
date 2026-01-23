import { NgOptimizedImage } from '@angular/common';
import { Component, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Button } from '@components/button/button';
import Card from '@components/card/card';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';

/**
 * Standalone presentational component for Storybook that mirrors the Login page UI.
 * This allows us to demonstrate different error states without needing Auth/Router services.
 */
@Component({
	selector: 'app-login-story',
	standalone: true,
	imports: [Card, Button, NgOptimizedImage, ReactiveFormsModule],
	template: `
		<div class="flex h-[600px] w-full items-center justify-center bg-black/95">
			<dialog open class="align-self-center flex justify-self-center bg-transparent">
				<div class="z-10 sm:h-[420px] sm:w-[420px]">
					<app-card [titleTemplate]="cardTitle" [contentTemplate]="cardContent" [footerTemplate]="cardFooter" />
					<ng-template #cardTitle>
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
										autocomplete="email"
										class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
									/>
								</div>
							</div>
							<div>
								<div class="flex items-center justify-between">
									<label for="password" class="block text-sm/6 font-medium text-gray-900">Contraseña</label>
									<div class="text-sm">
										<a href="#" class="text-primary hover:text-primary/90 font-semibold hover:underline">
											¿Olvidaste tu contraseña?
										</a>
									</div>
								</div>
								<div class="mt-2">
									<input
										id="password"
										type="password"
										autocomplete="current-password"
										class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
									/>
								</div>
							</div>
						</div>

						@if (errorMessage()) {
							<div
								class="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
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
	readonly errorMessage = input<string | null>(null);
}

const meta: Meta<LoginStoryComponent> = {
	component: LoginStoryComponent,
	title: 'Pages/Auth/Login',
	tags: ['autodocs'],
	decorators: [
		moduleMetadata({
			imports: [Card, Button, NgOptimizedImage, ReactiveFormsModule],
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

## Error States

The login page handles several error conditions:
- **Account Locked**: Displayed when too many failed login attempts occur
- **Invalid Credentials**: Displayed when email/password combination is incorrect
- **Generic Error**: Displayed for unexpected server errors
				`,
			},
		},
	},
	argTypes: {
		errorMessage: {
			control: 'text',
			description: 'Error message to display',
			table: {
				type: { summary: 'string | null' },
				defaultValue: { summary: 'null' },
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
		errorMessage: null,
	},
};

/**
 * Login page showing account lockout error.
 * This is displayed when a user has exceeded the maximum number of failed login attempts.
 */
export const AccountLocked: Story = {
	args: {
		errorMessage:
			'Tu cuenta ha sido bloqueada temporalmente debido a múltiples intentos fallidos. Por favor, intenta de nuevo más tarde.',
	},
};

/**
 * Login page showing invalid credentials error.
 * This is displayed when the email/password combination is incorrect.
 */
export const InvalidCredentials: Story = {
	args: {
		errorMessage: 'Email o contraseña incorrectos',
	},
};

/**
 * Login page showing a generic error.
 * This is displayed for unexpected server errors.
 */
export const GenericError: Story = {
	args: {
		errorMessage: 'Error al iniciar sesión. Por favor, intenta de nuevo.',
	},
};
