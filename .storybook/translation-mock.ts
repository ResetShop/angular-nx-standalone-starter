import { type Provider, signal } from '@angular/core'
import { type Language, Translation } from '@resetshop/angular-core/i18n/translation'

/**
 * Shared Storybook translation stub. Covers the union of keys consumed by any story.
 * Any unmapped key falls through to "return raw key" — acceptable for visual stories.
 */
const STORY_TRANSLATIONS: Record<Language, Record<string, string>> = {
	en: {
		'DATA_TABLE.EMPTY': 'No data available',
		'DATA_TABLE.LOADING': 'Loading...',
		'DATA_TABLE.TOGGLE.TABLE': 'Table view',
		'DATA_TABLE.TOGGLE.CARDS': 'Card view',
		'DATA_TABLE.TOGGLE.GROUP_LABEL': 'Display mode',
		'PAGINATION.LABEL': 'Pagination',
		'PAGINATION.ROWS_PER_PAGE': 'Rows per page',
		'PAGINATION.GO_TO_PREVIOUS': 'Go to previous page',
		'PAGINATION.GO_TO_NEXT': 'Go to next page',
		'PAGINATION.GO_TO_PAGE': 'Go to page {page}',
		'PAGINATION.PAGE_OF': 'Page {current} of {total}',
		'AUTH.LOGIN.TITLE': 'Sign in to your account',
		'AUTH.LOGIN.EMAIL_LABEL': 'Email address',
		'AUTH.LOGIN.PASSWORD_LABEL': 'Password',
		'AUTH.LOGIN.FORGOT_PASSWORD': 'Forgot your password?',
		'AUTH.LOGIN.SUBMIT': 'Sign in',
		'AUTH.RESET_PASSWORD.TITLE': 'Reset password',
		'AUTH.RESET_PASSWORD.EMAIL_LABEL': 'Email address',
		'AUTH.RESET_PASSWORD.SUBMIT': 'Send reset link',
		'AUTH.RESET_PASSWORD.BACK_TO_LOGIN': 'Back to sign in',
		'COMMON.EDIT': 'Edit',
		'COMMON.DELETE': 'Delete',
		'COMMON.CANCEL': 'Cancel',
		'COMMON.SAVE': 'Save',
		'COMMON.CONFIRM': 'Confirm',
		'COMMON.LOADING': 'Loading...',
	},
	es: {
		'DATA_TABLE.EMPTY': 'No hay datos disponibles',
		'DATA_TABLE.LOADING': 'Cargando...',
		'DATA_TABLE.TOGGLE.TABLE': 'Vista de tabla',
		'DATA_TABLE.TOGGLE.CARDS': 'Vista de tarjetas',
		'DATA_TABLE.TOGGLE.GROUP_LABEL': 'Modo de visualización',
		'PAGINATION.LABEL': 'Paginación',
		'PAGINATION.ROWS_PER_PAGE': 'Filas por página',
		'PAGINATION.GO_TO_PREVIOUS': 'Ir a la página anterior',
		'PAGINATION.GO_TO_NEXT': 'Ir a la página siguiente',
		'PAGINATION.GO_TO_PAGE': 'Ir a la página {page}',
		'PAGINATION.PAGE_OF': 'Página {current} de {total}',
		'AUTH.LOGIN.TITLE': 'Inicia sesión en tu cuenta',
		'AUTH.LOGIN.EMAIL_LABEL': 'Correo electrónico',
		'AUTH.LOGIN.PASSWORD_LABEL': 'Contraseña',
		'AUTH.LOGIN.FORGOT_PASSWORD': '¿Olvidaste tu contraseña?',
		'AUTH.LOGIN.SUBMIT': 'Iniciar sesión',
		'AUTH.RESET_PASSWORD.TITLE': 'Restablecer contraseña',
		'AUTH.RESET_PASSWORD.EMAIL_LABEL': 'Correo electrónico',
		'AUTH.RESET_PASSWORD.SUBMIT': 'Enviar enlace',
		'AUTH.RESET_PASSWORD.BACK_TO_LOGIN': 'Volver al inicio de sesión',
		'COMMON.EDIT': 'Editar',
		'COMMON.DELETE': 'Eliminar',
		'COMMON.CANCEL': 'Cancelar',
		'COMMON.SAVE': 'Guardar',
		'COMMON.CONFIRM': 'Confirmar',
		'COMMON.LOADING': 'Cargando...',
	},
}

/**
 * Fake `Translation` service for Storybook. Bypasses the real `TRANSLATION_LOADER`
 * plumbing entirely — `setLanguage`/`loadDefaultLanguage` are no-op promises that
 * resolve instantly, and `instant()` reads from `STORY_TRANSLATIONS` directly.
 *
 * Replacing `Translation` wholesale with `useValue` is the pattern that survives
 * Storybook 10's docs-page renderer: providing only `TRANSLATION_LOADER` via
 * `provideTranslation()` is not consistently honoured for indirect token
 * dependencies of `@Injectable({ providedIn: 'root' })` services.
 */
function createStoryTranslation(): Translation {
	const currentLang = signal<Language>('en')
	return {
		currentLanguage: currentLang.asReadonly(),
		instant: (key: string) => STORY_TRANSLATIONS[currentLang()][key] ?? key,
		setLanguage: async (lang: Language) => {
			currentLang.set(lang)
		},
		loadDefaultLanguage: async () => undefined,
		getCurrentLanguage: () => currentLang(),
	} as unknown as Translation
}

/** Global provider array — wire into `applicationConfig({ providers: [...storyTranslationProviders] })`. */
export const storyTranslationProviders: Provider[] = [{ provide: Translation, useValue: createStoryTranslation() }]
