import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'
import { UserStatus } from '@contracts/user/user.constants'
import { createManagedUserDto } from '@domain/user/managed-user.mock'
import { logger } from '@resetshop/util'
import { spyOn } from '@resetshop/util/test-utils'
import { HttpManagedUsersApi } from './managed-users'

describe('HttpManagedUsersApi', () => {
	let api: HttpManagedUsersApi
	let httpMock: HttpTestingController

	beforeEach(() => {
		TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] })
		api = TestBed.inject(HttpManagedUsersApi)
		httpMock = TestBed.inject(HttpTestingController)
	})

	afterEach(() => {
		httpMock.verify()
	})

	it('requests the largest page and unwraps the users', () => {
		let received: unknown
		api.getAll().subscribe((users) => (received = users))

		const req = httpMock.expectOne((request) => request.url === '/api/users')
		expect(req.request.method).toBe('GET')
		expect(req.request.params.get('limit')).toBe('500')
		req.flush({ data: [createManagedUserDto()], total: 1, offset: 0, limit: 500 })

		expect(received).toEqual([createManagedUserDto()])
	})

	it('warns when the backend holds more users than one page', () => {
		const warn = spyOn(logger, 'warn')
		api.getAll().subscribe()

		httpMock
			.expectOne((request) => request.url === '/api/users')
			.flush({ data: [createManagedUserDto()], total: 501, offset: 0, limit: 500 })

		expect(warn.calls).toHaveLength(1)
	})

	it('patches a user with the changed fields', () => {
		api.update(7, { status: UserStatus.DISABLED }).subscribe()

		const req = httpMock.expectOne('/api/users/7')
		expect(req.request.method).toBe('PATCH')
		expect(req.request.body).toEqual({ status: 'disabled' })
		req.flush(createManagedUserDto({ id: 7 }))
	})

	it('posts a password reset for a user', () => {
		api.resetPassword(7).subscribe()

		const req = httpMock.expectOne('/api/users/7/reset-password')
		expect(req.request.method).toBe('POST')
		req.flush({ message: 'Password reset successfully' })
	})

	it('deletes a user', () => {
		api.delete(7).subscribe()

		const req = httpMock.expectOne('/api/users/7')
		expect(req.request.method).toBe('DELETE')
		req.flush(null)
	})
})
