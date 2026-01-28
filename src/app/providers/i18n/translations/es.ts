import type { TranslationSchema } from '../translations.schema';

const es: TranslationSchema = {
	AUTH: {
		ERRORS: {
			INVALID_CREDENTIALS: 'Email o contraseña incorrectos',
			ACCOUNT_LOCKED:
				'Tu cuenta ha sido bloqueada temporalmente debido a múltiples intentos fallidos. Por favor, intenta de nuevo más tarde.',
			ACCOUNT_DISABLED: 'Tu cuenta ha sido deshabilitada. Por favor, contacta con soporte.',
			ACCOUNT_DELETED: 'Esta cuenta ya no existe.',
			TOKEN_EXPIRED: 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.',
			TOKEN_INVALID: 'Sesión inválida. Por favor, inicia sesión de nuevo.',
			GENERIC: 'Error al iniciar sesión. Por favor, intenta de nuevo.',
		},
	},
	DATA_TABLE: {
		EMPTY: 'No hay datos disponibles',
		LOADING: 'Cargando...',
	},
	PAGINATION: {
		LABEL: 'Paginación',
		ROWS_PER_PAGE: 'Filas por página',
		GO_TO_PREVIOUS: 'Ir a la página anterior',
		GO_TO_NEXT: 'Ir a la página siguiente',
		GO_TO_PAGE: 'Ir a la página {page}',
	},
};

export default es;
