import { makeEnvironmentProviders } from '@angular/core'
import type { CreateOfficeBranchRequest, OfficeBranchDto } from '@contracts/office-branch/office-branch.types'
import { type Observable, of, throwError } from 'rxjs'
import type { OfficeBranchApi } from './office-branch.interface'
import { OfficeBranchApi as OfficeBranchApiToken } from './office-branch.interface'

export class InMemoryOfficeBranchApi implements OfficeBranchApi {
	private branches: OfficeBranchDto[] = []
	private nextId = 1
	private errors = new Map<string, Error>()

	public setError(method: keyof OfficeBranchApi, error: Error): void {
		this.errors.set(method, error)
	}

	public clearErrors(): void {
		this.errors.clear()
	}

	public seed(branches: OfficeBranchDto[]): void {
		this.branches = [...branches]
		this.nextId = Math.max(0, ...branches.map((branch) => branch.id)) + 1
	}

	public getAll(): Observable<OfficeBranchDto[]> {
		const error = this.errors.get('getAll')
		return error ? throwError(() => error) : of([...this.branches])
	}

	public create(body: CreateOfficeBranchRequest): Observable<OfficeBranchDto> {
		const error = this.errors.get('create')
		if (error) return throwError(() => error)
		const created = { id: this.nextId++, ...body }
		this.branches = [...this.branches, created]
		return of(created)
	}
}

export function provideOfficeBranchMock(api: InMemoryOfficeBranchApi = new InMemoryOfficeBranchApi()) {
	return makeEnvironmentProviders([{ provide: OfficeBranchApiToken, useValue: api }])
}
