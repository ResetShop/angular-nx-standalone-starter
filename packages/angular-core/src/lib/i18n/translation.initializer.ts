import { inject } from '@angular/core'
import { Translation } from './translation'

export function initializeTranslation() {
	return async () => {
		const translation = inject(Translation)
		await translation.loadDefaultLanguage()
	}
}
