import type { Provider } from '@angular/core'
import type { PaginatedResponse, SearchPaginationParams } from '@contracts/common/pagination.types'
import type {
	AssignPermissionsRequest,
	CreateRoleRequest,
	PermissionData,
	RoleData,
	RoleWithPermissions,
	UpdateRoleRequest,
} from '@contracts/role/role.types'
import type { Observable } from 'rxjs'
import { of, throwError } from 'rxjs'
import type { RolesApi } from './roles.interface'
import { RolesApi as RolesApiToken } from './roles.interface'

export function createMockRoleData(overrides: Partial<RoleData> = {}): RoleData {
	return {
		id: 1,
		name: 'Admin',
		code: 'admin',
		description: null,
		removable: true,
		createdAt: new Date('2025-01-01'),
		updatedAt: new Date('2025-01-01'),
		...overrides,
	}
}

export function createMockRoleWithPermissions(overrides: Partial<RoleWithPermissions> = {}): RoleWithPermissions {
	return {
		id: 1,
		code: 'admin',
		name: 'Admin',
		description: null,
		removable: true,
		createdAt: new Date('2025-01-01'),
		updatedAt: new Date('2025-01-01'),
		permissions: [{ id: 1, name: 'Read Users', description: null, resource: 'users', action: 'read' }],
		...overrides,
	}
}

export class InMemoryRolesApi implements RolesApi {
	private roles = new Map<number, RoleData>()
	private rolePermissions = new Map<number, PermissionData[]>()
	private errors = new Map<string, Error>()
	private nextId = 100

	public addRole(role: RoleData): void {
		this.roles.set(role.id, role)
	}

	public addRoleWithPermissions(role: RoleData, permissions: PermissionData[]): void {
		this.roles.set(role.id, role)
		this.rolePermissions.set(role.id, permissions)
	}

	public clear(): void {
		this.roles.clear()
		this.rolePermissions.clear()
		this.errors.clear()
	}

	public setError(method: keyof RolesApi, error: Error): void {
		this.errors.set(method, error)
	}

	public clearErrors(): void {
		this.errors.clear()
	}

	public getAll(params?: SearchPaginationParams): Observable<PaginatedResponse<RoleData>> {
		const error = this.errors.get('getAll')
		if (error) {
			return throwError(() => error)
		}

		let data = [...this.roles.values()]

		if (params?.search) {
			const search = params.search.toLowerCase()
			data = data.filter((r) => r.name.toLowerCase().includes(search) || r.code.toLowerCase().includes(search))
		}

		const total = data.length
		const offset = params?.offset ?? 0
		const limit = params?.limit ?? 10
		const page = data.slice(offset, offset + limit)

		return of({ data: page, total, offset, limit })
	}

	public getAllUnpaginated(): Observable<RoleData[]> {
		const error = this.errors.get('getAllUnpaginated')
		if (error) {
			return throwError(() => error)
		}

		return of([...this.roles.values()])
	}

	public getByIdWithPermissions(id: number): Observable<RoleWithPermissions> {
		const error = this.errors.get('getByIdWithPermissions')
		if (error) {
			return throwError(() => error)
		}

		const role = this.roles.get(id)
		if (!role) {
			return throwError(() => new Error(`Role ${id} not found`))
		}

		const permissions = this.rolePermissions.get(id) ?? []
		return of({ ...role, permissions })
	}

	public create(body: CreateRoleRequest): Observable<RoleData> {
		const error = this.errors.get('create')
		if (error) {
			return throwError(() => error)
		}

		const id = this.nextId++
		const role: RoleData = {
			id,
			name: body.name,
			code: body.code,
			description: body.description ?? null,
			removable: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		}
		this.roles.set(id, role)
		return of(role)
	}

	public update(id: number, body: UpdateRoleRequest): Observable<RoleData> {
		const error = this.errors.get('update')
		if (error) {
			return throwError(() => error)
		}

		const role = this.roles.get(id)
		if (!role) {
			return throwError(() => new Error(`Role ${id} not found`))
		}

		const updated = { ...role, ...body, updatedAt: new Date() }
		this.roles.set(id, updated)
		return of(updated)
	}

	public delete(id: number): Observable<void> {
		const error = this.errors.get('delete')
		if (error) {
			return throwError(() => error)
		}

		this.roles.delete(id)
		this.rolePermissions.delete(id)
		return of(undefined)
	}

	public assignPermissions(id: number, body: AssignPermissionsRequest): Observable<void> {
		const error = this.errors.get('assignPermissions')
		if (error) {
			return throwError(() => error)
		}

		const permissions = body.permissionIds.map((pid) => ({
			id: pid,
			name: `Permission ${pid}`,
			description: null,
			resource: 'unknown',
			action: 'unknown',
		}))
		this.rolePermissions.set(id, permissions)
		return of(undefined)
	}
}

export const provideRolesMock = (api: InMemoryRolesApi = new InMemoryRolesApi()): Provider[] => [
	{ provide: RolesApiToken, useValue: api },
]
