import { Component } from '@angular/core'
import { provideSignalFormsConfig } from '@angular/forms/signals'
import { provideRouter } from '@angular/router'
import type { Meta, StoryObj } from '@storybook/angular'
import { applicationConfig } from '@storybook/angular'
import ResetPassword from './reset-password'

@Component({
	selector: 'app-reset-password-story',
	standalone: true,
	imports: [ResetPassword],
	template: `
		<app-reset-password-page />
	`,
})
class ResetPasswordStoryComponent {}

const meta: Meta<ResetPasswordStoryComponent> = {
	component: ResetPasswordStoryComponent,
	title: 'Pages/Auth/Reset Password',
	tags: ['autodocs'],
	decorators: [
		applicationConfig({
			providers: [...provideSignalFormsConfig({}), provideRouter([])],
		}),
	],
	parameters: {
		layout: 'fullscreen',
		viewport: { defaultViewport: 'mobile' },
		docs: {
			description: {
				component: `
Password reset request page. Email-only form with validation and a back-to-login link.

Below the \`sm:\` breakpoint the page renders as a full-screen takeover (via \`<app-immersive-panel>\`) with no card chrome and no surrounding backdrop. From \`sm:\` up the form sits as a 420 × 420 card centred on a dark backdrop.
`,
			},
			canvas: {
				sourceState: 'shown',
			},
		},
	},
}

export default meta

type Story = StoryObj<ResetPasswordStoryComponent>

export const Default: Story = { args: {} }
