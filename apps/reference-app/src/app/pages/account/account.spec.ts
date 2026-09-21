import { TestBed } from '@angular/core/testing'
import { provideSignalFormsConfig } from '@angular/forms/signals'
import { createMockUser } from '@mocks/user.mock'
import { AuthApi } from '@providers/auth/auth.interface'
import { InMemoryAuthApi } from '@providers/auth/auth.mock'
import { provideTranslationMock } from '@providers/i18n/translation.mock'
import { advanceTimersByTimeAsync, clearAllMocks, useFakeTimers, useRealTimers } from '@resetshop/util/test-utils'
import { AuthStore } from '@store/auth/auth.store'
import { fireEvent, render, screen, within } from '@testing-library/angular'
import Account from './account'

describe('Account', () => {
	const user = createMockUser({ firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' })

	async function renderAccount() {
		const view = await render(Account, {
			providers: [
				provideTranslationMock(),
				AuthStore,
				{ provide: AuthApi, useValue: new InMemoryAuthApi() },
				...provideSignalFormsConfig({}),
			],
		})
		TestBed.inject(AuthStore).updateCurrentUser(user)
		await advanceTimersByTimeAsync(1000)
		view.fixture.detectChanges()
		return view
	}

	function typeInto(name: RegExp, value: string) {
		fireEvent.input(screen.getByRole('textbox', { name }), { target: { value } })
		TestBed.tick()
	}

	function reviewButton() {
		return screen.getByRole('button', { name: 'Review changes' })
	}

	function reviewChanges() {
		fireEvent.click(reviewButton())
		TestBed.tick()
		return screen.getByRole('alertdialog', { name: 'Confirm changes' })
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

	it("pre-fills the name fields from the signed-in user's profile", async () => {
		await renderAccount()

		expect(screen.getByRole('textbox', { name: /first name/i })).toHaveValue('Ada')
		expect(screen.getByRole('textbox', { name: /last name/i })).toHaveValue('Lovelace')
	})

	it('shows the email as static text, not as an editable field', async () => {
		await renderAccount()
		const profile = screen.getByRole('region', { name: 'Profile' })

		expect(within(profile).getByText('Email')).toBeInTheDocument()
		expect(within(profile).getByText('ada@example.com')).toBeInTheDocument()
		expect(screen.getAllByRole('textbox')).toHaveLength(2)
		expect(screen.queryByRole('textbox', { name: /email/i })).not.toBeInTheDocument()
	})

	it('keeps the review button disabled while nothing changed', async () => {
		await renderAccount()

		expect(reviewButton()).toBeDisabled()
	})

	it('keeps the review button disabled when a change only adds surrounding whitespace', async () => {
		await renderAccount()
		typeInto(/first name/i, '  Ada ')

		expect(reviewButton()).toBeDisabled()
	})

	it.each([
		['empty', ''],
		['whitespace-only', '   '],
	])('keeps the review button disabled when a name is %s', async (_, value) => {
		await renderAccount()
		typeInto(/last name/i, value)

		expect(reviewButton()).toBeDisabled()
	})

	it('keeps the review button disabled when a name is too long', async () => {
		await renderAccount()
		typeInto(/first name/i, 'A'.repeat(101))

		expect(reviewButton()).toBeDisabled()
	})

	it('lists every changed field as a before → after row in the confirmation dialog', async () => {
		await renderAccount()
		typeInto(/first name/i, 'Grace')
		typeInto(/last name/i, 'Hopper')

		const rows = within(reviewChanges()).getAllByRole('definition')

		expect(rows).toHaveLength(2)
		expect(rows[0]).toHaveTextContent('Before: Ada')
		expect(rows[0]).toHaveTextContent('After: Grace')
		expect(rows[1]).toHaveTextContent('Before: Lovelace')
		expect(rows[1]).toHaveTextContent('After: Hopper')
	})

	it('asks for confirmation even for a single-field change', async () => {
		await renderAccount()
		typeInto(/last name/i, 'Hopper')

		const dialog = reviewChanges()

		expect(within(dialog).getByRole('term')).toHaveTextContent('Last Name')
		expect(within(dialog).getByRole('definition')).toHaveTextContent('After: Hopper')
	})
})
