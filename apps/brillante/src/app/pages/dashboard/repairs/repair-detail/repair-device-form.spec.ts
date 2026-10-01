import { provideSignalFormsConfig } from '@angular/forms/signals'
import { mapRepairDto } from '@domain/repair/repair.mapper'
import type { Repair, RepairDeviceChanges } from '@domain/repair/repair.model'
import { createMockRepairDto } from '@providers/repair/repair.mock'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import { clearAllMocks, fn, type MockFn } from '@resetshop/util/test-utils'
import { fireEvent, render, screen } from '@testing-library/angular'
import { selectOption } from '../testing/form-events'
import { repairsTranslation } from '../testing/repairs-translation.mock'
import { RepairDeviceForm } from './repair-device-form'

describe('RepairDeviceForm', () => {
	let onSave: MockFn<[RepairDeviceChanges], void>

	beforeEach(() => {
		clearAllMocks()
		onSave = fn<[RepairDeviceChanges], void>()
	})

	async function renderForm(repair: Repair = mapRepairDto(createMockRepairDto({ id: 9 })), saving = false) {
		return render(RepairDeviceForm, {
			inputs: { repair, saving },
			on: { save: onSave },
			providers: [{ provide: Translation, useValue: repairsTranslation }, ...provideSignalFormsConfig({})],
		})
	}

	const saveButton = () => screen.getByRole('button', { name: /^save device information|^saving/i })

	it('fills the fields with the stored device and issue', async () => {
		await renderForm()

		expect(screen.getByLabelText(/^Brand/)).toHaveValue('Samsung')
		expect(screen.getByLabelText(/^Model/)).toHaveValue('S21')
		expect(screen.getByLabelText(/^IMEI/)).toHaveValue('3569871')
		expect(screen.getByLabelText(/^Reported issue/)).toHaveValue('Pantalla rota')
		expect(screen.getByLabelText(/^The device arrived turned on/)).toBeChecked()
	})

	it('cannot be saved until something changes', async () => {
		await renderForm()

		expect(saveButton()).toBeDisabled()
	})

	it('emits the trimmed changes when saved', async () => {
		await renderForm()

		fireEvent.input(screen.getByLabelText(/^Model/), { target: { value: '  S22 Ultra ' } })
		fireEvent.click(screen.getByLabelText(/^The device arrived turned on/))
		selectOption(screen.getByRole('combobox', { name: /^Device type/ }), '1')
		fireEvent.click(saveButton())

		expect(onSave.calls).toHaveLength(1)
		expect(onSave.calls[0][0]).toEqual({
			turnedOn: false,
			typeId: 1,
			manufacturer: 'Samsung',
			model: 'S22 Ultra',
			deviceId: '3569871',
			issue: 'Pantalla rota',
		})
	})

	it('cannot be saved while a required field is empty', async () => {
		await renderForm()

		fireEvent.input(screen.getByLabelText(/^Brand/), { target: { value: '' } })

		expect(saveButton()).toBeDisabled()
	})

	it('cannot be saved without the reported issue', async () => {
		await renderForm()

		fireEvent.input(screen.getByLabelText(/^Reported issue/), { target: { value: '' } })

		expect(saveButton()).toBeDisabled()
	})

	it('disables saving and labels the button while a save is in flight', async () => {
		await renderForm(mapRepairDto(createMockRepairDto({ id: 9 })), true)

		expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled()
	})

	it('shows the stored values again when the repair input changes', async () => {
		const view = await renderForm()
		fireEvent.input(screen.getByLabelText(/^Model/), { target: { value: 'Typed model' } })

		view.fixture.componentRef.setInput(
			'repair',
			mapRepairDto(createMockRepairDto({ id: 9, device: { ...createMockRepairDto().device, model: 'S23' } })),
		)
		view.fixture.detectChanges()

		expect(screen.getByLabelText(/^Model/)).toHaveValue('S23')
		expect(saveButton()).toBeDisabled()
	})
})
