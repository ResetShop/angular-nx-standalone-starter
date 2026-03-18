import { Component, input } from '@angular/core'
import { advanceTimersByTimeAsync, clearAllMocks, useFakeTimers, useRealTimers } from '@test-utils'
import { render, screen } from '@testing-library/angular'
import { parseDurationToMs } from '@utils/duration'
import { PAGE_SHELL_MIN_DISPLAY, PageShell } from './page-shell'

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
	public readonly title = input('Test Page')
	public readonly description = input('A test description')
	public readonly loading = input(false)
	public readonly error = input<string | null>(null)
}

@Component({
	selector: 'app-test-host-no-description',
	standalone: true,
	imports: [PageShell],
	template: `
		<app-page-shell [loading]="false" title="No Desc">
			<div data-testid="page-content">Content here</div>
		</app-page-shell>
	`,
})
class TestHostNoDescription {}

@Component({
	selector: 'app-test-host-with-actions',
	standalone: true,
	imports: [PageShell],
	template: `
		<app-page-shell [loading]="false" title="With Actions">
			<div pageActions data-testid="page-actions">Search and buttons here</div>
			<div data-testid="page-content">Content here</div>
		</app-page-shell>
	`,
})
class TestHostWithActions {}

describe('PageShell', () => {
	beforeEach(() => {
		clearAllMocks()
		useFakeTimers()
	})

	afterEach(() => {
		useRealTimers()
	})

	it('should render the title', async () => {
		await render(TestHost)
		await advanceTimersByTimeAsync(parseDurationToMs(PAGE_SHELL_MIN_DISPLAY))

		expect(screen.getByRole('heading', { level: 1, name: 'Test Page' })).toBeInTheDocument()
	})

	it('should project description content', async () => {
		await render(TestHost)
		await advanceTimersByTimeAsync(parseDurationToMs(PAGE_SHELL_MIN_DISPLAY))

		expect(screen.getByText('A test description')).toBeInTheDocument()
	})

	it('should hide the description paragraph when no content is projected', async () => {
		const { fixture } = await render(TestHostNoDescription)
		await advanceTimersByTimeAsync(parseDurationToMs(PAGE_SHELL_MIN_DISPLAY))
		fixture.detectChanges()

		expect(screen.getByRole('heading', { level: 1, name: 'No Desc' })).toBeInTheDocument()
		expect(screen.getByTestId('page-content')).toBeInTheDocument()
	})

	it('should project actions content above the main content area', async () => {
		const { fixture } = await render(TestHostWithActions)
		await advanceTimersByTimeAsync(parseDurationToMs(PAGE_SHELL_MIN_DISPLAY))
		fixture.detectChanges()

		expect(screen.getByTestId('page-actions')).toBeInTheDocument()
		expect(screen.getByText('Search and buttons here')).toBeInTheDocument()
		expect(screen.getByTestId('page-content')).toBeInTheDocument()
	})

	it('should show loading state with spinner and text by default', async () => {
		await render(TestHost)

		expect(screen.getByRole('status')).toBeInTheDocument()
		expect(screen.getByText('Cargando...')).toBeInTheDocument()
		expect(screen.queryByTestId('page-content')).not.toBeInTheDocument()
	})

	it('should show loading for at least 500ms even when loading input is false', async () => {
		const { fixture } = await render(TestHost, {
			componentInputs: { loading: false },
		})

		expect(screen.getByRole('status')).toBeInTheDocument()
		expect(screen.queryByTestId('page-content')).not.toBeInTheDocument()

		await advanceTimersByTimeAsync(parseDurationToMs(PAGE_SHELL_MIN_DISPLAY))
		fixture.detectChanges()

		expect(screen.queryByRole('status')).not.toBeInTheDocument()
		expect(screen.getByTestId('page-content')).toBeInTheDocument()
	})

	it('should keep loading visible when minimum elapsed but loading input is still true', async () => {
		await render(TestHost, {
			componentInputs: { loading: true },
		})

		await advanceTimersByTimeAsync(parseDurationToMs(PAGE_SHELL_MIN_DISPLAY))

		expect(screen.getByRole('status')).toBeInTheDocument()
		expect(screen.queryByTestId('page-content')).not.toBeInTheDocument()
	})

	it('should project content after minimum elapsed and loading is false', async () => {
		const { fixture } = await render(TestHost)

		await advanceTimersByTimeAsync(parseDurationToMs(PAGE_SHELL_MIN_DISPLAY))

		fixture.componentRef.setInput('loading', false)
		fixture.detectChanges()

		expect(screen.queryByRole('status')).not.toBeInTheDocument()
		expect(screen.getByTestId('page-content')).toBeInTheDocument()
	})

	it('should show spinner when loading is explicitly true', async () => {
		await render(TestHost, {
			componentInputs: { loading: true },
		})
		await advanceTimersByTimeAsync(parseDurationToMs(PAGE_SHELL_MIN_DISPLAY))

		expect(screen.getByRole('status')).toBeInTheDocument()
		expect(screen.queryByTestId('page-content')).not.toBeInTheDocument()
	})

	it('should show error alert when error is set', async () => {
		const { fixture } = await render(TestHost, {
			componentInputs: { error: 'Something went wrong', loading: false },
		})
		await advanceTimersByTimeAsync(parseDurationToMs(PAGE_SHELL_MIN_DISPLAY))
		fixture.detectChanges()

		expect(screen.getByRole('alert')).toBeInTheDocument()
		expect(screen.getByText('Something went wrong')).toBeInTheDocument()
		expect(screen.queryByTestId('page-content')).not.toBeInTheDocument()
	})
})
