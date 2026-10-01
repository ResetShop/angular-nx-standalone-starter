import { DEVICE_TYPES } from '@contracts/repair/device-type.constants'
import { RepairStatusId } from '@contracts/repair/repair-status.constants'
import { createMockUser } from '@mocks/user.mock'
import { createMockRepairDto } from '@pages/dashboard/repairs/repair.mock'
import {
	applyDeviceChanges,
	applyTrackingChanges,
	createRepairFromIntake,
	mapCustomerDto,
	mapRepairDto,
	mapRepairStatusHistoryDto,
	toCreateCustomerRequest,
	toCreateRepairRequest,
	toRepairWriteDto,
	toUpdateTrackingInfoRequest,
	toUserDto,
} from './repair.mapper'
import type { RepairIntake } from './repair.model'

const NOW = new Date('2024-06-10T12:00:00.000Z')

function createIntake(overrides: Partial<RepairIntake> = {}): RepairIntake {
	return {
		customer: {
			id: null,
			dni: 30123456,
			firstName: 'Ada',
			lastName: 'Lovelace',
			email: 'ada@example.com',
			address: 'Calle Falsa 123',
			telephone: '3425551234',
			birthDate: new Date('1990-05-01T03:00:00.000Z'),
		},
		device: { turnedOn: true, typeId: 1, manufacturer: 'Apple', model: 'iPad', deviceId: 'SN-1' },
		issue: 'No carga',
		note: 'Revisar puerto',
		status: { id: RepairStatusId.ENTERED, description: 'Ingresado' },
		paymentInAdvance: 100,
		price: 500,
		cost: 200,
		warrantyTerm: 6,
		...overrides,
	}
}

