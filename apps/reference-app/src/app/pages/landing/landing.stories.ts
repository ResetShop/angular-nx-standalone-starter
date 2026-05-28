import { signal } from '@angular/core'
import { provideRouter } from '@angular/router'
import { provideTranslationMock } from '@providers/i18n/translation.mock'
import { provideMockTheme } from '@resetshop/angular-core/theme/theme.mock'
import { AuthStore } from '@store/auth/auth.store'
import type { Meta, StoryObj } from '@storybook/angular'
import { applicationConfig } from '@storybook/angular'
import LandingPage from './landing'

const provideAuthState = (isAuthenticated: boolean) => ({
	provide: AuthStore,
	useValue: { isAuthenticated: signal(isAuthenticated) },
})

const meta: Meta<LandingPage> = {
	component: LandingPage,
	title: 'Pages/Landing',
	tags: ['autodocs'],
	decorators: [
		applicationConfig({
			providers: [provideRouter([]), provideTranslationMock(), provideMockTheme(false)],
		}),
	],
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component: `
The public, server-side-rendered landing page mounted at \`/\`. It is fully accessible to both anonymous and authenticated visitors — no route guard is involved.

The page composes the \`LandingHeader\` (Login link + theme toggle) with a hero section and a three-up grid of feature highlights. The hero call-to-action and the header Login link both navigate to \`/auth/login\`.
				`,
			},
			canvas: {
				sourceState: 'shown',
			},
		},
	},
}

export default meta

type Story = StoryObj<LandingPage>

/**
 * Default landing page as seen by an anonymous visitor.
 */
export const Default: Story = {
	decorators: [applicationConfig({ providers: [provideAuthState(false)] })],
}

/**
 * Landing page for an authenticated visitor — the header surfaces a "Go to dashboard" link.
 */
export const AuthenticatedVisitor: Story = {
	decorators: [applicationConfig({ providers: [provideAuthState(true)] })],
}
