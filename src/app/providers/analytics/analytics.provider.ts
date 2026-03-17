import type { Provider } from '@angular/core'
import { Analytics } from './analytics'

export function provideAnalytics(): Provider[] {
	return [Analytics]
}
