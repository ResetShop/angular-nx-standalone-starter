import { Injectable } from '@angular/core'
import { Analytics } from './analytics'

@Injectable({
	providedIn: 'root',
})
export class AnalyticsMock extends Analytics {
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	async init() {}
}
