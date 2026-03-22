import { provideRouter } from '@angular/router'
import { provideIcons } from '@ng-icons/core'
import { featherHome } from '@ng-icons/feather-icons'
import { clearAllMocks } from '@test-utils'
import { render, screen } from '@testing-library/angular'
import NavigationCard from './navigation-card'

describe('NavigationCard', () => {
	beforeEach(() => {
		clearAllMocks()
	})

	const baseInputs = {
		route: '/test',
		name: 'Test Route',
		description: 'A test description',
	}

	it('should render the card name', async () => {
		await render(NavigationCard, {
			inputs: baseInputs,
			providers: [provideRouter([])],
		})

		expect(screen.getByText('Test Route')).toBeInTheDocument()
	})

	it('should render the card description', async () => {
		await render(NavigationCard, {
			inputs: baseInputs,
			providers: [provideRouter([])],
		})

		expect(screen.getByText('A test description')).toBeInTheDocument()
	})

	it('should render as a link pointing to the given route', async () => {
		await render(NavigationCard, {
			inputs: baseInputs,
			providers: [provideRouter([])],
		})

		const link = screen.getByRole('link')
		expect(link).toHaveAttribute('href', '/test')
	})

	it('should render the chevron indicator', async () => {
		await render(NavigationCard, {
			inputs: baseInputs,
			providers: [provideRouter([])],
		})

		expect(screen.getByTestId('chevron-icon')).toBeInTheDocument()
	})

	it('should render the icon when icons input is provided', async () => {
		await render(NavigationCard, {
			inputs: { ...baseInputs, icons: { featherHome } },
			providers: [provideRouter([]), provideIcons({ featherHome })],
		})

		expect(screen.getByTestId('card-icon')).toBeInTheDocument()
	})

	it('should not render the icon when icons input is omitted', async () => {
		await render(NavigationCard, {
			inputs: baseInputs,
			providers: [provideRouter([])],
		})

		expect(screen.queryByTestId('card-icon')).not.toBeInTheDocument()
	})
})
