import { Component, effect, input, signal } from '@angular/core'
import { provideSignalFormsConfig } from '@angular/forms/signals'
import { provideRouter } from '@angular/router'
import { AuthStore } from '@store/auth/auth.store'
import type { Meta, StoryObj } from '@storybook/angular'
import { applicationConfig } from '@storybook/angular'
import ResetPassword from './reset-password'

/** Shared signal driving the mock AuthStore's `resetRequested` state (form vs. confirmation). */
const storyResetRequested = signal(false)

@Component({
	selector: 'app-reset-password-story',
	standalone: true,
	imports: [ResetPassword],
	template: `
		<app-reset-password-page />
	`,
})
class ResetPasswordStoryComponent {
	public readonly requested = input<boolean>(false)

	private readonly syncEffect = effect(() => storyResetRequested.set(this.requested()))
}

const meta: Meta<ResetPasswordStoryComponent> = {
	component: ResetPasswordStoryComponent,
	title: 'Pages/Auth/Reset Password',
	tags: ['autodocs'],
	decorators: [
		applicationConfig({
			providers: [
				...provideSignalFormsConfig({}),
				provideRouter([]),
				{
					provide: AuthStore,
					useFactory: () => ({
						resetRequested: storyResetRequested,
						// eslint-disable-next-line @typescript-eslint/no-empty-function
						forgotPassword: () => {},
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
Password-reset **request** page. Email-only form that calls \`forgotPassword\`; on completion it shows a
neutral "if an account exists, a link was sent" confirmation (no user enumeration), regardless of whether
the email is registered.

Below the \`sm:\` breakpoint the page renders as a full-screen takeover (via \`<app-immersive-panel>\`); from
\`sm:\` up the form sits as a card centred on a dark backdrop.
`,
			},
			canvas: {
				sourceState: 'shown',
			},
		},
	},
	argTypes: {
		requested: {
			control: 'boolean',
			description: 'Show the post-submit confirmation state instead of the form',
			table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
		},
	},
}

export default meta

type Story = StoryObj<ResetPasswordStoryComponent>

/** The request form (default state). */
export const Default: Story = {
	args: { requested: false },
}

/** The neutral confirmation shown after a request is submitted. */
export const Confirmation: Story = {
	args: { requested: true },
}
