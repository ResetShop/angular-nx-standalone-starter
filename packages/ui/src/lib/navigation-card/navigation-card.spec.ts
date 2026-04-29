import { provideRouter } from '@angular/router'
import { featherHome } from '@ng-icons/feather-icons'
import { clearAllMocks } from '@resetshop/util/test-utils'
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

	async function renderCard(overrides?: { inputs?: Record<string, unknown>; providers?: unknown[] }) {
		return render(NavigationCard, {
			inputs: overrides?.inputs ?? baseInputs,
			providers: (overrides?.providers ?? [provideRouter([])]) as never[],
		})
	}

	it('should render the card name', async () => {
		await renderCard()
		expect(screen.getByText('Test Route')).toBeInTheDocument()
	})

	it('should render the card description', async () => {
		await renderCard()
		expect(screen.getByText('A test description')).toBeInTheDocument()
	})

	it('should render as a link pointing to the given route', async () => {
		await renderCard()
		const link = screen.getByRole('link')
		expect(link).toHaveAttribute('href', '/test')
	})

	it('should render the chevron indicator', async () => {
		await renderCard()
		expect(screen.getByTestId('chevron-icon')).toBeInTheDocument()
	})

	it('should render the icon when icon input is provided', async () => {
		await renderCard({
			inputs: { ...baseInputs, icon: { featherHome } },
		})
		expect(screen.getByTestId('card-icon')).toBeInTheDocument()
	})

	it('should not render the icon when icon input is omitted', async () => {
		await renderCard()
		expect(screen.queryByTestId('card-icon')).not.toBeInTheDocument()
	})
})
