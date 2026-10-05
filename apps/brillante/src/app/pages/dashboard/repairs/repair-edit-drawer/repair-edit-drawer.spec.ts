import { HttpErrorResponse } from '@angular/common/http'
import { signal } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { provideSignalFormsConfig } from '@angular/forms/signals'
import { RepairStatusId } from '@contracts/repair/repair-status.constants'
import { mapRepairDto } from '@domain/repair/repair.mapper'
import { createMockUser } from '@mocks/user.mock'
import { provideAuthMock } from '@providers/auth/auth.mock'
import { PaymentMethodApi } from '@providers/payment-method/payment-method.interface'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import { DRAWER_SPINNER_MIN_DISPLAY } from '@resetshop/ui/drawer/drawer-loading'
import { parseDurationToMs } from '@resetshop/util'
import {
	advanceTimersByTimeAsync,
	clearAllMocks,
	type MockFn,
	spyOn,
	useFakeTimers,
	useRealTimers,
} from '@resetshop/util/test-utils'
import { AuthStore } from '@store/auth/auth.store'
import { OfficeBranchStore } from '@store/office-branch/office-branch.store'
import { UIStore } from '@store/ui/ui.store'
import { fireEvent, render, screen } from '@testing-library/angular'
import { NEVER, of, throwError } from 'rxjs'
import { RepairApi } from '../repair.interface'
import { createMockRepairDto, MOCK_REPAIR_STATUSES } from '../repair.mock'
import { RepairStore } from '../repair.store'
import { DRAWER_CLOSE_AFTER_SUCCESS_DELAY } from '../repairs.constants'
import { selectOption } from '../testing/form-events'
import { createPaymentMethodApiMock, createRepairApiMock } from '../testing/repair-api.mock'
import { repairsTranslation } from '../testing/repairs-translation.mock'
import { RepairEditDrawer } from './repair-edit-drawer'

