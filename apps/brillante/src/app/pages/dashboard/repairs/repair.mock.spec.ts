import { TestBed } from '@angular/core/testing'
import { RepairStatusId } from '@contracts/repair/repair-status.constants'
import type { RepairWriteDto, UpdateTrackingInfoRequest } from '@contracts/repair/repair.types'
import { mapRepairDto, toCreateRepairRequest, toRepairWriteDto, toUserDto } from '@domain/repair/repair.mapper'
import { createMockUser } from '@mocks/user.mock'
import type { Observable } from 'rxjs'
import { RepairApi } from './repair.interface'
import { createMockRepairDto, InMemoryRepairApi, MOCK_REPAIR_STATUSES, provideRepairMock } from './repair.mock'

function collect<T>(source: Observable<T>) {
	const result: { value?: T; error?: Error } = {}
	source.subscribe({ next: (value) => (result.value = value), error: (err) => (result.error = err) })
	return result
}

describe('InMemoryRepairApi', () => {
	let api: InMemoryRepairApi

	beforeEach(() => {
		api = new InMemoryRepairApi()
		api.seed([
			createMockRepairDto({ id: 1 }),
			createMockRepairDto({
				id: 2,
				status: { id: RepairStatusId.FINISHED_AND_PAID, description: 'Finalizada' },
				checkIn: '2024-06-01T10:00:00.000Z',
			}),
		])
	})

	it('hides the finished repairs unless asked for them', () => {
		expect(collect(api.getAll(false)).value?.map((repair) => repair.id)).toEqual([1])
		expect(collect(api.getAll(true)).value?.map((repair) => repair.id)).toEqual([1, 2])
	})

	it('filters by check-in date', () => {
		const result = collect(
			api.getAllByDate({ dateFrom: new Date('2024-05-30'), dateTo: new Date('2024-06-05'), showFinished: true }),
		)

		expect(result.value?.map((repair) => repair.id)).toEqual([2])
	})

	it('finds a repair by id and fails for an unknown one', () => {
		expect(collect(api.getById(1)).value?.id).toBe(1)
		expect(collect(api.getById(99)).error?.message).toBe('Repair 99 not found')
	})

	it('serves the history and the statuses', () => {
		expect(collect(api.getHistory(1)).value).toEqual([])
		expect(collect(api.getStatuses()).value).toEqual(MOCK_REPAIR_STATUSES)
	})

	it('finds the repairs of a customer', () => {
		expect(collect(api.getByClientId(7)).value).toHaveLength(2)
		expect(collect(api.getByClientId(99)).value).toEqual([])
	})

	it('creates a repair with the next id', () => {
		const repair = mapRepairDto(createMockRepairDto())
		const request = toCreateRepairRequest({ ...repair, id: null }, createMockUser())

		expect(collect(api.create(request)).value).toEqual({ id: 3 })
		expect(collect(api.getById(3)).value?.id).toBe(3)
	})

	it('updates the device info and the tracking', () => {
		const stored = mapRepairDto(createMockRepairDto({ id: 1 }))
		const device: RepairWriteDto = { ...toRepairWriteDto(stored), issue: 'Nuevo problema' }
		const tracking: UpdateTrackingInfoRequest = {
			repairToUpdate: { ...toRepairWriteDto(stored), note: 'Listo', price: 900 },
			user: toUserDto(createMockUser()),
			generateTransaction: false,
			officeBranch: null,
		}

		api.updateDeviceInfo(device).subscribe()
		api.updateTrackingInfo(tracking).subscribe()

		const updated = collect(api.getById(1)).value
		expect(updated?.issue).toBe('Nuevo problema')
		expect(updated?.note).toBe('Listo')
		expect(updated?.price).toBe(900)
	})

	it('deletes a repair', () => {
		api.delete(1).subscribe()

		expect(collect(api.getById(1)).error).toBeDefined()
	})

	it('fails a method once an error is set and recovers when cleared', () => {
		api.setError('getAll', new Error('boom'))
		expect(collect(api.getAll(true)).error?.message).toBe('boom')

		api.clearErrors()
		expect(collect(api.getAll(true)).value).toHaveLength(2)
	})

	it('is wired through provideRepairMock', () => {
		TestBed.configureTestingModule({ providers: [provideRepairMock(api)] })

		expect(TestBed.inject(RepairApi)).toBe(api)
	})
})
