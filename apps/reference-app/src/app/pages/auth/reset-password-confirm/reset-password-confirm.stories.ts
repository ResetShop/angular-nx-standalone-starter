import { provideHttpClient } from '@angular/common/http'
import { provideHttpClientTesting } from '@angular/common/http/testing'
import { Component, effect, input, signal } from '@angular/core'
import { provideSignalFormsConfig } from '@angular/forms/signals'
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router'
import { PublicAuthErrorCode } from '@contracts/auth/auth.errors'
import { AuthStore } from '@store/auth/auth.store'
import type { Meta, StoryObj } from '@storybook/angular'
import { applicationConfig } from '@storybook/angular'
import ResetPasswordConfirm from './reset-password-confirm'

type ErrorCodeOption = PublicAuthErrorCode | null

/** Shared signal driving the mock AuthStore's resetPasswordError state. */
const storyResetError = signal<{ code: string } | null>(null)

@Component({
	selector: 'app-reset-password-confirm-story',
	standalone: true,
	imports: [ResetPasswordConfirm],
	template: `
		<app-reset-password-confirm-page />
	`,
})
class ResetPasswordConfirmStoryComponent {
	public readonly errorCode = input<ErrorCodeOption>(null)

	private readonly syncErrorEffect = effect(() => {
		const code = this.errorCode()
		storyResetError.set(code ? { code } : null)
	})
}

const meta: Meta<ResetPasswordConfirmStoryComponent> = {
	component: ResetPasswordConfirmStoryComponent,
	title: 'Pages/Auth/Reset Password Confirm',
	tags: ['autodocs'],
	decorators: [
		applicationConfig({
			providers: [
				...provideSignalFormsConfig({}),
				provideRouter([]),
				provideHttpClient(),
				provideHttpClientTesting(),
				{
					provide: ActivatedRoute,
					useValue: { snapshot: { queryParamMap: convertToParamMap({ token: 'demo-token' }) } },
				},
				{
					provide: AuthStore,
					useFactory: () => ({
						isResettingPassword: signal(false),
						resetPasswordError: storyResetError,
						// eslint-disable-next-line @typescript-eslint/no-empty-function
						resetPassword: () => {},
						// eslint-disable-next-line @typescript-eslint/no-empty-function
						clearResetState: () => {},
					}),
				},
			],
		}),
	],
	parameters: {
		layout: 'fullscreen',
		viewport: { defaultViewport: 'mobile' },
		docs: {
			description: {
				component: `
Password-reset **confirm** page — reached from the emailed link (\`/auth/reset-password/confirm?token=…\`).
A new-password form (min 12 chars) that calls \`resetPassword\` and, on success, routes to login. A malformed
link with no token shows a "request a new one" message and disables submission.

## Error States

- **RESET_TOKEN_INVALID**: the token is invalid, expired, or already used
- **GENERIC**: unexpected server error
`,
			},
			canvas: {
				sourceState: 'shown',
			},
		},
	},
	argTypes: {
		errorCode: {
			control: 'select',
			options: [null, PublicAuthErrorCode.RESET_TOKEN_INVALID, PublicAuthErrorCode.GENERIC],
			description: 'Error code to display',
			table: { type: { summary: 'PublicAuthErrorCode | null' }, defaultValue: { summary: 'null' } },
			labels: {
				null: 'No Error',
				[PublicAuthErrorCode.RESET_TOKEN_INVALID]: 'Invalid / Expired Token',
				[PublicAuthErrorCode.GENERIC]: 'Generic Error',
			},
		},
	},
}

export default meta

type Story = StoryObj<ResetPasswordConfirmStoryComponent>

/** Default state with a valid token and no error. */
export const Default: Story = {
	args: {
		errorCode: null,
	},
}
