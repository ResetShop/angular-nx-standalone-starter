import { MOCK_TRANSLATIONS, type TranslationStub } from '@providers/i18n/translation.mock'
import { clientsEn } from '@providers/i18n/translations/slices/clients.translations'
import { profileEn } from '@providers/i18n/translations/slices/profile.translations'

function flatten(tree: object, prefix = ''): Record<string, string> {
	return Object.entries(tree).reduce<Record<string, string>>((flat, [key, value]) => {
		const path = `${prefix}${key}`
		return typeof value === 'string' ? { ...flat, [path]: value } : { ...flat, ...flatten(value, `${path}.`) }
	}, {})
}

/**
 * Translation stub for clients and profile specs and stories: the shared mock keys plus the real
 * English text of the clients and profile slices, so assertions read like the UI.
 */
const dictionary = { ...MOCK_TRANSLATIONS, ...flatten(clientsEn), ...flatten(profileEn) }

export const customerTranslation: TranslationStub = {
	instant: (key: string, fallback?: string) => dictionary[key] ?? fallback ?? key,
}
