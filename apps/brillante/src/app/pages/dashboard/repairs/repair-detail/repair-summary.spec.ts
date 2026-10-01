import { mapRepairDto } from '@domain/repair/repair.mapper'
import type { Repair } from '@domain/repair/repair.model'
import { createMockRepairDto } from '@providers/repair/repair.mock'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import { clearAllMocks } from '@resetshop/util/test-utils'
import { render, screen } from '@testing-library/angular'
import { repairsTranslation } from '../testing/repairs-translation.mock'
import { RepairSummary } from './repair-summary'

describe('RepairSummary', () => {
	beforeEach(() => {
		clearAllMocks()
	})

	async function renderSummary(repair: Repair) {
		return render(RepairSummary, {
			inputs: { repair },
			providers: [{ provide: Translation, useValue: repairsTranslation }],
		})
	}

	function repairFrom(overrides: Parameters<typeof createMockRepairDto>[0] = {}): Repair {
		return mapRepairDto(
			createMockRepairDto({
				id: 9,
				price: '1500.5',
				cost: '700',
				paymentInAdvance: '200',
				...overrides,
			}),
		)
	}

	it('shows the customer, the device and the status', async () => {
		await renderSummary(repairFrom())

		expect(screen.getByRole('heading', { name: 'Summary' })).toBeInTheDocument()
		expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
		expect(screen.getByText('ada@example.com')).toBeInTheDocument()
		expect(screen.getByText('3425551234')).toBeInTheDocument()
		expect(screen.getByText('Smartphone - Samsung S21')).toBeInTheDocument()
		expect(screen.getByText('3569871')).toBeInTheDocument()
		expect(screen.getByText('Ingresado')).toBeInTheDocument()
		expect(screen.getByText('Pantalla rota')).toBeInTheDocument()
	})

	it('shows the money figures as currency', async () => {
		await renderSummary(repairFrom())

		expect(screen.getByText(/1,500.50/)).toBeInTheDocument()
		expect(screen.getByText(/700.00/)).toBeInTheDocument()
		expect(screen.getByText(/200.00/)).toBeInTheDocument()
	})

	it('tells whether the device arrived turned on', async () => {
		await renderSummary(repairFrom())

		expect(screen.getByText('Arrived turned on')).toBeInTheDocument()
	})

	it('tells when the device arrived turned off', async () => {
		await renderSummary(repairFrom({ device: { ...createMockRepairDto().device, turnedOn: false } }))

		expect(screen.getByText('Arrived turned off')).toBeInTheDocument()
	})

	it('shows a dash for a device without an identifier', async () => {
		await renderSummary(repairFrom({ device: { ...createMockRepairDto().device, deviceId: null } }))

		expect(screen.getByText('-')).toBeInTheDocument()
	})

	it('hides the finish date and the creator until they exist', async () => {
		await renderSummary(repairFrom())

		expect(screen.queryByText('Finished')).not.toBeInTheDocument()
		expect(screen.queryByText('Created by')).not.toBeInTheDocument()
	})

	it('shows the finish date and the creator when known', async () => {
		const creator = {
			id: 5,
			userName: 'recepcion',
			firstName: null,
			lastName: null,
			avatar: null,
			email: 'r@example.com',
			roles: [],
			hasFinishedRegistration: true,
		}

		await renderSummary(repairFrom({ checkOut: '2024-05-09T10:00:00.000Z', user: creator }))

		expect(screen.getByText('Finished')).toBeInTheDocument()
		expect(screen.getByText('recepcion')).toBeInTheDocument()
	})
})
