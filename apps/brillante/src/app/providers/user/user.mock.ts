import { makeEnvironmentProviders } from '@angular/core'
import type { CustomerDto } from '@contracts/client/client.types'
import type { CreateUserRequest, UpdateUserRequest, UserDto } from '@contracts/user/legacy-user.types'
import { type Observable, of, throwError } from 'rxjs'
import type { UserApi } from './user.interface'
import { UserApi as UserApiToken } from './user.interface'

export class InMemoryUserApi implements UserApi {
	private users: UserDto[] = []
	private nextId = 1
	private errors = new Map<string, Error>()

	public setError(method: keyof UserApi, error: Error): void {
		this.errors.set(method, error)
	}

	public clearErrors(): void {
		this.errors.clear()
	}

	public seed(users: UserDto[]): void {
		this.users = [...users]
		this.nextId = Math.max(0, ...users.map((user) => user.id)) + 1
	}

	public getAll(): Observable<UserDto[]> {
		const error = this.errors.get('getAll')
		return error ? throwError(() => error) : of([...this.users])
	}

	public getById(id: number): Observable<UserDto> {
		const error = this.errors.get('getById')
		if (error) return throwError(() => error)
		const found = this.users.find((user) => user.id === id)
		return found ? of(found) : throwError(() => new Error(`User ${id} not found`))
	}

	public register(body: CreateUserRequest): Observable<UserDto> {
		const error = this.errors.get('register')
		if (error) return throwError(() => error)
		const created: UserDto = { id: this.nextId++, avatar: null, hasFinishedRegistration: false, ...body }
		this.users = [...this.users, created]
		return of(created)
	}

	public update(body: UpdateUserRequest): Observable<unknown> {
		const error = this.errors.get('update')
		if (error) return throwError(() => error)
		this.users = this.users.map((user) => (user.id === body.id ? { ...user, ...body } : user))
		return of([1])
	}

	public updateCustomerUser(user: Partial<UserDto>, customer: Partial<CustomerDto>): Observable<UserDto> {
		const error = this.errors.get('updateCustomerUser')
		if (error) return throwError(() => error)
		const current = this.users.find((candidate) => candidate.id === user.id)
		const updated = { ...current, ...user, customer: { ...current?.customer, ...customer } } as UserDto
		this.users = this.users.map((candidate) => (candidate.id === updated.id ? updated : candidate))
		return of(updated)
	}

	public delete(id: number): Observable<unknown> {
		const error = this.errors.get('delete')
		if (error) return throwError(() => error)
		this.users = this.users.filter((user) => user.id !== id)
		return of(undefined)
	}
}

export function provideUserMock(api: InMemoryUserApi = new InMemoryUserApi()) {
	return makeEnvironmentProviders([{ provide: UserApiToken, useValue: api }])
}
