import { MOCK_TRANSLATIONS, type TranslationStub } from '@providers/i18n/translation.mock'
import { repairsEn } from '@providers/i18n/translations/slices/repairs.translations'

function flatten(tree: object, prefix = ''): Record<string, string> {
	return Object.entries(tree).reduce<Record<string, string>>((flat, [key, value]) => {
		const path = prefix ? `${prefix}.${key}` : key
		return typeof value === 'string' ? { ...flat, [path]: value } : { ...flat, ...flatten(value, path) }
	}, {})
}

const TRANSLATIONS: Record<string, string> = { ...MOCK_TRANSLATIONS, ...flatten(repairsEn) }

/**
 * Translation stub for the repairs specs: resolves the base mock keys plus every English string
 * of the repairs slice, so specs assert on what the user reads.
 */
export const repairsTranslation: TranslationStub = {
	instant: (key: string, fallback?: string) => TRANSLATIONS[key] ?? fallback ?? key,
}
