import { Component, input } from '@angular/core'
import { clearAllMocks } from '@test-utils'
import { render, screen } from '@testing-library/angular'
import { PageShell } from './page-shell'

@Component({
	selector: 'app-test-host',
	standalone: true,
	imports: [PageShell],
	template: `
		<app-page-shell [title]="title()" [loading]="loading()" [error]="error()">
			<p pageDescription>{{ description() }}</p>
			<div data-testid="page-content">Content here</div>
		</app-page-shell>
	`,
})
class TestHost {
	protected readonly title = input('Test Page')
	protected readonly description = input('A test description')
	protected readonly loading = input(false)
	protected readonly error = input<string | null>(null)
}

@Component({
	selector: 'app-test-host-no-description',
	standalone: true,
	imports: [PageShell],
	template: `
		<app-page-shell title="No Desc">
			<div data-testid="page-content">Content here</div>
		</app-page-shell>
	`,
})
class TestHostNoDescription {}

describe('PageShell', () => {
	beforeEach(() => {
		clearAllMocks()
	})

	it('should render the title', async () => {
		await render(TestHost)

		expect(screen.getByRole('heading', { level: 1, name: 'Test Page' })).toBeInTheDocument()
	})

	it('should project description content', async () => {
		await render(TestHost)

		expect(screen.getByText('A test description')).toBeInTheDocument()
	})

	it('should hide the description paragraph when no content is projected', async () => {
		await render(TestHostNoDescription)

		expect(screen.getByRole('heading', { level: 1, name: 'No Desc' })).toBeInTheDocument()
		expect(screen.getByTestId('page-content')).toBeInTheDocument()
	})

	it('should project default content when not loading and no error', async () => {
		await render(TestHost)

		expect(screen.getByTestId('page-content')).toBeInTheDocument()
	})

	it('should show spinner when loading', async () => {
		await render(TestHost, {
			componentInputs: { loading: true },
		})

		expect(screen.queryByTestId('page-content')).not.toBeInTheDocument()
	})

	it('should show error alert when error is set', async () => {
		await render(TestHost, {
			componentInputs: { error: 'Something went wrong' },
		})

		expect(screen.getByRole('alert')).toBeInTheDocument()
		expect(screen.getByText('Something went wrong')).toBeInTheDocument()
		expect(screen.queryByTestId('page-content')).not.toBeInTheDocument()
	})
})
