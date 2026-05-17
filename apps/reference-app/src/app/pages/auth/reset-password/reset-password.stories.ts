import { Component, effect, ErrorHandler, inject, input, signal } from '@angular/core'
import { provideSignalFormsConfig } from '@angular/forms/signals'
import { provideRouter } from '@angular/router'
import { Translation, type Language } from '@resetshop/angular-core/i18n/translation'
import type { Meta, StoryObj } from '@storybook/angular'
import { applicationConfig } from '@storybook/angular'
import ResetPassword from './reset-password'

@Component({
	selector: 'app-reset-password-story',
	standalone: true,
	imports: [ResetPassword],
	template: `
		@if (isReady()) {
			<app-reset-password-page />
		}
	`,
})
class ResetPasswordStoryComponent {
	private readonly errorHandler = inject(ErrorHandler)
	private readonly translation = inject(Translation)
	public readonly language = input<Language>('es')
	protected readonly isReady = signal(false)

	private readonly syncLanguageEffect = effect(() => {
		const lang = this.language()
		this.isReady.set(false)
		this.translation
			.setLanguage(lang)
			.then(() => this.isReady.set(true))
			.catch((error: unknown) => this.errorHandler.handleError(error))
	})
}

const meta: Meta<ResetPasswordStoryComponent> = {
	component: ResetPasswordStoryComponent,
	title: 'Pages/Auth/Reset Password',
	tags: ['autodocs'],
	decorators: [
		applicationConfig({
			providers: [Translation, ...provideSignalFormsConfig({}), provideRouter([])],
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

## Language Support

Use the **language** control to switch between Spanish and English; validation messages localize via the Translation service.
`,
			},
			canvas: {
				sourceState: 'shown',
			},
		},
	},
	argTypes: {
		language: {
			control: 'select',
			options: ['es', 'en'],
			description: 'Language for validation messages',
			table: { type: { summary: 'Language' }, defaultValue: { summary: 'es' } },
			labels: { es: 'Español', en: 'English' },
		},
	},
}

export default meta

type Story = StoryObj<ResetPasswordStoryComponent>

export const Default: Story = { args: { language: 'es' } }
