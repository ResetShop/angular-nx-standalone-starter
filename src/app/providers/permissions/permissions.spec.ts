import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import type { PaginatedResponse } from '@contracts/common/pagination.types'
import { QUERY_DEFAULTS } from '@contracts/common/query.constants'
import type { PermissionData } from '@contracts/role/role.types'
import { PermissionsApiService } from './permissions'

describe('PermissionsApiService', () => {
	let service: PermissionsApiService
	let httpMock: HttpTestingController

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [PermissionsApiService, provideHttpClient(), provideHttpClientTesting()],
		})

		service = TestBed.inject(PermissionsApiService)
		httpMock = TestBed.inject(HttpTestingController)
	})

	afterEach(() => {
		httpMock.verify()
	})

	describe('getAllUnpaginated', () => {
		it('should make GET request to /api/access/permissions with max limit', () => {
			const mockPermission: PermissionData = {
				id: 1,
				name: 'Read Users',
				description: null,
				resource: 'users',
				action: 'read',
			}
			const mockResponse: PaginatedResponse<PermissionData> = {
				data: [mockPermission],
				total: 1,
				offset: 0,
				limit: QUERY_DEFAULTS.MAX_LIMIT,
			}

			service.getAllUnpaginated().subscribe((result) => {
				expect(result).toEqual([mockPermission])
			})

			const req = httpMock.expectOne(
				(r) =>
					r.url === '/api/access/permissions' &&
					r.params.get('limit') === String(QUERY_DEFAULTS.MAX_LIMIT) &&
					r.params.get('offset') === '0',
			)
			expect(req.request.method).toBe('GET')

			req.flush(mockResponse)
		})

		it('should extract data array from paginated response', () => {
			const permissions: PermissionData[] = [
				{ id: 1, name: 'Read Users', description: null, resource: 'users', action: 'read' },
				{ id: 2, name: 'Write Users', description: 'Can write users', resource: 'users', action: 'write' },
			]
			const mockResponse: PaginatedResponse<PermissionData> = {
				data: permissions,
				total: 2,
				offset: 0,
				limit: QUERY_DEFAULTS.MAX_LIMIT,
			}

			service.getAllUnpaginated().subscribe((result) => {
				expect(result).toHaveLength(2)
				expect(result).toEqual(permissions)
			})

			const req = httpMock.expectOne((r) => r.url === '/api/access/permissions')
			req.flush(mockResponse)
		})
	})

	describe('error handling', () => {
		it('should propagate HTTP errors', () => {
			service.getAllUnpaginated().subscribe({
				next: () => expect.unreachable('should have failed'),
				error: (error) => {
					expect(error.status).toBe(500)
				},
			})

			const req = httpMock.expectOne((r) => r.url === '/api/access/permissions')
			req.flush(null, { status: 500, statusText: 'Internal Server Error' })
		})
	})
})
