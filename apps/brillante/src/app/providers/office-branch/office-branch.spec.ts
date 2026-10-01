import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { clearAllMocks } from '@resetshop/util/test-utils'
import { environment } from '../../environments/environment'
import { HttpOfficeBranchApi } from './office-branch'

describe('HttpOfficeBranchApi', () => {
	let api: HttpOfficeBranchApi
	let httpMock: HttpTestingController

	beforeEach(() => {
		clearAllMocks()
		TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] })
		api = TestBed.inject(HttpOfficeBranchApi)
		httpMock = TestBed.inject(HttpTestingController)
	})

	afterEach(() => {
		httpMock.verify()
	})

	it('reads every branch from /office-branch/getAll', () => {
		const branches = [{ id: 1, name: 'Centro', address: 'San Martín 100' }]
		let result: unknown

		api.getAll().subscribe((value) => (result = value))

		const req = httpMock.expectOne(`${environment.apiUrl}/office-branch/getAll`)
		expect(req.request.method).toBe('GET')
		req.flush(branches)
		expect(result).toEqual(branches)
	})

	it('creates a branch with POST /office-branch/create', () => {
		const body = { name: 'Norte', address: 'Belgrano 200' }

		api.create(body).subscribe()

		const req = httpMock.expectOne(`${environment.apiUrl}/office-branch/create`)
		expect(req.request.method).toBe('POST')
		expect(req.request.body).toEqual(body)
		req.flush({ id: 2, ...body })
	})
})
