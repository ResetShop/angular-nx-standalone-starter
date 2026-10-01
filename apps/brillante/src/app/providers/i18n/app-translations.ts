import type { TranslationKey, TranslationSchema } from '@resetshop/angular-core/i18n/translations.schema'
import { cashEn, cashEs } from './translations/slices/cash.translations'
import { clientsEn, clientsEs } from './translations/slices/clients.translations'
import { profileEn, profileEs } from './translations/slices/profile.translations'
import { repairsEn, repairsEs } from './translations/slices/repairs.translations'
import { reportsEn, reportsEs } from './translations/slices/reports.translations'
import { settingsEn, settingsEs } from './translations/slices/settings.translations'
import { shellEn, shellEs } from './translations/slices/shell.translations'

/**
 * Brillante-specific translations, composed from one file per feature slice so each slice owns
 * its own namespaces. The base `TranslationSchema` (starter-owned) stays untouched; these keys
 * extend it. Slice namespaces must not collide with a top-level key of the base schema.
 */
export const slicesEn = { ...shellEn, ...repairsEn, ...clientsEn, ...cashEn, ...settingsEn, ...reportsEn, ...profileEn }

export const slicesEs: typeof slicesEn = {
	...shellEs,
	...repairsEs,
	...clientsEs,
	...cashEs,
	...settingsEs,
	...reportsEs,
	...profileEs,
}

export type AppTranslationSchema = TranslationSchema & typeof slicesEn

type LeafPaths<T, Prefix extends string = ''> = {
	[K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : LeafPaths<T[K], `${Prefix}${K}.`>
}[keyof T & string]

/**
 * Every key the application can translate: the starter's keys plus the Brillante slices.
 */
export type AppTranslationKey = TranslationKey | LeafPaths<typeof slicesEn>
