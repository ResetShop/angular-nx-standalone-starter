import { TestBed } from '@angular/core/testing'
import { clearAllMocks } from '@resetshop/util/test-utils'
import { Translation, TRANSLATION_LOADER } from './translation'
import type { TranslationSchema } from './translations.schema'

const stubTranslations: Record<string, TranslationSchema> = {
	en: {
		AUTH: {
			LOGIN: {
				TITLE: 'Sign in',
				EMAIL_LABEL: 'Email',
				PASSWORD_LABEL: 'Password',
				FORGOT_PASSWORD: 'Forgot?',
				SUBMIT: 'Sign in',
			},
			RESET_PASSWORD: { TITLE: 'Reset', EMAIL_LABEL: 'Email', SUBMIT: 'Send', BACK_TO_LOGIN: 'Back' },
			ERRORS: {
				INVALID_CREDENTIALS: 'Invalid credentials',
				ACCOUNT_LOCKED: 'Locked',
				ACCOUNT_DISABLED: 'Disabled',
				ACCOUNT_DELETED: 'Deleted',
				TOKEN_EXPIRED: 'Expired',
				TOKEN_INVALID: 'Invalid',
				GENERIC: 'Error',
			},
		},
		COMMON: {
			LOADING: 'Loading',
			CANCEL: 'Cancel',
			SAVE: 'Save',
			SAVING: 'Saving',
			CREATE: 'Create',
			CREATING: 'Creating',
			EDIT: 'Edit',
			DELETE: 'Delete',
			DISCARD: 'Discard',
			CONFIRM: 'Confirm',
			DISCARD_DIALOG: { TITLE: 'Discard?', MESSAGE: 'Unsaved changes', CONFIRM: 'Discard' },
			LOGOUT: 'Logout',
			STATUS: { ACTIVE: 'Active', DISABLED: 'Disabled', DELETED: 'Deleted' },
		},
		USERS: {
			PAGE: {
				NAV: 'Users',
				TITLE: 'Users',
				DESCRIPTION: 'Manage',
				SEARCH: 'Search',
				CREATE_BUTTON: 'Create',
				DELETE_DIALOG: { TITLE: 'Delete?', MESSAGE: 'Sure?' },
			},
			TABLE: { CAPTION: 'Users', HEADER: { NAME: 'Name', EMAIL: 'Email', STATUS: 'Status', ROLES: 'Roles' } },
			CREATE_DRAWER: {
				TITLE: 'Create',
				FIRST_NAME: 'First',
				LAST_NAME: 'Last',
				EMAIL: 'Email',
				MUST_CHANGE_PASSWORD: 'Must change',
				ROLES_LABEL: 'Roles',
				SUCCESS_TOAST: 'Created',
			},
			EDIT_DRAWER: {
				TITLE: 'Edit',
				FIRST_NAME: 'First',
				LAST_NAME: 'Last',
				EMAIL: 'Email',
				ROLES_LABEL: 'Roles',
				SUCCESS_TOAST: 'Updated',
			},
			DELETE_TOAST: 'Deleted',
		},
		ROLES: {
			PAGE: {
				NAV: 'Roles',
				TITLE: 'Roles',
				DESCRIPTION: 'Manage',
				SEARCH: 'Search',
				CREATE_BUTTON: 'Create',
				DELETE_DIALOG: { TITLE: 'Delete?', MESSAGE: 'Sure?' },
			},
			TABLE: { CAPTION: 'Roles', HEADER: { NAME: 'Name', CODE: 'Code', DESCRIPTION: 'Desc' } },
			CREATE_DRAWER: {
				TITLE: 'Create',
				NAME: 'Name',
				CODE: 'Code',
				CODE_HINT: 'Hint',
				DESCRIPTION: 'Desc',
				PERMISSIONS: 'Perms',
				SUCCESS_TOAST: 'Created',
			},
			EDIT_DRAWER: {
				TITLE: 'Edit',
				NAME: 'Name',
				CODE: 'Code',
				CODE_HINT: 'Hint',
				DESCRIPTION: 'Desc',
				PERMISSIONS: 'Perms',
				SUCCESS_TOAST: 'Updated',
			},
			DELETE_TOAST: 'Deleted',
		},
		PERMISSIONS: {
			PAGE: { NAV: 'Permissions', TITLE: 'Permissions', DESCRIPTION_INTRO: 'Intro', DESCRIPTION_PATTERN: 'Pattern' },
			TABLE: {
				CAPTION: 'Permissions',
				HEADER: { RESOURCE: 'Resource', ACTION: 'Action', IDENTIFIER: 'Id', DESCRIPTION: 'Desc' },
			},
		},
		SETTINGS: {
			NAV: 'Settings',
			TITLE: 'Settings',
			DESCRIPTION: 'Configure',
			LANGUAGE: { LABEL: 'Language', ENGLISH: 'English', SPANISH: 'Spanish' },
		},
		HEALTH: {
			NAV: 'Health',
			TITLE: 'Health',
			LOADING: 'Loading',
			STATUS_LABEL: 'Status',
			DATE_TIME_LABEL: 'Date',
			CHECKS_HEADER: 'Checks',
			ERROR_TITLE: 'Error',
			DATABASE: { HEADER: 'Database', STATUS: 'Status', RESPONSE_TIME: 'Response' },
		},
		DASHBOARD: {
			BREADCRUMB: 'Dashboard',
			SECTIONS: { SETTINGS: 'Settings', ADMIN: 'Admin' },
			HOME: {
				NAV: 'Home',
				DESCRIPTIONS: {
					WELCOME: 'Welcome',
					SETTINGS: 'Settings',
					HEALTH: 'Health',
					USERS: 'Users',
					AUTHORIZATION: 'Auth',
				},
			},
			AUTHORIZATION: {
				NAV: 'Auth',
				TITLE: 'Auth',
				ROLES_CARD: { NAME: 'Roles', DESCRIPTION: 'Manage' },
				PERMISSIONS_CARD: { NAME: 'Perms', DESCRIPTION: 'View' },
			},
		},
		HTTP: { ERRORS: { FORBIDDEN: 'Forbidden' } },
		DATA_TABLE: { EMPTY: 'Empty', LOADING: 'Loading' },
		PAGINATION: {
			LABEL: 'Pagination',
			ROWS_PER_PAGE: 'Rows',
			GO_TO_PREVIOUS: 'Prev',
			GO_TO_NEXT: 'Next',
			GO_TO_PAGE: 'Page',
		},
		VALIDATION: {
			REQUIRED: 'Required',
			EMAIL: 'Email',
			MIN_LENGTH: 'Min length',
			MAX_LENGTH: 'Max length',
			MIN: 'Min',
			MAX: 'Max',
			PATTERN: 'Pattern',
		},
	},
	es: {
		AUTH: {
			LOGIN: {
				TITLE: 'Iniciar sesión',
				EMAIL_LABEL: 'Correo',
				PASSWORD_LABEL: 'Contraseña',
				FORGOT_PASSWORD: '¿Olvidó?',
				SUBMIT: 'Entrar',
			},
			RESET_PASSWORD: { TITLE: 'Restablecer', EMAIL_LABEL: 'Correo', SUBMIT: 'Enviar', BACK_TO_LOGIN: 'Volver' },
			ERRORS: {
				INVALID_CREDENTIALS: 'Credenciales inválidas',
				ACCOUNT_LOCKED: 'Bloqueada',
				ACCOUNT_DISABLED: 'Desactivada',
				ACCOUNT_DELETED: 'Eliminada',
				TOKEN_EXPIRED: 'Expirada',
				TOKEN_INVALID: 'Inválida',
				GENERIC: 'Error de inicio de sesión',
			},
		},
		COMMON: {
			LOADING: 'Cargando',
			CANCEL: 'Cancelar',
			SAVE: 'Guardar',
			SAVING: 'Guardando',
			CREATE: 'Crear',
			CREATING: 'Creando',
			EDIT: 'Editar',
			DELETE: 'Eliminar',
			DISCARD: 'Descartar',
			CONFIRM: 'Confirmar',
			DISCARD_DIALOG: { TITLE: '¿Descartar?', MESSAGE: 'Cambios sin guardar', CONFIRM: 'Descartar' },
			LOGOUT: 'Salir',
			STATUS: { ACTIVE: 'Activo', DISABLED: 'Desactivado', DELETED: 'Eliminado' },
		},
		USERS: {
			PAGE: {
				NAV: 'Usuarios',
				TITLE: 'Usuarios',
				DESCRIPTION: 'Gestionar',
				SEARCH: 'Buscar',
				CREATE_BUTTON: 'Crear',
				DELETE_DIALOG: { TITLE: '¿Eliminar?', MESSAGE: '¿Seguro?' },
			},
			TABLE: { CAPTION: 'Usuarios', HEADER: { NAME: 'Nombre', EMAIL: 'Correo', STATUS: 'Estado', ROLES: 'Roles' } },
			CREATE_DRAWER: {
				TITLE: 'Crear',
				FIRST_NAME: 'Nombre',
				LAST_NAME: 'Apellido',
				EMAIL: 'Correo',
				MUST_CHANGE_PASSWORD: 'Debe cambiar',
				ROLES_LABEL: 'Roles',
				SUCCESS_TOAST: 'Creado',
			},
			EDIT_DRAWER: {
				TITLE: 'Editar',
				FIRST_NAME: 'Nombre',
				LAST_NAME: 'Apellido',
				EMAIL: 'Correo',
				ROLES_LABEL: 'Roles',
				SUCCESS_TOAST: 'Actualizado',
			},
			DELETE_TOAST: 'Eliminado',
		},
		ROLES: {
			PAGE: {
				NAV: 'Roles',
				TITLE: 'Roles',
				DESCRIPTION: 'Gestionar',
				SEARCH: 'Buscar',
				CREATE_BUTTON: 'Crear',
				DELETE_DIALOG: { TITLE: '¿Eliminar?', MESSAGE: '¿Seguro?' },
			},
			TABLE: { CAPTION: 'Roles', HEADER: { NAME: 'Nombre', CODE: 'Código', DESCRIPTION: 'Desc' } },
			CREATE_DRAWER: {
				TITLE: 'Crear',
				NAME: 'Nombre',
				CODE: 'Código',
				CODE_HINT: 'Pista',
				DESCRIPTION: 'Desc',
				PERMISSIONS: 'Permisos',
				SUCCESS_TOAST: 'Creado',
			},
			EDIT_DRAWER: {
				TITLE: 'Editar',
				NAME: 'Nombre',
				CODE: 'Código',
				CODE_HINT: 'Pista',
				DESCRIPTION: 'Desc',
				PERMISSIONS: 'Permisos',
				SUCCESS_TOAST: 'Actualizado',
			},
			DELETE_TOAST: 'Eliminado',
		},
		PERMISSIONS: {
			PAGE: { NAV: 'Permisos', TITLE: 'Permisos', DESCRIPTION_INTRO: 'Intro', DESCRIPTION_PATTERN: 'Patrón' },
			TABLE: {
				CAPTION: 'Permisos',
				HEADER: { RESOURCE: 'Recurso', ACTION: 'Acción', IDENTIFIER: 'Id', DESCRIPTION: 'Desc' },
			},
		},
		SETTINGS: {
			NAV: 'Ajustes',
			TITLE: 'Ajustes',
			DESCRIPTION: 'Configurar',
			LANGUAGE: { LABEL: 'Idioma', ENGLISH: 'Inglés', SPANISH: 'Español' },
		},
		HEALTH: {
			NAV: 'Salud',
			TITLE: 'Salud',
			LOADING: 'Cargando',
			STATUS_LABEL: 'Estado',
			DATE_TIME_LABEL: 'Fecha',
			CHECKS_HEADER: 'Checks',
			ERROR_TITLE: 'Error',
			DATABASE: { HEADER: 'Base de datos', STATUS: 'Estado', RESPONSE_TIME: 'Respuesta' },
		},
		DASHBOARD: {
			BREADCRUMB: 'Panel',
			SECTIONS: { SETTINGS: 'Ajustes', ADMIN: 'Admin' },
			HOME: {
				NAV: 'Inicio',
				DESCRIPTIONS: {
					WELCOME: 'Bienvenido',
					SETTINGS: 'Ajustes',
					HEALTH: 'Salud',
					USERS: 'Usuarios',
					AUTHORIZATION: 'Auth',
				},
			},
			AUTHORIZATION: {
				NAV: 'Auth',
				TITLE: 'Auth',
				ROLES_CARD: { NAME: 'Roles', DESCRIPTION: 'Gestionar' },
				PERMISSIONS_CARD: { NAME: 'Permisos', DESCRIPTION: 'Ver' },
			},
		},
		HTTP: { ERRORS: { FORBIDDEN: 'Prohibido' } },
		DATA_TABLE: { EMPTY: 'Vacío', LOADING: 'Cargando' },
		PAGINATION: {
			LABEL: 'Paginación',
			ROWS_PER_PAGE: 'Filas',
			GO_TO_PREVIOUS: 'Anterior',
			GO_TO_NEXT: 'Siguiente',
			GO_TO_PAGE: 'Página',
		},
		VALIDATION: {
			REQUIRED: 'Requerido',
			EMAIL: 'Correo',
			MIN_LENGTH: 'Longitud mín',
			MAX_LENGTH: 'Longitud máx',
			MIN: 'Mín',
			MAX: 'Máx',
			PATTERN: 'Patrón',
		},
	},
}

