import { clearAllMocks } from '@test-utils'
import { render, screen } from '@testing-library/angular'
import { AppLoadingShell } from './app-loading-shell'

describe('AppLoadingShell', () => {
	beforeEach(() => {
		clearAllMocks()
	})

	it('should render projected content when not loading', async () => {
		await render(`<app-loading-shell [loading]="false"><p>Page content</p></app-loading-shell>`, {
			imports: [AppLoadingShell],
		})

		expect(screen.getByText('Page content')).toBeInTheDocument()
		expect(screen.queryByRole('status')).not.toBeInTheDocument()
	})

	it('should show loading overlay when loading is true', async () => {
		await render(`<app-loading-shell [loading]="true"><p>Page content</p></app-loading-shell>`, {
			imports: [AppLoadingShell],
		})

		expect(screen.getByRole('status')).toBeInTheDocument()
	})

	it('should still render projected content when loading', async () => {
		await render(`<app-loading-shell [loading]="true"><p>Page content</p></app-loading-shell>`, {
			imports: [AppLoadingShell],
		})

		expect(screen.getByText('Page content')).toBeInTheDocument()
		expect(screen.getByRole('status')).toBeInTheDocument()
	})

	it('should remove loading overlay when loading changes to false', async () => {
		const { fixture } = await render(
			`<app-loading-shell [loading]="isLoading"><p>Page content</p></app-loading-shell>`,
			{
				imports: [AppLoadingShell],
				componentProperties: { isLoading: true },
			},
		)

		expect(screen.getByRole('status')).toBeInTheDocument()

		fixture.componentInstance.isLoading = false
		fixture.detectChanges()

		expect(screen.queryByRole('status')).not.toBeInTheDocument()
		expect(screen.getByText('Page content')).toBeInTheDocument()
	})
})
