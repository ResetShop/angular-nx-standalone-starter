import { makeEnvironmentProviders } from '@angular/core'
import { HttpOfficeBranchApi } from './office-branch'
import { OfficeBranchApi } from './office-branch.interface'

export function provideOfficeBranch() {
	return makeEnvironmentProviders([{ provide: OfficeBranchApi, useExisting: HttpOfficeBranchApi }])
}