describe('RepairEditDrawer', () => {
	let repairApiMock: Record<keyof RepairApi, MockFn>
	let paymentMethodApiMock: Record<keyof PaymentMethodApi, MockFn>

	const storedDto = createMockRepairDto({ id: 9, price: '900', cost: '400', note: 'Sin novedades' })

	beforeEach(() => {
		clearAllMocks()
		useFakeTimers()
		spyOn(console, 'error')
		repairApiMock = createRepairApiMock()
		paymentMethodApiMock = createPaymentMethodApiMock()
		repairApiMock.getAll.mockReturnValue(of([]))
		repairApiMock.getStatuses.mockReturnValue(of(MOCK_REPAIR_STATUSES))
		repairApiMock.getById.mockReturnValue(of(storedDto))
		repairApiMock.getHistory.mockReturnValue(of([]))
		repairApiMock.updateDeviceInfo.mockReturnValue(of([1]))
		repairApiMock.updateTrackingInfo.mockReturnValue(of([1]))
		paymentMethodApiMock.getAll.mockReturnValue(
			of([{ id: 1, description: 'Efectivo', allowsInstallments: false, installments: [] }]),
		)
	})

	afterEach(() => useRealTimers())

	type View = Awaited<ReturnType<typeof renderDrawer>>

	async function renderDrawer() {
		const view = await render(RepairEditDrawer, {
			providers: [
				provideAuthMock(),
				{ provide: RepairApi, useValue: repairApiMock },
				{ provide: PaymentMethodApi, useValue: paymentMethodApiMock },
				{ provide: OfficeBranchStore, useValue: { currentBranch: signal(null) } },
				{ provide: Translation, useValue: repairsTranslation },
				...provideSignalFormsConfig({}),
			],
		})
		TestBed.inject(AuthStore).updateCurrentUser(createMockUser({ id: 5 }))
		TestBed.tick()
		return view
	}

	async function renderAndOpen({ selected = false }: { selected?: boolean } = {}): Promise<View> {
		const view = await renderDrawer()
		const repair = mapRepairDto(storedDto)
		if (selected) TestBed.inject(RepairStore).selectRepair(repair)
		view.fixture.componentInstance.open(repair)
		TestBed.tick()
		await advanceTimersByTimeAsync(parseDurationToMs(DRAWER_SPINNER_MIN_DISPLAY))
		view.fixture.detectChanges()
		return view
	}

	const saveButton = () => screen.getByRole('button', { name: /^save changes|^saving/i })

	async function saveAndSettle(view: View): Promise<void> {
		fireEvent.click(saveButton())
		for (let round = 0; round < 3; round++) {
			view.fixture.detectChanges()
			TestBed.tick()
		}
		await advanceTimersByTimeAsync(parseDurationToMs(DRAWER_CLOSE_AFTER_SUCCESS_DELAY))
		// The drawer reports it finished closing on the dialog's transitionend.
		fireEvent.transitionEnd(screen.getByRole('dialog', { hidden: true }))
		await advanceTimersByTimeAsync(parseDurationToMs(DRAWER_SPINNER_MIN_DISPLAY))
		view.fixture.detectChanges()
	}

	const notifications = () => TestBed.inject(UIStore).notifications()

	it('loads the repair when it is not the selected one and shows its stored data', async () => {
		await renderAndOpen()

		expect(repairApiMock.getById.calls[0][0]).toBe(9)
		expect(screen.getByRole('heading', { name: 'Edit repair #9' })).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: 'Device information' })).toBeInTheDocument()
		expect(screen.getByRole('heading', { name: 'Repair tracking' })).toBeInTheDocument()
		expect(screen.getByLabelText(/^Brand/)).toHaveValue('Samsung')
		expect(screen.getByLabelText(/^Reported issue/)).toHaveValue('Pantalla rota')
		expect(screen.getByRole('combobox', { name: /^Status/ })).toHaveValue(String(RepairStatusId.ENTERED))
		expect(screen.getByLabelText(/^Price/)).toHaveValue(900)
	})

	it('reuses the selected repair instead of loading it again', async () => {
		await renderAndOpen({ selected: true })

		expect(repairApiMock.getById.calls).toHaveLength(0)
		expect(screen.getByLabelText(/^Model/)).toHaveValue('S21')
	})

	it('shows the error and no form when the repair cannot be loaded', async () => {
		repairApiMock.getById.mockReturnValue(throwError(() => new Error('boom')))

		await renderAndOpen()

		expect(screen.getByRole('alert')).toHaveTextContent('Failed to load repair')
		expect(screen.queryByLabelText(/^Brand/)).not.toBeInTheDocument()
		expect(saveButton()).toBeDisabled()
	})

	it('does not offer saving while nothing has changed', async () => {
		await renderAndOpen()

		expect(saveButton()).toBeDisabled()
	})

	describe('validation', () => {
		it('cannot be saved while a required device field is empty', async () => {
			await renderAndOpen()

			fireEvent.input(screen.getByLabelText(/^Brand/), { target: { value: '' } })

			expect(saveButton()).toBeDisabled()
		})

		it('cannot be saved without the reported issue', async () => {
			await renderAndOpen()

			fireEvent.input(screen.getByLabelText(/^Reported issue/), { target: { value: '' } })

			expect(saveButton()).toBeDisabled()
		})

		it('cannot be saved with a negative price', async () => {
			await renderAndOpen()

			fireEvent.input(screen.getByLabelText(/^Price/), { target: { value: '-5' } })

			expect(saveButton()).toBeDisabled()
		})

		it('cannot be saved with a warranty longer than 24 months', async () => {
			await renderAndOpen()

			fireEvent.input(screen.getByLabelText(/^Warranty/), { target: { value: '25' } })

			expect(saveButton()).toBeDisabled()
		})

		it('cannot be saved until the payments of a closed repair add up to the price', async () => {
			await renderAndOpen()
			selectOption(screen.getByRole('combobox', { name: /^Status/ }), String(RepairStatusId.FINISHED_AND_PAID))

			expect(screen.getByRole('alert')).toHaveTextContent('The payments must add up to the price of the repair.')
			expect(saveButton()).toBeDisabled()

			fireEvent.click(screen.getByRole('button', { name: 'Add payment' }))

			expect(saveButton()).toBeEnabled()
		})
	})

	describe('saving', () => {
		it('sends only the device information when only the device changed', async () => {
			const view = await renderAndOpen()

			fireEvent.input(screen.getByLabelText(/^Model/), { target: { value: '  S22 ' } })
			await saveAndSettle(view)

			const body = repairApiMock.updateDeviceInfo.calls[0][0] as { id: number; device: { model: string } }
			expect(body.id).toBe(9)
			expect(body.device.model).toBe('S22')
			expect(repairApiMock.updateTrackingInfo.calls).toHaveLength(0)
		})

		it('sends only the tracking, with the current user, when only the tracking changed', async () => {
			const view = await renderAndOpen()

			selectOption(screen.getByRole('combobox', { name: /^Status/ }), String(RepairStatusId.IN_PROGRESS))
			fireEvent.input(screen.getByLabelText(/^Repair notes/), { target: { value: ' Esperando repuesto ' } })
			await saveAndSettle(view)

			const request = repairApiMock.updateTrackingInfo.calls[0][0] as {
				repairToUpdate: { status: { id: number }; note: string }
				user: { id: number }
				generateTransaction: boolean
			}
			expect(request.repairToUpdate.status.id).toBe(RepairStatusId.IN_PROGRESS)
			expect(request.repairToUpdate.note).toBe('Esperando repuesto')
			expect(request.user.id).toBe(5)
			expect(request.generateTransaction).toBe(false)
			expect(repairApiMock.updateDeviceInfo.calls).toHaveLength(0)
		})

		it('saves the device first and then the tracking, which already carries the new device', async () => {
			const view = await renderAndOpen()

			fireEvent.input(screen.getByLabelText(/^Model/), { target: { value: 'S22' } })
			selectOption(screen.getByRole('combobox', { name: /^Status/ }), String(RepairStatusId.IN_PROGRESS))
			await saveAndSettle(view)

			const device = repairApiMock.updateDeviceInfo.calls[0][0] as { status: { id: number } }
			const tracking = repairApiMock.updateTrackingInfo.calls[0][0] as {
				repairToUpdate: { status: { id: number }; device: { model: string } }
			}
			expect(device.status.id).toBe(RepairStatusId.ENTERED)
			expect(tracking.repairToUpdate.status.id).toBe(RepairStatusId.IN_PROGRESS)
			expect(tracking.repairToUpdate.device.model).toBe('S22')
		})

		it('sends the payments and the transaction flag when a repair is closed', async () => {
			const view = await renderAndOpen()
			selectOption(screen.getByRole('combobox', { name: /^Status/ }), String(RepairStatusId.FINISHED_AND_PAID))
			fireEvent.click(screen.getByRole('button', { name: 'Add payment' }))

			await saveAndSettle(view)

			const request = repairApiMock.updateTrackingInfo.calls[0][0] as {
				repairToUpdate: { moneyTransactions: { amount: string | number }[] }
				generateTransaction: boolean
			}
			expect(request.generateTransaction).toBe(true)
			expect(request.repairToUpdate.moneyTransactions).toHaveLength(1)
			expect(Number(request.repairToUpdate.moneyTransactions[0].amount)).toBe(900)
		})

		it('reloads the repair and the list after saving', async () => {
			const view = await renderAndOpen({ selected: true })

			fireEvent.input(screen.getByLabelText(/^Model/), { target: { value: 'S22' } })
			await saveAndSettle(view)

			expect(repairApiMock.getById.calls).toHaveLength(1)
			expect(repairApiMock.getAll.calls).toHaveLength(2)
		})

		it('confirms the update once the drawer has closed', async () => {
			const view = await renderAndOpen()

			selectOption(screen.getByRole('combobox', { name: /^Status/ }), String(RepairStatusId.IN_PROGRESS))
			await saveAndSettle(view)

			expect(notifications()).toHaveLength(1)
			expect(notifications()[0]).toEqual(
				expect.objectContaining({ type: 'success', message: 'Repair updated successfully.' }),
			)
			expect(screen.queryByRole('heading', { name: 'Edit repair #9' })).not.toBeInTheDocument()
		})

		it('confirms both updates when the device and the tracking were saved', async () => {
			const view = await renderAndOpen()

			fireEvent.input(screen.getByLabelText(/^Model/), { target: { value: 'S22' } })
			selectOption(screen.getByRole('combobox', { name: /^Status/ }), String(RepairStatusId.IN_PROGRESS))
			await saveAndSettle(view)

			expect(notifications().map((notification) => notification.message)).toEqual([
				'Device information updated successfully.',
				'Repair updated successfully.',
			])
		})
	})

	describe('errors', () => {
		it('keeps the drawer open and shows the error when the tracking cannot be saved', async () => {
			repairApiMock.updateTrackingInfo.mockReturnValue(
				throwError(() => new HttpErrorResponse({ status: 400, error: { error: 'Invalid repair data' } })),
			)
			const view = await renderAndOpen()

			selectOption(screen.getByRole('combobox', { name: /^Status/ }), String(RepairStatusId.IN_PROGRESS))
			await saveAndSettle(view)

			expect(screen.getByRole('alert')).toHaveTextContent('Invalid repair data')
			expect(screen.getByRole('heading', { name: 'Edit repair #9' })).toBeInTheDocument()
			expect(notifications()).toHaveLength(0)
		})

		it('does not send the tracking when the device cannot be saved', async () => {
			repairApiMock.updateDeviceInfo.mockReturnValue(throwError(() => new Error('boom')))
			const view = await renderAndOpen()

			fireEvent.input(screen.getByLabelText(/^Model/), { target: { value: 'S22' } })
			selectOption(screen.getByRole('combobox', { name: /^Status/ }), String(RepairStatusId.IN_PROGRESS))
			await saveAndSettle(view)

			expect(screen.getByRole('alert')).toHaveTextContent('Failed to update the device information')
			expect(repairApiMock.updateTrackingInfo.calls).toHaveLength(0)
			expect(notifications()).toHaveLength(0)
		})

		it('shows the saving state while a save is in flight', async () => {
			repairApiMock.updateDeviceInfo.mockReturnValue(NEVER)
			const view = await renderAndOpen()

			fireEvent.input(screen.getByLabelText(/^Model/), { target: { value: 'S22' } })
			fireEvent.click(saveButton())
			view.fixture.detectChanges()

			expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled()
		})
	})

	describe('discarding', () => {
		it('asks for confirmation before discarding a dirty form', async () => {
			const view = await renderAndOpen()
			fireEvent.input(screen.getByLabelText(/^Model/), { target: { value: 'S22' } })
			view.fixture.detectChanges()

			fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
			view.fixture.detectChanges()

			expect(screen.getByText('You have unsaved changes. Are you sure you want to discard them?')).toBeInTheDocument()
		})

		it('closes without asking when nothing was edited', async () => {
			const view = await renderAndOpen()

			fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
			view.fixture.detectChanges()

			fireEvent.transitionEnd(screen.getByRole('dialog', { hidden: true }))
			await advanceTimersByTimeAsync(parseDurationToMs(DRAWER_SPINNER_MIN_DISPLAY))
			expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
			expect(screen.queryByRole('heading', { name: 'Edit repair #9' })).not.toBeInTheDocument()
		})

		it('starts from the stored data again when reopened after discarding', async () => {
			const view = await renderAndOpen({ selected: true })
			fireEvent.input(screen.getByLabelText(/^Model/), { target: { value: 'S22' } })
			fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
			view.fixture.detectChanges()
			fireEvent.click(screen.getByRole('button', { name: 'Discard' }))
			view.fixture.detectChanges()
			fireEvent.transitionEnd(screen.getByRole('dialog', { hidden: true }))
			await advanceTimersByTimeAsync(parseDurationToMs(DRAWER_SPINNER_MIN_DISPLAY))

			view.fixture.componentInstance.open(mapRepairDto(storedDto))
			TestBed.tick()
			await advanceTimersByTimeAsync(parseDurationToMs(DRAWER_SPINNER_MIN_DISPLAY))
			view.fixture.detectChanges()

			expect(screen.getByLabelText(/^Model/)).toHaveValue('S21')
		})
	})
})
