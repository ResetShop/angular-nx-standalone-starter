import type { Locator, Page } from '@playwright/test'

/** Page object for the public landing page (`/`). */
export class LandingPage {
	constructor(private readonly page: Page) {}

	get skipLink(): Locator {
		return this.page.getByRole('link', { name: 'Skip to main content' })
	}
	get heroHeading(): Locator {
		return this.page.getByRole('heading', { name: 'Angular + Nx SSR Starter', level: 1 })
	}
	get heroCta(): Locator {
		return this.page.getByRole('link', { name: 'Get started' })
	}
	get featuresHeading(): Locator {
		return this.page.getByRole('heading', { name: "What's included", level: 2 })
	}
	get themeToggle(): Locator {
		return this.page.getByRole('button', { name: /switch to (light|dark) mode/i })
	}
	get signInLink(): Locator {
		return this.page.getByRole('link', { name: 'Sign in' })
	}
	get dashboardLink(): Locator {
		return this.page.getByRole('link', { name: 'Go to dashboard' })
	}

	async goto(): Promise<void> {
		await this.page.goto('/')
	}
}
