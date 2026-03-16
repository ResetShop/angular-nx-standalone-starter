import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { Component, computed, effect, inject, input, signal, viewChild } from '@angular/core'
import { provideSignalFormsConfig } from '@angular/forms/signals'
import { provideRouter } from '@angular/router'
import { LoginErrorCode } from '@contracts/auth/auth.errors'
import { Translation, type Language } from '@providers/i18n/translation'
import type { Meta, StoryObj } from '@storybook/angular'
import { applicationConfig } from '@storybook/angular'
import Login from './login'

/**
 * Error code options for the story.
 * null represents no error state.
 */
type ErrorCodeOption = LoginErrorCode | null

/**
 * Thin wrapper that renders the actual Login page component and
 * drives its error state via the errorMessage signal, avoiding template/form duplication.
 */
@Component({
	selector: 'app-login-story',
	standalone: true,
	imports: [Login],
	template: `
		<app-login-page />
	`,
})
class LoginStoryComponent {
	private readonly translation = inject(Translation)
	private readonly loginPage = viewChild(Login)

	public readonly errorCode = input<ErrorCodeOption>(null)
	public readonly language = input<Language>('es')

	private readonly isReady = signal(false)

	protected readonly resolvedError = computed(() => {
		const code = this.errorCode()
		if (!code || !this.isReady()) return null
		return this.translation.instant(`AUTH.ERRORS.${code}`)
	})

	constructor() {
		effect(() => {
			const message = this.resolvedError()
			this.loginPage()?.errorMessage.set(message)
		})

		effect(() => {
			const lang = this.language()
			this.isReady.set(false)
			this.translation.setLanguage(lang).then(() => this.isReady.set(true))
		})
	}
}

const meta: Meta<LoginStoryComponent> = {
	component: LoginStoryComponent,
	title: 'Pages/Auth/Login',
	tags: ['autodocs'],
	decorators: [
		applicationConfig({
			providers: [
				Translation,
				...provideSignalFormsConfig({}),
				provideRouter([]),
				provideHttpClient(),
				provideHttpClientTesting(),
			],
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
}

export default meta

type Story = StoryObj<LoginStoryComponent>

/**
 * Default login page state with no error message.
 */
export const Default: Story = {
	args: {
		errorCode: null,
		language: 'es',
	},
}
