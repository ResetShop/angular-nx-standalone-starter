import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { provideSignalFormsConfig } from '@angular/forms/signals'
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router'
import { Permission } from '@contracts/permission/legacy-permission.constants'
import { RepairStatusId } from '@contracts/repair/repair-status.constants'
import { createMockUser } from '@mocks/user.mock'
import { provideAuthMock } from '@providers/auth/auth.mock'
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
import { UIStore } from '@store/ui/ui.store'
import { fireEvent, render, screen, within } from '@testing-library/angular'
import { NEVER, of, throwError } from 'rxjs'
import { RepairVoucherPrinter } from '../repair-voucher/repair-voucher.printer'
import { RepairApi } from '../repair.interface'
import { createMockRepairDto, MOCK_REPAIR_STATUSES } from '../repair.mock'
import { selectOption } from '../testing/form-events'
import { createPaymentMethodApiMock, createRepairApiMock } from '../testing/repair-api.mock'
import { repairsTranslation } from '../testing/repairs-translation.mock'
import RepairDetail from './repair-detail'

describe('RepairDetail', () => {
	let repairApiMock: Record<keyof RepairApi, MockFn>
	let paymentMethodApiMock: Record<keyof PaymentMethodApi, MockFn>
	let printer: { print: MockFn }

	beforeEach(() => {
		clearAllMocks()
		useFakeTimers()
		spyOn(console, 'error')
		repairApiMock = createRepairApiMock()
		paymentMethodApiMock = createPaymentMethodApiMock()
		printer = { print: fn() }
		repairApiMock.getAll.mockReturnValue(of([]))
		repairApiMock.getStatuses.mockReturnValue(of(MOCK_REPAIR_STATUSES))
		repairApiMock.getById.mockReturnValue(of(createMockRepairDto({ id: 9 })))
		repairApiMock.getHistory.mockReturnValue(of([]))
		paymentMethodApiMock.getAll.mockReturnValue(of([]))
	})

	afterEach(() => useRealTimers())

	async function settle(view: { fixture: { detectChanges: () => void } }, ms = 1000): Promise<void> {
		TestBed.tick()
		await advanceTimersByTimeAsync(ms)
		view.fixture.detectChanges()
	}

	async function renderDetail({ id = '9', canManage = true }: { id?: string; canManage?: boolean } = {}) {
		const view = await render(RepairDetail, {
			providers: [
				provideRouter([]),
				provideAuthMock(),
				provideIdentityMock(),
				{ provide: RepairApi, useValue: repairApiMock },
				{ provide: PaymentMethodApi, useValue: paymentMethodApiMock },
				{ provide: OfficeBranchStore, useValue: { currentBranch: signal(null) } },
				{ provide: RepairVoucherPrinter, useValue: printer },
				{ provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id }) } } },
				{ provide: Translation, useValue: repairsTranslation },
				...provideSignalFormsConfig({}),
			],
		})
		TestBed.inject(AuthStore).updateCurrentUser(
			createMockUser({ id: 5, hasPermission: (permission) => canManage && permission === Permission.REPAIRS_MANAGE }),
		)
		await settle(view)
		return view
	}

	it('loads the repair and its history identified by the route id', async () => {
		await renderDetail({ id: '9' })

		expect(repairApiMock.getById.calls[0][0]).toBe(9)
		expect(repairApiMock.getHistory.calls[0][0]).toBe(9)
	})

	it('does not load anything when the route id is not a positive integer', async () => {
		await renderDetail({ id: 'abc' })

		expect(repairApiMock.getById.calls).toHaveLength(0)
		expect(screen.getByRole('link', { name: /Back to repairs/ })).toBeInTheDocument()
	})

	it('shows the loading state while the repair loads', async () => {
		repairApiMock.getById.mockReturnValue(NEVER)

		await render(RepairDetail, {
			providers: [
				provideRouter([]),
				provideAuthMock(),
				provideIdentityMock(),
				{ provide: RepairApi, useValue: repairApiMock },
				{ provide: PaymentMethodApi, useValue: paymentMethodApiMock },
				{ provide: OfficeBranchStore, useValue: { currentBranch: signal(null) } },
				{ provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '9' }) } } },
				{ provide: Translation, useValue: repairsTranslation },
			],
		})
		TestBed.tick()

		expect(screen.getByRole('status')).toHaveTextContent('Loading...')
	})

	it('shows the error when the repair cannot be loaded', async () => {
		repairApiMock.getById.mockReturnValue(throwError(() => new Error('boom')))

		await renderDetail()

		expect(screen.getByRole('alert')).toHaveTextContent('Failed to load repair')
	})

	it('renders the summary and the history of the repair, without inline forms', async () => {
		await renderDetail()

		expect(screen.getByRole('heading', { name: 'Repair #9' })).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: 'Summary' })).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: 'Status history' })).toBeInTheDocument()
		expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument()
	})

	it('hides the edit and delete actions from users who cannot manage repairs', async () => {
		await renderDetail({ canManage: false })

		expect(screen.getByRole('heading', { name: 'Summary' })).toBeInTheDocument()
		expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument()
		expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Print voucher' })).toBeInTheDocument()
	})

	describe('editing', () => {
		async function openEditDrawer(view: Awaited<ReturnType<typeof renderDetail>>): Promise<void> {
			fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
			await settle(view)
		}

		it('opens the edit drawer with the stored values without loading the repair again', async () => {
			const view = await renderDetail()

			await openEditDrawer(view)

			expect(screen.getByRole('heading', { name: 'Edit repair #9' })).toBeInTheDocument()
			expect(screen.getByLabelText(/^Model/)).toHaveValue('S21')
			expect(screen.getByRole('combobox', { name: /^Status/ })).toHaveValue(String(RepairStatusId.ENTERED))
			expect(repairApiMock.getById.calls).toHaveLength(1)
		})

		it('saves the device information and reloads the repair', async () => {
			repairApiMock.updateDeviceInfo.mockReturnValue(of([1]))
			const view = await renderDetail()
			await openEditDrawer(view)

			fireEvent.input(screen.getByLabelText(/^Model/), { target: { value: 'S22' } })
			fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
			await settle(view, 50)

			const body = repairApiMock.updateDeviceInfo.calls[0][0] as { id: number; device: { model: string } }
			expect(body.id).toBe(9)
			expect(body.device.model).toBe('S22')
			expect(repairApiMock.getById.calls).toHaveLength(2)
		})

		it('saves the tracking with the current user and reloads the history', async () => {
			repairApiMock.updateTrackingInfo.mockReturnValue(of([1]))
			const view = await renderDetail()
			await openEditDrawer(view)

			selectOption(screen.getByRole('combobox', { name: /^Status/ }), String(RepairStatusId.IN_PROGRESS))
			fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
			await settle(view, 50)

			const request = repairApiMock.updateTrackingInfo.calls[0][0] as {
				repairToUpdate: { status: { id: number } }
				user: { id: number }
				generateTransaction: boolean
			}
			expect(request.repairToUpdate.status.id).toBe(RepairStatusId.IN_PROGRESS)
			expect(request.user.id).toBe(5)
			expect(request.generateTransaction).toBe(false)
			expect(repairApiMock.getHistory.calls).toHaveLength(2)
		})
	})

	describe('voucher', () => {
		it('prints the voucher of a repair that is ready for delivery', async () => {
			repairApiMock.getById.mockReturnValue(
				of(
					createMockRepairDto({
						id: 9,
						note: 'Cambio de pantalla',
						price: '900',
						status: { id: RepairStatusId.READY_FOR_DELIVER, description: 'Listo para entregar' },
					}),
				),
			)
			await renderDetail()

			fireEvent.click(screen.getByRole('button', { name: 'Print voucher' }))

			expect(printer.print.calls).toHaveLength(1)
			expect((printer.print.calls[0][0] as { id: number }).id).toBe(9)
		})

		it('explains why the voucher is not available yet', async () => {
			await renderDetail()
			const notifications = spyOn(TestBed.inject(UIStore), 'showNotification')

			fireEvent.click(screen.getByRole('button', { name: 'Print voucher' }))

			expect(printer.print.calls).toHaveLength(0)
			expect(notifications.calls[0][0]).toEqual(
				expect.objectContaining({ type: 'info', message: expect.stringContaining('The voucher is not available yet') }),
			)
		})
	})

	describe('deleting', () => {
		it('asks for confirmation first', async () => {
			const view = await renderDetail()

			fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
			await settle(view, 50)

			expect(screen.getByRole('alertdialog')).toHaveTextContent('delete repair #9')
			expect(repairApiMock.delete.calls).toHaveLength(0)
		})

		it('deletes the repair and goes back to the list', async () => {
			repairApiMock.delete.mockReturnValue(of({ response: 'Deleted repair with id 9' }))
			const view = await renderDetail()
			const navigate = spyOn(TestBed.inject(Router), 'navigate')
			navigate.mockReturnValue(Promise.resolve(true))
			fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
			await settle(view, 50)

			fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' }))
			await settle(view, 50)

			expect(repairApiMock.delete.calls[0][0]).toBe(9)
			expect(navigate.calls[0][0]).toEqual(['/dashboard/repairs'])
		})

		it('stays on the page when the deletion fails', async () => {
			repairApiMock.delete.mockReturnValue(throwError(() => new Error('boom')))
			const view = await renderDetail()
			const navigate = spyOn(TestBed.inject(Router), 'navigate')
			fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
			await settle(view, 50)

			fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete' }))
			await settle(view, 50)

			expect(navigate.calls).toHaveLength(0)
		})
	})
})
