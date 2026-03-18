import type { Provider } from '@angular/core'
import type { PaginatedResponse, SearchPaginationParams } from '@contracts/common/pagination.types'
import { UserStatus } from '@contracts/user/user.constants'
import type {
	CreateUserRequest,
	CreateUserResponse,
	ManagedUser,
	UpdateUserRequest,
	UpdateUserStatusRequest,
} from '@contracts/user/user.types'
import type { Observable } from 'rxjs'
import { of, throwError } from 'rxjs'
import type { UsersApi } from './users.interface'
import { UsersApi as UsersApiToken } from './users.interface'

export function createMockManagedUser(overrides: Partial<ManagedUser> = {}): ManagedUser {
	return {
		id: 1,
		email: 'john@example.com',
		firstName: 'John',
		lastName: 'Doe',
		status: UserStatus.ACTIVE,
		statusChangedAt: null,
		statusChangedBy: null,
		deletedAt: null,
		createdAt: new Date('2025-01-01'),
		updatedAt: new Date('2025-01-01'),
		roles: [
			{
				id: 1,
				name: 'Admin',
				code: 'admin',
				description: null,
				removable: true,
				createdAt: null,
				updatedAt: null,
			},
		],
		...overrides,
	}
}

export class InMemoryUsersApi implements UsersApi {
	private users = new Map<number, ManagedUser>()
	private errors = new Map<string, Error>()
	private nextId = 100

	public addUser(user: ManagedUser): void {
		this.users.set(user.id, user)
	}

	public clear(): void {
		this.users.clear()
		this.errors.clear()
	}

	public setError(method: keyof UsersApi, error: Error): void {
		this.errors.set(method, error)
	}

	public clearErrors(): void {
		this.errors.clear()
	}

	public getAll(params?: SearchPaginationParams): Observable<PaginatedResponse<ManagedUser>> {
		const error = this.errors.get('getAll')
		if (error) {
			return throwError(() => error)
		}

		let data = [...this.users.values()]

		if (params?.search) {
			const search = params.search.toLowerCase()
			data = data.filter(
				(u) =>
					u.firstName.toLowerCase().includes(search) ||
					u.lastName.toLowerCase().includes(search) ||
					u.email.toLowerCase().includes(search),
			)
		}

		const total = data.length
		const offset = params?.offset ?? 0
		const limit = params?.limit ?? 10
		const page = data.slice(offset, offset + limit)

		return of({ data: page, total, offset, limit })
	}

	public getById(id: number): Observable<ManagedUser> {
		const error = this.errors.get('getById')
		if (error) {
			return throwError(() => error)
		}

		const user = this.users.get(id)
		if (!user) {
			return throwError(() => new Error(`User ${id} not found`))
		}
		return of(user)
	}

	public create(body: CreateUserRequest): Observable<CreateUserResponse> {
		const error = this.errors.get('create')
		if (error) {
			return throwError(() => error)
		}

		const id = this.nextId++
		const user: ManagedUser = {
			id,
			email: body.email,
			firstName: body.firstName,
			lastName: body.lastName,
			status: UserStatus.ACTIVE,
			statusChangedAt: null,
			statusChangedBy: null,
			deletedAt: null,
			createdAt: new Date(),
			updatedAt: new Date(),
			roles: [],
		}
		this.users.set(id, user)
		return of({ ...user, passwordEmailSent: true })
	}

	public update(id: number, body: UpdateUserRequest): Observable<ManagedUser> {
		const error = this.errors.get('update')
		if (error) {
			return throwError(() => error)
		}

		const user = this.users.get(id)
		if (!user) {
			return throwError(() => new Error(`User ${id} not found`))
		}

		const updated = { ...user, ...body, updatedAt: new Date() }
		this.users.set(id, updated)
		return of(updated)
	}

	public delete(id: number): Observable<void> {
		const error = this.errors.get('delete')
		if (error) {
			return throwError(() => error)
		}

		this.users.delete(id)
		return of(undefined)
	}

	public updateStatus(id: number, body: UpdateUserStatusRequest): Observable<ManagedUser> {
		const error = this.errors.get('updateStatus')
		if (error) {
			return throwError(() => error)
		}

		const user = this.users.get(id)
		if (!user) {
			return throwError(() => new Error(`User ${id} not found`))
		}

		const updated = { ...user, status: body.status, statusChangedAt: new Date(), updatedAt: new Date() }
		this.users.set(id, updated)
		return of(updated)
	}
}

export const provideUsersMock = (api: InMemoryUsersApi = new InMemoryUsersApi()): Provider[] => [
	{ provide: UsersApiToken, useValue: api },
]