describe('repair mapper', () => {
	describe('mapRepairDto', () => {
		it('parses the dates and the decimal strings', () => {
			const repair = mapRepairDto(
				createMockRepairDto({
					price: '1500.50',
					cost: '700',
					paymentInAdvance: '200.25',
					checkIn: '2024-05-01T10:00:00.000Z',
					checkOut: '2024-05-09T10:00:00.000Z',
				}),
			)

			expect(repair.price).toBe(1500.5)
			expect(repair.cost).toBe(700)
			expect(repair.paymentInAdvance).toBe(200.25)
			expect(repair.checkIn).toEqual(new Date('2024-05-01T10:00:00.000Z'))
			expect(repair.checkOut).toEqual(new Date('2024-05-09T10:00:00.000Z'))
			expect(repair.lastUpdate).toBeInstanceOf(Date)
		})

		it('keeps absent dates as null and absent numbers as zero', () => {
			const repair = mapRepairDto(
				createMockRepairDto({ checkOut: null, lastUpdate: null, price: null, cost: null, paymentInAdvance: null }),
			)

			expect(repair.checkOut).toBeNull()
			expect(repair.lastUpdate).toBeNull()
			expect(repair.price).toBe(0)
			expect(repair.cost).toBe(0)
			expect(repair.paymentInAdvance).toBe(0)
		})

		it('treats a non numeric decimal as zero', () => {
			expect(mapRepairDto(createMockRepairDto({ price: 'abc' })).price).toBe(0)
		})

		it('normalizes missing text to empty strings', () => {
			const repair = mapRepairDto(
				createMockRepairDto({
					note: null,
					issue: null,
					device: { ...createMockRepairDto().device, deviceId: null },
				}),
			)

			expect(repair.note).toBe('')
			expect(repair.issue).toBe('')
			expect(repair.device.deviceId).toBe('')
		})

		it('maps the customer, the creator and the payments', () => {
			const repair = mapRepairDto(
				createMockRepairDto({
					user: { ...toUserDto(createMockUser({ userName: 'recepcion' })), roles: [] },
					moneyTransactions: [
						{
							id: 4,
							amount: '500.00',
							date: '2024-05-09T10:00:00.000Z',
							paymentMethod: { id: 1, description: 'Efectivo' },
						},
					],
				}),
			)

			expect(repair.customer.fullName).toBe('Ada Lovelace')
			expect(repair.createdByUserName).toBe('recepcion')
			expect(repair.payments).toEqual([
				{
					id: 4,
					amount: 500,
					date: new Date('2024-05-09T10:00:00.000Z'),
					paymentMethodId: 1,
					paymentMethodDescription: 'Efectivo',
				},
			])
		})

		it('has no payments when the API omits them', () => {
			expect(mapRepairDto(createMockRepairDto({ moneyTransactions: null })).payments).toEqual([])
		})
	})

	describe('mapCustomerDto', () => {
		it('builds the full name when the API does not send it', () => {
			const dto = { ...createMockRepairDto().customer, fullName: undefined }

			expect(mapCustomerDto(dto).fullName).toBe('Ada Lovelace')
		})

		it('parses the birth date', () => {
			const customer = mapCustomerDto({ ...createMockRepairDto().customer, birthDate: '1990-05-01T03:00:00.000Z' })

			expect(customer.birthDate).toEqual(new Date('1990-05-01T03:00:00.000Z'))
		})
	})

	describe('mapRepairStatusHistoryDto', () => {
		it('maps the entry, preferring the creation date', () => {
			const entry = mapRepairStatusHistoryDto({
				id: 3,
				cost: '10.5',
				price: '20',
				paymentInAdvance: null,
				note: null,
				status: { id: RepairStatusId.IN_PROGRESS, description: 'En progreso' },
				user: null,
				createdAt: '2024-05-02T10:00:00.000Z',
				updatedAt: '2024-05-03T10:00:00.000Z',
			})

			expect(entry.cost).toBe(10.5)
			expect(entry.price).toBe(20)
			expect(entry.paymentInAdvance).toBe(0)
			expect(entry.note).toBe('')
			expect(entry.userName).toBeNull()
			expect(entry.changedAt).toEqual(new Date('2024-05-02T10:00:00.000Z'))
		})

		it('falls back to the update date', () => {
			const entry = mapRepairStatusHistoryDto({
				id: 3,
				cost: 0,
				price: 0,
				paymentInAdvance: 0,
				note: '',
				status: { id: 0, description: 'Ingresado' },
				user: null,
				createdAt: null,
				updatedAt: '2024-05-03T10:00:00.000Z',
			})

			expect(entry.changedAt).toEqual(new Date('2024-05-03T10:00:00.000Z'))
		})
	})

	describe('applyDeviceChanges and applyTrackingChanges', () => {
		it('replaces the device and the issue, resolving the device type', () => {
			const repair = mapRepairDto(createMockRepairDto())

			const changed = applyDeviceChanges(repair, {
				turnedOn: false,
				typeId: 2,
				manufacturer: 'Lenovo',
				model: 'T14',
				deviceId: 'SN-9',
				issue: 'No enciende',
			})

			expect(changed.device).toEqual({
				turnedOn: false,
				manufacturer: 'Lenovo',
				model: 'T14',
				deviceId: 'SN-9',
				type: DEVICE_TYPES[2],
			})
			expect(changed.issue).toBe('No enciende')
			expect(changed.customer).toBe(repair.customer)
		})

		it('keeps the current device type when the id is unknown', () => {
			const repair = mapRepairDto(createMockRepairDto())

			const changed = applyDeviceChanges(repair, {
				turnedOn: true,
				typeId: 99,
				manufacturer: 'X',
				model: 'Y',
				deviceId: '',
				issue: 'Z',
			})

			expect(changed.device.type).toEqual(repair.device.type)
		})

		it('replaces the tracking fields', () => {
			const repair = mapRepairDto(createMockRepairDto())

			const changed = applyTrackingChanges(repair, {
				status: { id: RepairStatusId.FINISHED_AND_PAID, description: 'Finalizada' },
				note: 'Listo',
				price: 900,
				cost: 400,
				paymentInAdvance: 100,
				warrantyTerm: 12,
				payments: [],
			})

			expect(changed.status.id).toBe(RepairStatusId.FINISHED_AND_PAID)
			expect(changed.note).toBe('Listo')
			expect(changed.price).toBe(900)
			expect(changed.warrantyTerm).toBe(12)
			expect(changed.device).toBe(repair.device)
		})
	})

	describe('toRepairWriteDto', () => {
		it('serializes a stored repair with ISO timestamps and its id', () => {
			const repair = mapRepairDto(
				createMockRepairDto({
					id: 9,
					moneyTransactions: [
						{
							id: 4,
							amount: '500.00',
							date: '2024-05-09T10:00:00.000Z',
							paymentMethod: { id: 1, description: 'Efectivo' },
						},
					],
				}),
			)

			const dto = toRepairWriteDto(repair, NOW)

			expect(dto.id).toBe(9)
			expect(dto.checkIn).toBe('2024-05-01T10:00:00.000Z')
			expect(dto.lastUpdate).toBe('2024-05-02T10:00:00.000Z')
			expect(dto.checkOut).toBeNull()
			expect(dto.audit).toEqual({
				deleted: false,
				enabled: true,
				createdAt: '2024-05-01T10:00:00.000Z',
				updatedAt: NOW.toISOString(),
			})
			expect(dto.customer.id).toBe(7)
			expect(dto.device.deviceId).toBe('3569871')
			expect(dto.moneyTransactions).toEqual([
				{ id: 4, amount: 500, date: '2024-05-09T10:00:00.000Z', paymentMethod: { id: 1, description: 'Efectivo' } },
			])
		})

		it('stamps a repair that was never stored with the current time and no id', () => {
			const repair = createRepairFromIntake(createIntake(), 7)

			const dto = toRepairWriteDto(repair, NOW)

			expect(dto).not.toHaveProperty('id')
			expect(dto.checkIn).toBe(NOW.toISOString())
			expect(dto.lastUpdate).toBe(NOW.toISOString())
			expect(dto.audit.createdAt).toBe(NOW.toISOString())
		})

		it('sends an empty device id as null', () => {
			const repair = mapRepairDto(createMockRepairDto({ device: { ...createMockRepairDto().device, deviceId: '' } }))

			expect(toRepairWriteDto(repair, NOW).device.deviceId).toBeNull()
		})
	})

	describe('createRepairFromIntake', () => {
		it('builds an unsaved repair from the intake for the given customer', () => {
			const repair = createRepairFromIntake(createIntake(), 7)

			expect(repair.id).toBeNull()
			expect(repair.customer.id).toBe(7)
			expect(repair.customer.fullName).toBe('Ada Lovelace')
			expect(repair.device.type).toEqual(DEVICE_TYPES[1])
			expect(repair.issue).toBe('No carga')
			expect(repair.price).toBe(500)
			expect(repair.payments).toEqual([])
			expect(repair.checkIn).toBeNull()
		})

		it('falls back to the first device type for an unknown id', () => {
			const intake = createIntake()

			const repair = createRepairFromIntake({ ...intake, device: { ...intake.device, typeId: 99 } }, 7)

			expect(repair.device.type).toEqual(DEVICE_TYPES[0])
		})
	})

	describe('request builders', () => {
		it('builds the customer registration body without an id', () => {
			const body = toCreateCustomerRequest(createIntake().customer)

			expect(body).toEqual({
				dni: 30123456,
				firstName: 'Ada',
				lastName: 'Lovelace',
				email: 'ada@example.com',
				address: 'Calle Falsa 123',
				telephone: '3425551234',
				birthDate: '1990-05-01T03:00:00.000Z',
			})
		})

		it('sends a null birth date when none was captured', () => {
			const body = toCreateCustomerRequest({ ...createIntake().customer, birthDate: null })

			expect(body.birthDate).toBeNull()
		})

		it('builds the user payload from the signed-in user', () => {
			const user = createMockUser({ id: 5, userName: 'recepcion', roles: [{ id: 2, description: 'Mostrador' }] })

			expect(toUserDto(user)).toEqual({
				id: 5,
				userName: 'recepcion',
				firstName: 'Test',
				lastName: 'User',
				avatar: null,
				email: 'test@example.com',
				roles: [{ id: 2, description: 'Mostrador' }],
				hasFinishedRegistration: true,
			})
		})

		it('wraps the repair and the user in the create request', () => {
			const repair = createRepairFromIntake(createIntake(), 7)

			const request = toCreateRepairRequest(repair, createMockUser({ id: 5 }), NOW)

			expect(request.repairToCreate.customer.id).toBe(7)
			expect(request.user.id).toBe(5)
		})

		it('wraps the repair, the user, the flag and the branch in the tracking request', () => {
			const repair = mapRepairDto(createMockRepairDto({ id: 9 }))
			const branch = { id: 3, name: 'Centro', address: '25 de Mayo 3567' }

			const request = toUpdateTrackingInfoRequest(repair, createMockUser({ id: 5 }), true, branch, NOW)

			expect(request.repairToUpdate.id).toBe(9)
			expect(request.user.id).toBe(5)
			expect(request.generateTransaction).toBe(true)
			expect(request.officeBranch).toEqual(branch)
		})
	})
})
