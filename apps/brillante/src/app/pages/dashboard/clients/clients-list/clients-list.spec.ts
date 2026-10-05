import { TestBed } from '@angular/core/testing'
import { Permission } from '@contracts/permission/legacy-permission.constants'
import { customerTranslation } from '@domain/customer/customer-translation.mock'
import { createMockCustomerDto } from '@domain/customer/customer.mock'
import { createMockUser } from '@mocks/user.mock'
import { provideAuthMock } from '@providers/auth/auth.mock'
import { CustomerApi } from '@providers/customer/customer.interface'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import {
	advanceTimersByTimeAsync,
	clearAllMocks,
	fn,
	type MockFn,
	spyOn,
	useFakeTimers,
	useRealTimers,
} from '@resetshop/util/test-utils'
import { AuthStore } from '@store/auth/auth.store'
import { fireEvent, render, screen, within } from '@testing-library/angular'
import { NEVER, of, throwError } from 'rxjs'
import ClientsList from './clients-list'

describe('ClientsList', () => {
	let apiMock: Record<keyof CustomerApi, MockFn>

	const ana = createMockCustomerDto({ id: 1, dni: 30123456, firstName: 'Ana', lastName: 'Perez' })
	const luis = createMockCustomerDto({
		id: 2,
		dni: 27111222,
		firstName: 'Luis',
		lastName: 'Gomez',
		email: 'luis@brillante.test',
		birthDate: null,
	})

	beforeEach(() => {
		clearAllMocks()
		useFakeTimers()
		spyOn(console, 'error')
		apiMock = {
			getAll: fn(),
			getById: fn(),
			getByEmail: fn(),
			getByDni: fn(),
			create: fn(),
			update: fn(),
		}
		apiMock.getAll.mockReturnValue(of({ count: 2, rows: [ana, luis] }))
	})

	afterEach(() => {
		useRealTimers()
		screen.queryAllByTestId('row-actions-menu').forEach((element) => element.remove())
	})

	async function renderList({ canManage = true }: { canManage?: boolean } = {}) {
		const view = await render(ClientsList, {
			providers: [
				provideAuthMock(),
				{ provide: CustomerApi, useValue: apiMock },
				{ provide: Translation, useValue: customerTranslation },
			],
		})
		TestBed.inject(AuthStore).updateCurrentUser(
			createMockUser({ hasPermission: (permission) => canManage && permission === Permission.CLIENTS_MANAGE }),
		)
		TestBed.tick()
		await advanceTimersByTimeAsync(1000)
		view.fixture.detectChanges()
		return view
	}

	async function openRowActions(view: Awaited<ReturnType<typeof renderList>>, rowName: string): Promise<void> {
		const row = screen.getByRole('row', { name: new RegExp(rowName) })
		fireEvent.click(within(row).getByRole('button', { name: 'Actions' }))
		TestBed.tick()
		await advanceTimersByTimeAsync(50)
		view.fixture.detectChanges()
	}

	it('shows the loading skeleton while the first page loads', async () => {
		apiMock.getAll.mockReturnValue(NEVER)

		await render(ClientsList, {
			providers: [
				provideAuthMock(),
				{ provide: CustomerApi, useValue: apiMock },
				{ provide: Translation, useValue: customerTranslation },
			],
		})
		TestBed.tick()

		expect(screen.getByTestId('clients-actions-skeleton')).toBeInTheDocument()
		expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
	})

	it('lists the customers with their formatted details', async () => {
		await renderList()

		expect(screen.getByRole('heading', { name: 'Clients' })).toBeInTheDocument()
		expect(screen.getByRole('cell', { name: 'Ana Perez' })).toBeInTheDocument()
		expect(screen.getByRole('cell', { name: '30123456' })).toBeInTheDocument()
		expect(screen.getByRole('cell', { name: 'luis@brillante.test' })).toBeInTheDocument()
		expect(screen.getByRole('cell', { name: '20/05/1990' })).toBeInTheDocument()
	})

	it('shows a placeholder for customers without a birth date', async () => {
		await renderList()

		expect(screen.getByRole('cell', { name: 'Not registered' })).toBeInTheDocument()
	})

	it('requests the first page from the API', async () => {
		await renderList()

		expect(apiMock.getAll.calls[0]).toEqual([0, 10])
	})

	it('shows the empty state when there are no customers', async () => {
		apiMock.getAll.mockReturnValue(of({ count: 0, rows: [] }))

		await renderList()

		expect(screen.getByText('No data available')).toBeInTheDocument()
	})

	it('shows the error state when the list cannot be loaded', async () => {
		apiMock.getAll.mockReturnValue(throwError(() => new Error('boom')))

		await renderList()

		expect(screen.getByRole('alert')).toHaveTextContent('Failed to load customers')
	})

	describe('search', () => {
		it('looks a typed DNI up after the debounce', async () => {
			apiMock.getByDni.mockReturnValue(of(ana))
			const view = await renderList()

			fireEvent.input(screen.getByRole('searchbox', { name: 'Search clients' }), { target: { value: '30123456' } })
			await advanceTimersByTimeAsync(300)
			TestBed.tick()
			await advanceTimersByTimeAsync(1000)
			view.fixture.detectChanges()

			expect(apiMock.getByDni.calls).toEqual([[30123456]])
			expect(screen.getByRole('cell', { name: 'Ana Perez' })).toBeInTheDocument()
			expect(screen.queryByRole('cell', { name: 'Luis Gomez' })).not.toBeInTheDocument()
		})

		it('keeps the search box mounted and filled while results reload', async () => {
			apiMock.getByDni.mockReturnValue(NEVER)
			const view = await renderList()
			const search = screen.getByRole('searchbox', { name: 'Search clients' })

			fireEvent.input(search, { target: { value: '30123456' } })
			await advanceTimersByTimeAsync(300)
			TestBed.tick()
			view.fixture.detectChanges()

			expect(screen.getByRole('searchbox', { name: 'Search clients' })).toBe(search)
			expect(search).toHaveValue('30123456')
		})

		it('explains what can be searched', async () => {
			await renderList()

			expect(screen.getByText('Type a full DNI (digits only) or a full email address.')).toBeInTheDocument()
		})
	})

	describe('pagination', () => {
		it('hides the pagination when everything fits on one page', async () => {
			await renderList()

			expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument()
		})

		it('requests the next page from the server', async () => {
			apiMock.getAll.mockReturnValue(of({ count: 25, rows: [ana] }))
			const view = await renderList()

			fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
			TestBed.tick()
			await advanceTimersByTimeAsync(1000)
			view.fixture.detectChanges()

			expect(apiMock.getAll.calls.at(-1)).toEqual([10, 10])
			expect(screen.getByText('Page 2 of 3')).toBeInTheDocument()
		})
	})

	describe('permissions', () => {
		it('offers creating and editing clients to users who can manage them', async () => {
			await renderList({ canManage: true })

			expect(screen.getByRole('button', { name: 'New client' })).toBeInTheDocument()
			expect(screen.getAllByRole('button', { name: 'Actions' })).toHaveLength(2)
		})

		it('hides every write action from read-only users', async () => {
			await renderList({ canManage: false })

			expect(screen.queryByRole('button', { name: 'New client' })).not.toBeInTheDocument()
			expect(screen.queryByRole('button', { name: 'Actions' })).not.toBeInTheDocument()
			expect(screen.getByRole('cell', { name: 'Ana Perez' })).toBeInTheDocument()
		})
	})

	describe('drawers', () => {
		it('opens the create drawer', async () => {
			const view = await renderList()

			fireEvent.click(screen.getByRole('button', { name: 'New client' }))
			TestBed.tick()
			await advanceTimersByTimeAsync(1000)
			view.fixture.detectChanges()

			expect(await screen.findByRole('heading', { name: 'New client' })).toBeInTheDocument()
			expect(screen.getByLabelText(/dni/i)).toHaveValue('')
		})

		it('opens the edit drawer prefilled with the selected customer', async () => {
			const view = await renderList()

			await openRowActions(view, 'Luis Gomez')
			fireEvent.click(await screen.findByRole('menuitem', { name: 'Edit' }))
			TestBed.tick()
			await advanceTimersByTimeAsync(1000)
			view.fixture.detectChanges()

			expect(await screen.findByRole('heading', { name: 'Edit client' })).toBeInTheDocument()
			expect(screen.getByLabelText(/dni/i)).toHaveValue('27111222')
			expect(screen.getByLabelText(/first name/i)).toHaveValue('Luis')
		})
	})
})
