import type { Provider } from '@angular/core'
import { Translation } from './translation'

export function provideTranslation(): Provider[] {
	return [Translation]
}
