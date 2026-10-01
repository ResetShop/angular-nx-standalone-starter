import { makeEnvironmentProviders } from '@angular/core'
import { DEVICE_TYPES } from '@contracts/repair/device-type.constants'
import { RepairStatusId } from '@contracts/repair/repair-status.constants'
import type {
	CreateRepairRequest,
	CreateRepairResponse,
	DeleteRepairResponse,
	RepairDto,
	RepairsByDateParams,
	RepairStatusDto,
	RepairStatusHistoryDto,
	RepairWriteDto,
	UpdateTrackingInfoRequest,
} from '@contracts/repair/repair.types'
import { isFinishedStatus } from '@domain/repair/repair.functions'
import { type Observable, of, throwError } from 'rxjs'
import type { RepairApi } from './repair.interface'
import { RepairApi as RepairApiToken } from './repair.interface'

/**
 * Builds a stored repair with sensible defaults; override only what a test cares about.
 */
export function createMockRepairDto(overrides: Partial<RepairDto> = {}): RepairDto {
	return {
		id: 1,
		customer: {
			id: 7,
			dni: 30123456,
			firstName: 'Ada',
			lastName: 'Lovelace',
			fullName: 'Ada Lovelace',
			email: 'ada@example.com',
			birthDate: null,
			address: 'Calle Falsa 123',
			telephone: '3425551234',
		},
		device: { turnedOn: true, manufacturer: 'Samsung', model: 'S21', deviceId: '3569871', type: DEVICE_TYPES[0] },
		note: '',
		issue: 'Pantalla rota',
		status: { id: RepairStatusId.ENTERED, description: 'Ingresado' },
		audit: {
			deleted: false,
			enabled: true,
			createdAt: '2024-05-01T10:00:00.000Z',
			updatedAt: '2024-05-01T10:00:00.000Z',
		},
		user: null,
		checkIn: '2024-05-01T10:00:00.000Z',
		lastUpdate: '2024-05-02T10:00:00.000Z',
		checkOut: null,
		paymentInAdvance: '0.00',
		price: '0.00',
		cost: '0.00',
		warrantyTerm: 3,
		moneyTransactions: [],
		...overrides,
	}
}

export const MOCK_REPAIR_STATUSES: RepairStatusDto[] = [
	{ id: RepairStatusId.ENTERED, description: 'Ingresado' },
	{ id: RepairStatusId.IN_PROGRESS, description: 'En progreso' },
	{ id: RepairStatusId.READY_FOR_DELIVER, description: 'Listo para entregar' },
	{ id: RepairStatusId.FINISHED_AND_PAID, description: 'Finalizada y abonada' },
]

export class InMemoryRepairApi implements RepairApi {
	private repairs: RepairDto[] = []
	private history = new Map<number, RepairStatusHistoryDto[]>()
	private nextId = 1
	private errors = new Map<string, Error>()

	public setError(method: keyof RepairApi, error: Error): void {
		this.errors.set(method, error)
	}

	public clearErrors(): void {
		this.errors.clear()
	}

	public seed(repairs: RepairDto[], history: Map<number, RepairStatusHistoryDto[]> = new Map()): void {
		this.repairs = [...repairs]
		this.history = new Map(history)
		this.nextId = Math.max(0, ...repairs.map((repair) => repair.id)) + 1
	}

	public getAll(showFinished: boolean): Observable<RepairDto[]> {
		const error = this.errors.get('getAll')
		if (error) return throwError(() => error)
		return of(this.repairs.filter((repair) => showFinished || !isFinishedStatus(repair.status.id)))
	}

	public getAllByDate({ dateFrom, dateTo, showFinished }: RepairsByDateParams): Observable<RepairDto[]> {
		const error = this.errors.get('getAllByDate')
		if (error) return throwError(() => error)
		const inRange = this.repairs.filter((repair) => {
			const checkIn = repair.checkIn ? new Date(repair.checkIn) : null
			return checkIn !== null && checkIn >= dateFrom && checkIn <= dateTo
		})
		return of(inRange.filter((repair) => showFinished || !isFinishedStatus(repair.status.id)))
	}

	public getById(id: number): Observable<RepairDto> {
		const error = this.errors.get('getById')
		if (error) return throwError(() => error)
		const found = this.repairs.find((repair) => repair.id === id)
		return found ? of(found) : throwError(() => new Error(`Repair ${id} not found`))
	}

	public getHistory(id: number): Observable<RepairStatusHistoryDto[]> {
		const error = this.errors.get('getHistory')
		if (error) return throwError(() => error)
		return of(this.history.get(id) ?? [])
	}

	public getByClientId(clientId: number): Observable<RepairDto[]> {
		const error = this.errors.get('getByClientId')
		if (error) return throwError(() => error)
		return of(this.repairs.filter((repair) => repair.customer.id === clientId))
	}

	public create(body: CreateRepairRequest): Observable<CreateRepairResponse> {
		const error = this.errors.get('create')
		if (error) return throwError(() => error)
		const id = this.nextId++
		this.repairs = [...this.repairs, { ...createMockRepairDto(), ...body.repairToCreate, id, user: body.user }]
		return of({ id })
	}

	public updateDeviceInfo(body: RepairWriteDto): Observable<unknown> {
		const error = this.errors.get('updateDeviceInfo')
		if (error) return throwError(() => error)
		this.repairs = this.repairs.map((repair) =>
			repair.id === body.id ? { ...repair, device: body.device, issue: body.issue } : repair,
		)
		return of([1])
	}

	public updateTrackingInfo(body: UpdateTrackingInfoRequest): Observable<unknown[]> {
		const error = this.errors.get('updateTrackingInfo')
		if (error) return throwError(() => error)
		const { repairToUpdate } = body
		this.repairs = this.repairs.map((repair) =>
			repair.id === repairToUpdate.id
				? {
						...repair,
						status: repairToUpdate.status,
						note: repairToUpdate.note,
						price: repairToUpdate.price,
						cost: repairToUpdate.cost,
						paymentInAdvance: repairToUpdate.paymentInAdvance,
						warrantyTerm: repairToUpdate.warrantyTerm,
						moneyTransactions: repairToUpdate.moneyTransactions,
					}
				: repair,
		)
		return of([1])
	}

	public delete(id: number): Observable<DeleteRepairResponse> {
		const error = this.errors.get('delete')
		if (error) return throwError(() => error)
		this.repairs = this.repairs.filter((repair) => repair.id !== id)
		return of({ response: `Deleted repair with id ${id}` })
	}

	public getStatuses(): Observable<RepairStatusDto[]> {
		const error = this.errors.get('getStatuses')
		if (error) return throwError(() => error)
		return of(MOCK_REPAIR_STATUSES)
	}
}

export function provideRepairMock(api: InMemoryRepairApi = new InMemoryRepairApi()) {
	return makeEnvironmentProviders([{ provide: RepairApiToken, useValue: api }])
}
