import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { provideRouter, Router } from '@angular/router'
import { Permission } from '@contracts/permission/legacy-permission.constants'
import { RepairStatusId } from '@contracts/repair/repair-status.constants'
import { createMockUser } from '@mocks/user.mock'
import { provideAuthMock } from '@providers/auth/auth.mock'
import { CustomerApi } from '@providers/customer/customer.interface'
import { provideIdentityMock } from '@providers/identity/identity.mock'
import { PaymentMethodApi } from '@providers/payment-method/payment-method.interface'
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
import { OfficeBranchStore } from '@store/office-branch/office-branch.store'
import { fireEvent, render, screen, within } from '@testing-library/angular'
import { NEVER, of, throwError } from 'rxjs'
import { RepairApi } from '../repair.interface'
import { createMockRepairDto, MOCK_REPAIR_STATUSES } from '../repair.mock'
import { createPaymentMethodApiMock, createRepairApiMock } from '../testing/repair-api.mock'
import { repairsTranslation } from '../testing/repairs-translation.mock'
import RepairsList from './repairs-list'

describe('RepairsList', () => {
	let repairApiMock: Record<keyof RepairApi, MockFn>
	let paymentMethodApiMock: Record<keyof PaymentMethodApi, MockFn>
	let customerApiMock: Record<keyof CustomerApi, MockFn>

	const ada = createMockRepairDto({ id: 11, lastUpdate: '2024-05-03T10:00:00.000Z' })
	const grace = createMockRepairDto({
		id: 12,
		lastUpdate: '2024-05-02T10:00:00.000Z',
		customer: {
			...createMockRepairDto().customer,
			id: 8,
			firstName: 'Grace',
			lastName: 'Hopper',
			fullName: 'Grace Hopper',
		},
		device: { ...createMockRepairDto().device, manufacturer: 'Apple', model: 'iPhone 13', deviceId: 'IMEI-777' },
		status: { id: RepairStatusId.IN_PROGRESS, description: 'En progreso' },
	})

	beforeEach(() => {
		clearAllMocks()
		useFakeTimers()
		spyOn(console, 'error')
		repairApiMock = createRepairApiMock()
		paymentMethodApiMock = createPaymentMethodApiMock()
		customerApiMock = {
			getAll: fn(),
			getById: fn(),
			getByEmail: fn(),
			getByDni: fn(),
			create: fn(),
			update: fn(),
		}
		repairApiMock.getAll.mockReturnValue(of([ada, grace]))
		repairApiMock.getAllByDate.mockReturnValue(of([ada]))
		repairApiMock.getStatuses.mockReturnValue(of(MOCK_REPAIR_STATUSES))
		paymentMethodApiMock.getAll.mockReturnValue(of([]))
	})

	afterEach(() => {
		useRealTimers()
		screen.queryAllByTestId('row-actions-menu').forEach((element) => element.remove())
	})

	function providers() {
		return [
			provideRouter([]),
			provideAuthMock(),
			provideIdentityMock(),
			{ provide: RepairApi, useValue: repairApiMock },
			{ provide: PaymentMethodApi, useValue: paymentMethodApiMock },
			{ provide: CustomerApi, useValue: customerApiMock },
			{ provide: OfficeBranchStore, useValue: { currentBranch: signal(null) } },
			{ provide: Translation, useValue: repairsTranslation },
		]
	}

	async function settle(view: { fixture: { detectChanges: () => void } }, ms = 1000): Promise<void> {
		TestBed.tick()
		await advanceTimersByTimeAsync(ms)
		view.fixture.detectChanges()
	}

	async function renderList({ canManage = true }: { canManage?: boolean } = {}) {
		const view = await render(RepairsList, { providers: providers() })
		TestBed.inject(AuthStore).updateCurrentUser(
			createMockUser({ hasPermission: (permission) => canManage && permission === Permission.REPAIRS_MANAGE }),
		)
		await settle(view)
		return view
	}

	async function openRowActions(view: Awaited<ReturnType<typeof renderList>>, rowName: string): Promise<void> {
		const row = screen.getByRole('row', { name: new RegExp(rowName) })
		fireEvent.click(within(row).getByRole('button', { name: 'Actions' }))
		await settle(view, 50)
	}

	it('shows the loading skeleton while the first load is in flight', async () => {
		repairApiMock.getAll.mockReturnValue(NEVER)

		await render(RepairsList, { providers: providers() })
		TestBed.tick()

		expect(screen.getByTestId('repairs-actions-skeleton')).toBeInTheDocument()
		expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
	})

	it('lists the repairs with their device and customer', async () => {
		await renderList()

		expect(screen.getByRole('heading', { name: 'Repairs' })).toBeInTheDocument()
		expect(screen.getByRole('cell', { name: 'Ada Lovelace' })).toBeInTheDocument()
		expect(screen.getByRole('cell', { name: 'Grace Hopper' })).toBeInTheDocument()
		expect(screen.getByRole('cell', { name: 'iPhone 13' })).toBeInTheDocument()
		expect(screen.getByRole('cell', { name: 'IMEI-777' })).toBeInTheDocument()
		expect(screen.getByRole('cell', { name: 'En progreso' })).toBeInTheDocument()
	})

	it('links every repair id to its detail page', async () => {
		await renderList()

		expect(screen.getByRole('link', { name: '11' })).toHaveAttribute('href', '/dashboard/repairs/11')
	})

	it('requests only the unfinished repairs by default', async () => {
		await renderList()

		expect(repairApiMock.getAll.calls[0][0]).toBe(false)
	})

	it('shows the most recently updated repair first', async () => {
		await renderList()

		const rows = screen.getAllByRole('row').slice(1)
		expect(within(rows[0]).getByRole('link', { name: '11' })).toBeInTheDocument()
		expect(within(rows[1]).getByRole('link', { name: '12' })).toBeInTheDocument()
	})

	it('shows the empty state when there are no repairs', async () => {
		repairApiMock.getAll.mockReturnValue(of([]))

		await renderList()

		expect(screen.getByText('No data available')).toBeInTheDocument()
	})

	it('shows the error state when the list cannot be loaded', async () => {
		repairApiMock.getAll.mockReturnValue(throwError(() => new Error('boom')))

		await renderList()

		expect(screen.getByRole('alert')).toHaveTextContent('Failed to load repairs')
	})

	describe('filters', () => {
		it('narrows the list by status', async () => {
			const view = await renderList()

			fireEvent.change(screen.getByRole('combobox', { name: 'Filter by status' }), {
				target: { value: String(RepairStatusId.IN_PROGRESS) },
			})
			await settle(view, 50)

			expect(screen.getByRole('cell', { name: 'Grace Hopper' })).toBeInTheDocument()
			expect(screen.queryByRole('cell', { name: 'Ada Lovelace' })).not.toBeInTheDocument()
		})

		it('shows every status again when the status filter is cleared', async () => {
			const view = await renderList()
			const filter = screen.getByRole('combobox', { name: 'Filter by status' })
			fireEvent.change(filter, { target: { value: String(RepairStatusId.IN_PROGRESS) } })
			await settle(view, 50)

			fireEvent.change(filter, { target: { value: '' } })
			await settle(view, 50)

			expect(screen.getByRole('cell', { name: 'Ada Lovelace' })).toBeInTheDocument()
			expect(screen.getByRole('cell', { name: 'Grace Hopper' })).toBeInTheDocument()
		})

		it('narrows the list by the searched text', async () => {
			const view = await renderList()

			fireEvent.input(screen.getByRole('searchbox'), { target: { value: 'iphone' } })
			await advanceTimersByTimeAsync(300)
			await settle(view, 50)

			expect(screen.getByRole('cell', { name: 'Grace Hopper' })).toBeInTheDocument()
			expect(screen.queryByRole('cell', { name: 'Ada Lovelace' })).not.toBeInTheDocument()
		})

		it('requests the finished repairs too when asked to show them', async () => {
			const view = await renderList()

			fireEvent.click(screen.getByRole('checkbox', { name: 'Show finished' }))
			await settle(view)

			expect(repairApiMock.getAll.calls.at(-1)?.[0]).toBe(true)
			expect(screen.getByRole('checkbox', { name: 'Show finished' })).toBeChecked()
		})

		it('requests the range once both dates are set', async () => {
			const view = await renderList()

			fireEvent.change(screen.getByLabelText('Checked in from'), { target: { value: '2024-05-01' } })
			fireEvent.change(screen.getByLabelText('Checked in until'), { target: { value: '2024-05-31' } })
			await settle(view)

			const range = repairApiMock.getAllByDate.calls.at(-1)?.[0] as {
				dateFrom: Date
				dateTo: Date
				showFinished: boolean
			}
			expect(range.dateFrom).toEqual(new Date(2024, 4, 1))
			expect(range.dateTo).toEqual(new Date(2024, 4, 31))
			expect(range.showFinished).toBe(false)
			expect(screen.getByLabelText('Checked in from')).toHaveValue('2024-05-01')
		})

		it('goes back to the plain list when the range is cleared', async () => {
			const view = await renderList()
			fireEvent.change(screen.getByLabelText('Checked in from'), { target: { value: '2024-05-01' } })
			fireEvent.change(screen.getByLabelText('Checked in until'), { target: { value: '2024-05-31' } })
			await settle(view)
			const plainCalls = repairApiMock.getAll.calls.length

			fireEvent.change(screen.getByLabelText('Checked in from'), { target: { value: '' } })
			fireEvent.change(screen.getByLabelText('Checked in until'), { target: { value: '' } })
			await settle(view)

			expect(repairApiMock.getAll.calls).toHaveLength(plainCalls + 1)
		})

		it('warns and does not request a range that ends before it starts', async () => {
			const view = await renderList()

			fireEvent.change(screen.getByLabelText('Checked in from'), { target: { value: '2024-06-01' } })
			fireEvent.change(screen.getByLabelText('Checked in until'), { target: { value: '2024-05-01' } })
			await settle(view, 50)

			expect(screen.getByRole('alert')).toHaveTextContent('The start date must not be after the end date.')
			expect(repairApiMock.getAllByDate.calls).toHaveLength(0)
		})

		it('reloads the list from the refresh button', async () => {
			const view = await renderList()
			const calls = repairApiMock.getAll.calls.length

			fireEvent.click(screen.getByRole('button', { name: 'Refresh list' }))
			await settle(view)

			expect(repairApiMock.getAll.calls).toHaveLength(calls + 1)
		})
	})

	describe('pagination', () => {
		function seed(count: number): void {
			repairApiMock.getAll.mockReturnValue(
				of(Array.from({ length: count }, (_, index) => createMockRepairDto({ id: index + 1 }))),
			)
		}

		it('hides the pagination when everything fits on one page', async () => {
			await renderList()

			expect(screen.queryByRole('navigation', { name: 'Pagination' })).not.toBeInTheDocument()
		})

		it('pages the list on the client', async () => {
			seed(20)
			const view = await renderList()
			expect(screen.getAllByRole('row')).toHaveLength(16)

			fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
			await settle(view, 50)

			expect(screen.getAllByRole('row')).toHaveLength(6)
			expect(screen.getByText('Page 2 of 2')).toBeInTheDocument()
		})
	})

	describe('permissions', () => {
		it('offers creating repairs to users who can manage them', async () => {
			await renderList({ canManage: true })

			expect(screen.getByRole('button', { name: 'New repair' })).toBeInTheDocument()
		})

		it('hides creating repairs from read-only users', async () => {
			await renderList({ canManage: false })

			expect(screen.queryByRole('button', { name: 'New repair' })).not.toBeInTheDocument()
		})

		it('offers editing from the row actions to users who can manage repairs', async () => {
			const view = await renderList({ canManage: true })

			await openRowActions(view, 'Ada Lovelace')

			expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument()
		})

		it('offers deleting from the row actions to users who can manage repairs', async () => {
			const view = await renderList({ canManage: true })

			await openRowActions(view, 'Ada Lovelace')

			expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument()
		})

		it('only offers viewing the details to read-only users', async () => {
			const view = await renderList({ canManage: false })

			await openRowActions(view, 'Ada Lovelace')

			expect(screen.getByRole('menuitem', { name: 'View details' })).toBeInTheDocument()
			expect(screen.queryByRole('menuitem', { name: 'Delete' })).not.toBeInTheDocument()
			expect(screen.queryByRole('menuitem', { name: 'Edit' })).not.toBeInTheDocument()
		})
	})

	describe('drawers', () => {
		it('opens the create drawer from the new repair button', async () => {
			const view = await renderList()

			fireEvent.click(screen.getByRole('button', { name: 'New repair' }))
			await settle(view)

			expect(screen.getByRole('heading', { name: 'New repair' })).toBeInTheDocument()
			expect(screen.getByLabelText(/^National ID/)).toBeInTheDocument()
		})

		it('does not navigate away to create a repair', async () => {
			const view = await renderList()
			const navigate = spyOn(TestBed.inject(Router), 'navigate')

			fireEvent.click(screen.getByRole('button', { name: 'New repair' }))
			await settle(view, 50)

			expect(navigate.calls).toHaveLength(0)
		})

		it('loads the repair and opens the edit drawer from the row actions', async () => {
			repairApiMock.getById.mockReturnValue(of(ada))
			const view = await renderList()
			await openRowActions(view, 'Ada Lovelace')

			fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }))
			await settle(view)

			expect(repairApiMock.getById.calls[0][0]).toBe(11)
			expect(screen.getByRole('heading', { name: 'Edit repair #11' })).toBeInTheDocument()
			expect(screen.getByLabelText(/^Model/)).toHaveValue('S21')
		})

		it('loads the repair again when it is edited a second time', async () => {
			repairApiMock.getById.mockReturnValue(of(ada))
			const view = await renderList()
			await openRowActions(view, 'Ada Lovelace')
			fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }))
			await settle(view)
			fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
			await settle(view)
			await openRowActions(view, 'Ada Lovelace')

			fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }))
			await settle(view)

			expect(repairApiMock.getById.calls).toHaveLength(2)
		})
	})

	describe('row actions', () => {
		it('navigates to the details of the repair', async () => {
			const view = await renderList()
			const navigate = spyOn(TestBed.inject(Router), 'navigate')
			navigate.mockReturnValue(Promise.resolve(true))
			await openRowActions(view, 'Ada Lovelace')

			fireEvent.click(screen.getByRole('menuitem', { name: 'View details' }))

			expect(navigate.calls[0][0]).toEqual(['/dashboard/repairs', 11])
		})

		it('asks for confirmation before deleting', async () => {
			const view = await renderList()
			await openRowActions(view, 'Ada Lovelace')

			fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))
			await settle(view, 50)

			expect(
				screen.getByText('Are you sure you want to delete repair #11 (Ada Lovelace)? This action cannot be undone.'),
			).toBeInTheDocument()
			expect(repairApiMock.delete.calls).toHaveLength(0)
		})

		it('deletes the repair once confirmed and reloads the list', async () => {
			repairApiMock.delete.mockReturnValue(of({ response: 'Deleted repair with id 11' }))
			const view = await renderList()
			await openRowActions(view, 'Ada Lovelace')
			fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))
			await settle(view, 50)
			const calls = repairApiMock.getAll.calls.length

			fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' }))
			await settle(view, 50)

			expect(repairApiMock.delete.calls[0][0]).toBe(11)
			expect(repairApiMock.getAll.calls).toHaveLength(calls + 1)
		})

		it('does not reload the list when the deletion fails', async () => {
			repairApiMock.delete.mockReturnValue(throwError(() => new Error('boom')))
			const view = await renderList()
			await openRowActions(view, 'Ada Lovelace')
			fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }))
			await settle(view, 50)
			const calls = repairApiMock.getAll.calls.length

			fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' }))
			await settle(view, 50)

			expect(repairApiMock.getAll.calls).toHaveLength(calls)
		})
	})
})