function stubLoader(lang: string): Promise<TranslationSchema> {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- test data is always present for known languages
	return Promise.resolve(stubTranslations[lang]!)
}

describe('Translation Service', () => {
	let service: Translation

	beforeEach(() => {
		clearAllMocks()
		TestBed.configureTestingModule({
			providers: [{ provide: TRANSLATION_LOADER, useValue: stubLoader }],
		})
		service = TestBed.inject(Translation)
	})

	describe('Service Creation', () => {
		it('should be created', () => {
			expect(service).toBeTruthy()
		})

		it('should be a singleton (providedIn: root)', () => {
			const service1 = TestBed.inject(Translation)
			const service2 = TestBed.inject(Translation)
			expect(service1).toBe(service2)
		})

		it('should have default language from environment', () => {
			const currentLang = service.getCurrentLanguage()
			expect(['en', 'es']).toContain(currentLang)
		})
	})

	describe('loadDefaultLanguage()', () => {
		it('should load translations for the default language', async () => {
			await service.loadDefaultLanguage()

			// Should not throw when calling instant after loading
			const result = service.instant('AUTH.ERRORS.GENERIC')
			expect(typeof result).toBe('string')
			expect(result).not.toBe('AUTH.ERRORS.GENERIC')
		})
	})

	describe('instant()', () => {
		beforeEach(async () => {
			await service.loadDefaultLanguage()
		})

		it('should return translated string for valid key', () => {
			const result = service.instant('AUTH.ERRORS.INVALID_CREDENTIALS')

			expect(typeof result).toBe('string')
			expect(result.length).toBeGreaterThan(0)
			expect(result).not.toBe('AUTH.ERRORS.INVALID_CREDENTIALS')
		})

		it('should return the key as fallback for non-existent key path', () => {
			// Force a runtime call with an invalid key structure
			const invalidKey = 'AUTH.NONEXISTENT.KEY' as Parameters<typeof service.instant>[0]
			const result = service.instant(invalidKey)

			expect(result).toBe('AUTH.NONEXISTENT.KEY')
		})

		it('should navigate nested keys correctly', () => {
			const result = service.instant('AUTH.ERRORS.ACCOUNT_LOCKED')

			expect(typeof result).toBe('string')
			expect(result.length).toBeGreaterThan(0)
		})
	})

	describe('setLanguage()', () => {
		it('should change the current language', async () => {
			await service.setLanguage('en')
			expect(service.getCurrentLanguage()).toBe('en')

			await service.setLanguage('es')
			expect(service.getCurrentLanguage()).toBe('es')
		})

		it('should load translations for the new language', async () => {
			await service.setLanguage('en')
			const enResult = service.instant('AUTH.ERRORS.INVALID_CREDENTIALS')

			await service.setLanguage('es')
			const esResult = service.instant('AUTH.ERRORS.INVALID_CREDENTIALS')

			// Both should return valid translations (not the key itself)
			expect(enResult).not.toBe('AUTH.ERRORS.INVALID_CREDENTIALS')
			expect(esResult).not.toBe('AUTH.ERRORS.INVALID_CREDENTIALS')

			// They should be different (different languages)
			expect(enResult).not.toBe(esResult)
		})
	})

	describe('getCurrentLanguage()', () => {
		it('should return the current language', () => {
			const lang = service.getCurrentLanguage()
			expect(['en', 'es']).toContain(lang)
		})

		it('should reflect language changes', async () => {
			await service.setLanguage('en')
			expect(service.getCurrentLanguage()).toBe('en')

			await service.setLanguage('es')
			expect(service.getCurrentLanguage()).toBe('es')
		})
	})

	describe('Uninitialized service', () => {
		it('should throw error when translations are not loaded', () => {
			const uninitService = TestBed.inject(Translation)

			expect(() => {
				uninitService.instant('AUTH.ERRORS.GENERIC')
			}).toThrow(/not loaded/)
		})
	})

	describe('Translation Caching', () => {
		it('should not reload already loaded translations', async () => {
			await service.setLanguage('en')
			const firstResult = service.instant('AUTH.ERRORS.GENERIC')

			// Call setLanguage again for the same language
			await service.setLanguage('en')
			const secondResult = service.instant('AUTH.ERRORS.GENERIC')

			expect(firstResult).toBe(secondResult)
		})

		it('should cache multiple languages independently', async () => {
			await service.setLanguage('en')
			const enResult = service.instant('AUTH.ERRORS.GENERIC')

			await service.setLanguage('es')
			const esResult = service.instant('AUTH.ERRORS.GENERIC')

			// Switch back to English - should use cached version
			await service.setLanguage('en')
			const enResultCached = service.instant('AUTH.ERRORS.GENERIC')

			expect(enResult).toBe(enResultCached)
			expect(enResult).not.toBe(esResult)
		})
	})
})
