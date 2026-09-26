import { createMockUser } from '@mocks/user.mock'
import { AuthApi } from '@providers/auth/auth.interface'
import { InMemoryAuthApi } from '@providers/auth/auth.mock'
import { provideTranslationMock } from '@providers/i18n/translation.mock'
import { advanceTimersByTimeAsync, clearAllMocks, useFakeTimers, useRealTimers } from '@resetshop/util/test-utils'
import { AuthStore } from '@store/auth/auth.store'
import { render, screen, within } from '@testing-library/angular'
import Account from './account'

describe('Account', () => {
	const user = createMockUser({ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' })

	async function renderAccount() {
		const view = await render(Account, {
			providers: [provideTranslationMock(), AuthStore, { provide: AuthApi, useValue: new InMemoryAuthApi() }],
		})
		view.fixture.debugElement.injector.get(AuthStore).updateCurrentUser(user)
		await advanceTimersByTimeAsync(1000)
		view.fixture.detectChanges()
		return view
	}

	beforeEach(() => {
		clearAllMocks()
		useFakeTimers()
	})

	afterEach(() => {
		useRealTimers()
	})

	it('renders the page title', async () => {
		await renderAccount()

		expect(screen.getByRole('heading', { level: 1, name: 'Account' })).toBeInTheDocument()
	})

	it("shows the signed-in user's name and email", async () => {
		await renderAccount()
		const profile = screen.getByRole('region', { name: 'Profile' })

		expect(within(profile).getByText('First Name')).toBeInTheDocument()
		expect(within(profile).getByText('Ada')).toBeInTheDocument()
		expect(within(profile).getByText('Last Name')).toBeInTheDocument()
		expect(within(profile).getByText('Lovelace')).toBeInTheDocument()
		expect(within(profile).getByText('Email')).toBeInTheDocument()
		expect(within(profile).getByText('ada@example.com')).toBeInTheDocument()
	})

	it('is read-only', async () => {
		await renderAccount()
		expect(screen.getByText('ada@example.com')).toBeInTheDocument()

		expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
		expect(screen.queryByRole('button')).not.toBeInTheDocument()
	})

	it('reflects a profile change made through the store', async () => {
		const { fixture } = await renderAccount()
		fixture.debugElement.injector.get(AuthStore).updateCurrentUser({ ...user, firstName: 'Grace' })
		fixture.detectChanges()

		expect(screen.getByText('Grace')).toBeInTheDocument()
		expect(screen.queryByText('Ada')).not.toBeInTheDocument()
	})
})
