import { makeEnvironmentProviders } from '@angular/core'
import { HttpReportApi } from './report'
import { ReportApi } from './report.interface'

export function provideReport() {
	return makeEnvironmentProviders([{ provide: ReportApi, useExisting: HttpReportApi }])
}
