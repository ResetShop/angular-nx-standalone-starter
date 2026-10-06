import { makeEnvironmentProviders } from '@angular/core'
import type { ManagedUser, UpdateUserRequest } from '@contracts/user/user.types'
import { type Observable, of, throwError } from 'rxjs'
import type { ManagedUsersApi } from './managed-users.interface'
import { ManagedUsersApi as ManagedUsersApiToken } from './managed-users.interface'

export class InMemoryManagedUsersApi implements ManagedUsersApi {
	private users: ManagedUser[] = []
	private errors = new Map<string, Error>()

	public setError(method: keyof ManagedUsersApi, error: Error): void {
		this.errors.set(method, error)
	}

	public clearErrors(): void {
		this.errors.clear()
	}

	public seed(users: ManagedUser[]): void {
		this.users = [...users]
	}

	public getAll(): Observable<ManagedUser[]> {
		const error = this.errors.get('getAll')
		return error ? throwError(() => error) : of([...this.users])
	}

	public update(id: number, body: UpdateUserRequest): Observable<ManagedUser> {
		const error = this.errors.get('update')
		if (error) return throwError(() => error)
		const current = this.users.find((user) => user.id === id)
		if (!current) return throwError(() => new Error(`User ${id} not found`))
		// Roles are not modelled by this in-memory API: only the profile fields and the status change.
		const fields = Object.fromEntries(Object.entries(body).filter(([key]) => key !== 'roleIds'))
		const updated: ManagedUser = { ...current, ...fields }
		this.users = this.users.map((user) => (user.id === id ? updated : user))
		return of(updated)
	}

	public resetPassword(id: number): Observable<unknown> {
		const error = this.errors.get('resetPassword')
		if (error) return throwError(() => error)
		if (!this.users.some((user) => user.id === id)) return throwError(() => new Error(`User ${id} not found`))
		return of({ message: 'Password reset successfully' })
	}

	public delete(id: number): Observable<unknown> {
		const error = this.errors.get('delete')
		if (error) return throwError(() => error)
		this.users = this.users.filter((user) => user.id !== id)
		return of(null)
	}
}

export function provideManagedUsersMock(api: InMemoryManagedUsersApi = new InMemoryManagedUsersApi()) {
	return makeEnvironmentProviders([{ provide: ManagedUsersApiToken, useValue: api }])
}
