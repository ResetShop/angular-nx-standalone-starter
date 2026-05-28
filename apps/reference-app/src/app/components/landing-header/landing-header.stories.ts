import { provideRouter } from '@angular/router'
import { provideTranslationMock } from '@providers/i18n/translation.mock'
import { provideMockTheme } from '@resetshop/angular-core/theme/theme.mock'
import { provideAuthStateMock } from '@store/auth/auth.store.mock'
import type { Meta, StoryObj } from '@storybook/angular'
import { applicationConfig } from '@storybook/angular'
import { LandingHeader } from './landing-header'

const meta: Meta<LandingHeader> = {
	component: LandingHeader,
	title: 'Components/LandingHeader',
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
The public landing-page header. It displays a brand wordmark linking back to the landing page, a theme toggle, and a **Login** link that navigates to \`/auth/login\`.

Unlike the dashboard \`Header\` (which is an \`[appHeader]\` attribute directive coupled to \`UIStore\` and the breadcrumb \`Navigation\`), this header is a self-contained component with no sidebar, no breadcrumbs, and no dashboard dependencies — it is safe to render on a fully public, server-side-rendered route.

When the visitor is authenticated, an additional **Go to dashboard** link is shown alongside the Login link.
				`,
			},
			canvas: {
				sourceState: 'shown',
			},
		},
	},
}

export default meta

type Story = StoryObj<LandingHeader>

/**
 * Default state for an anonymous visitor — only the theme toggle and Login link are shown.
 */
export const Unauthenticated: Story = {
	decorators: [applicationConfig({ providers: [provideAuthStateMock(false)] })],
}

/**
 * Authenticated visitor — an additional "Go to dashboard" link appears next to Login.
 */
export const Authenticated: Story = {
	decorators: [applicationConfig({ providers: [provideAuthStateMock(true)] })],
}
