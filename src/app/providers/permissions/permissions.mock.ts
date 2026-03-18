import type { Provider } from '@angular/core'
import type { PermissionData } from '@contracts/role/role.types'
import type { Observable } from 'rxjs'
import { of, throwError } from 'rxjs'
import type { PermissionsApi } from './permissions.interface'
import { PermissionsApi as PermissionsApiToken } from './permissions.interface'

export function createMockPermissionData(overrides: Partial<PermissionData> = {}): PermissionData {
	return {
		id: 1,
		name: 'Read Users',
		description: null,
		resource: 'users',
		action: 'read',
		...overrides,
	}
}

export class InMemoryPermissionsApi implements PermissionsApi {
	private permissions: PermissionData[] = []
	private errors = new Map<string, Error>()

	public addPermission(permission: PermissionData): void {
		this.permissions.push(permission)
	}

	public setPermissions(permissions: PermissionData[]): void {
		this.permissions = [...permissions]
	}

	public clear(): void {
		this.permissions = []
		this.errors.clear()
	}

	public setError(method: keyof PermissionsApi, error: Error): void {
		this.errors.set(method, error)
	}

	public clearErrors(): void {
		this.errors.clear()
	}

	public getAllUnpaginated(): Observable<PermissionData[]> {
		const error = this.errors.get('getAllUnpaginated')
		if (error) {
			return throwError(() => error)
		}

		return of([...this.permissions])
	}
}

export const providePermissionsMock = (api: InMemoryPermissionsApi = new InMemoryPermissionsApi()): Provider[] => [
	{ provide: PermissionsApiToken, useValue: api },
]
