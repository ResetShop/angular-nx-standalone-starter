import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { Permission } from '@contracts/permission/legacy-permission.constants'
import { provideSliceTranslationMock } from '@mocks/slice-translation.mock'
import { createMockUser } from '@mocks/user.mock'
import { provideAuthMock } from '@providers/auth/auth.mock'
import { settingsEn } from '@providers/i18n/translations/slices/settings.translations'
import { provideIdentityMock } from '@providers/identity/identity.mock'
import { InMemoryOfficeBranchApi, provideOfficeBranchMock } from '@providers/office-branch/office-branch.mock'
import {
	advanceTimersByTimeAsync,
	clearAllMocks,
	spyOn,
	useFakeTimers,
	useRealTimers,
} from '@resetshop/util/test-utils'
import { AuthStore } from '@store/auth/auth.store'
import { OfficeBranchStore } from '@store/office-branch/office-branch.store'
import { UIStore } from '@store/ui/ui.store'
import { fireEvent, render, screen, within } from '@testing-library/angular'
import OfficeBranches from './office-branches'

describe('OfficeBranches', () => {
	let api: InMemoryOfficeBranchApi

	beforeEach(() => {
		useFakeTimers()
		clearAllMocks()
		spyOn(console, 'error')
		localStorage.clear()
		api = new InMemoryOfficeBranchApi()
		api.seed([
			{ id: 1, name: 'Centro', address: 'San Martin 100' },
			{ id: 2, name: 'Norte', address: 'Belgrano 200' },
		])
	})

	afterEach(() => {
		useRealTimers()
		localStorage.clear()
	})

	async function renderPage(permissions: readonly string[] = []) {
		const view = await render(OfficeBranches, {
			providers: [
				provideRouter([]),
				provideAuthMock(),
				provideIdentityMock(),
				provideOfficeBranchMock(api),
				provideSliceTranslationMock(settingsEn),
			],
		})
		TestBed.inject(AuthStore).updateCurrentUser(
			createMockUser({ hasPermission: (identifier: string) => permissions.includes(identifier) }),
		)
		TestBed.tick()
		await advanceTimersByTimeAsync(1000)
		view.fixture.detectChanges()
		return view
	}

	it('should list the branches with their address', async () => {
		await renderPage()

		expect(screen.getByRole('row', { name: /Centro/ })).toHaveTextContent('San Martin 100')
		expect(screen.getByRole('row', { name: /Norte/ })).toHaveTextContent('Belgrano 200')
	})

	it('should tell the user no branch is assigned yet', async () => {
		await renderPage()

		expect(screen.getByTestId('current-branch')).toHaveTextContent('No branch assigned')
	})

	it('should show the branch stored for this browser as assigned', async () => {
		localStorage.setItem('officeBranch.current', JSON.stringify({ id: 2, name: 'Norte', address: 'Belgrano 200' }))

		await renderPage()

		expect(screen.getByTestId('current-branch')).toHaveTextContent('Norte')
		expect(within(screen.getByRole('row', { name: /Norte/ })).getByText('Assigned')).toBeInTheDocument()
		expect(
			within(screen.getByRole('row', { name: /Centro/ })).getByRole('button', { name: 'Assign' }),
		).toBeInTheDocument()
	})

	it('should assign the chosen branch, persist it and announce it', async () => {
		const view = await renderPage()

		fireEvent.click(within(screen.getByRole('row', { name: /Centro/ })).getByRole('button', { name: 'Assign' }))
		view.fixture.detectChanges()

		expect(TestBed.inject(OfficeBranchStore).currentBranch()).toEqual({
			id: 1,
			name: 'Centro',
			address: 'San Martin 100',
		})
		expect(screen.getByTestId('current-branch')).toHaveTextContent('Centro')
		expect(within(screen.getByRole('row', { name: /Centro/ })).getByText('Assigned')).toBeInTheDocument()
		expect(JSON.parse(localStorage.getItem('officeBranch.current') ?? 'null')).toMatchObject({ id: 1 })
		expect(
			TestBed.inject(UIStore)
				.notifications()
				.map((item) => item.message),
		).toEqual(['Branch Centro assigned'])
	})

	it('should let a branch manager add branches', async () => {
		await renderPage([Permission.SETTINGS_OFFICE_BRANCHES_MANAGE])

		expect(screen.getByRole('link', { name: 'Add branch' })).toBeInTheDocument()
	})

	it('should hide the add button from users who cannot manage branches', async () => {
		await renderPage()

		expect(screen.queryByRole('link', { name: 'Add branch' })).not.toBeInTheDocument()
	})

	it('should show the error when the branches cannot be loaded', async () => {
		api.setError('getAll', new Error('boom'))

		await renderPage()

		expect(screen.getByRole('alert')).toHaveTextContent('Failed to load branches')
	})
})
