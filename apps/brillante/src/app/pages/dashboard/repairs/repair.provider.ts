import { makeEnvironmentProviders } from '@angular/core'
import { HttpRepairApi } from './repair'
import { RepairApi } from './repair.interface'

export function provideRepair() {
	return makeEnvironmentProviders([{ provide: RepairApi, useExisting: HttpRepairApi }])
}
