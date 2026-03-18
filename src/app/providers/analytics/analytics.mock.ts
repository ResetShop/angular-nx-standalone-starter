import { Injectable, type Provider } from '@angular/core'
import { Analytics } from './analytics'

@Injectable({ providedIn: 'root' })
export class AnalyticsMock extends Analytics {
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	public override async init() {}
}

export function provideAnalyticsMock(): Provider[] {
	return [{ provide: Analytics, useClass: AnalyticsMock }]
}
