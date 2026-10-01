import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import type { CreateRepairRequest, RepairWriteDto, UpdateTrackingInfoRequest } from '@contracts/repair/repair.types'
import { environment } from '../../environments/environment'
import { HttpRepairApi } from './repair'
import { createMockRepairDto } from './repair.mock'

const BASE_URL = `${environment.apiUrl}/repair`

describe('HttpRepairApi', () => {
	let api: HttpRepairApi
	let httpMock: HttpTestingController

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [HttpRepairApi, provideHttpClient(), provideHttpClientTesting()],
		})
		api = TestBed.inject(HttpRepairApi)
		httpMock = TestBed.inject(HttpTestingController)
	})

	afterEach(() => {
		httpMock.verify()
	})

	describe('getAll', () => {
		it('requests the repairs with the showFinished flag', () => {
			const repairs = [createMockRepairDto()]
			let result: unknown

			api.getAll(true).subscribe((value) => (result = value))

			const req = httpMock.expectOne((r) => r.url === BASE_URL)
			expect(req.request.method).toBe('GET')
			expect(req.request.params.get('showFinished')).toBe('true')
			req.flush(repairs)
			expect(result).toEqual(repairs)
		})

		it('sends showFinished=false for the default list', () => {
			api.getAll(false).subscribe()

			const req = httpMock.expectOne((r) => r.url === BASE_URL)
			expect(req.request.params.get('showFinished')).toBe('false')
			req.flush([])
		})
	})

	describe('getAllByDate', () => {
		it('requests the range with the whole first and last day', () => {
			api.getAllByDate({ dateFrom: new Date(2024, 0, 5), dateTo: new Date(2024, 1, 9), showFinished: true }).subscribe()

			const req = httpMock.expectOne((r) => r.url === `${BASE_URL}/byDate`)
			expect(req.request.method).toBe('GET')
			expect(req.request.params.get('showFinished')).toBe('true')
			expect(req.request.params.get('startDate')).toBe('2024-01-05 00:00:00')
			expect(req.request.params.get('endDate')).toBe('2024-02-09 23:59:59')
			req.flush([])
		})
	})

	describe('reads by id', () => {
		it('gets a repair', () => {
			api.getById(12).subscribe()

			const req = httpMock.expectOne(`${BASE_URL}/12`)
			expect(req.request.method).toBe('GET')
			req.flush(createMockRepairDto({ id: 12 }))
		})

		it('gets the status history of a repair', () => {
			api.getHistory(12).subscribe()

			const req = httpMock.expectOne(`${BASE_URL}/history/12`)
			expect(req.request.method).toBe('GET')
			req.flush([])
		})

		it('gets the repairs of a customer', () => {
			api.getByClientId(7).subscribe()

			const req = httpMock.expectOne(`${BASE_URL}/getByClientId/7`)
			expect(req.request.method).toBe('GET')
			req.flush([])
		})

		it('gets the status catalogue', () => {
			let result: unknown

			api.getStatuses().subscribe((value) => (result = value))

			const req = httpMock.expectOne(`${BASE_URL}/getStatusData`)
			expect(req.request.method).toBe('GET')
			req.flush([{ id: 0, description: 'Ingresado' }])
			expect(result).toEqual([{ id: 0, description: 'Ingresado' }])
		})
	})

	describe('writes', () => {
		const repairToCreate = {} as RepairWriteDto

		it('posts the repair and the user to create', () => {
			const body = { repairToCreate, user: {} } as CreateRepairRequest
			let result: unknown

			api.create(body).subscribe((value) => (result = value))

			const req = httpMock.expectOne(`${BASE_URL}/create`)
			expect(req.request.method).toBe('POST')
			expect(req.request.body).toBe(body)
			req.flush({ id: 41 })
			expect(result).toEqual({ id: 41 })
		})

		it('puts the repair to update the device info', () => {
			api.updateDeviceInfo(repairToCreate).subscribe()

			const req = httpMock.expectOne(`${BASE_URL}/updateDeviceInfo`)
			expect(req.request.method).toBe('PUT')
			expect(req.request.body).toBe(repairToCreate)
			req.flush([1])
		})

		it('puts the tracking request to update the tracking info', () => {
			const body = { repairToUpdate: repairToCreate, generateTransaction: true } as UpdateTrackingInfoRequest

			api.updateTrackingInfo(body).subscribe()

			const req = httpMock.expectOne(`${BASE_URL}/updateTrackingInfo`)
			expect(req.request.method).toBe('PUT')
			expect(req.request.body).toBe(body)
			req.flush([1])
		})

		it('deletes a repair', () => {
			let result: unknown

			api.delete(12).subscribe((value) => (result = value))

			const req = httpMock.expectOne(`${BASE_URL}/remove/12`)
			expect(req.request.method).toBe('DELETE')
			req.flush({ response: 'Deleted repair with id 12' })
			expect(result).toEqual({ response: 'Deleted repair with id 12' })
		})
	})
})
