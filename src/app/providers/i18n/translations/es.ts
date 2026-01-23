import type { TranslationSchema } from '../translations.schema';

const es: TranslationSchema = {
	AUTH: {
		ERRORS: {
			ACCOUNT_LOCKED:
				'Tu cuenta ha sido bloqueada temporalmente debido a múltiples intentos fallidos. Por favor, intenta de nuevo más tarde.',
			INVALID_CREDENTIALS: 'Email o contraseña incorrectos',
			GENERIC: 'Error al iniciar sesión. Por favor, intenta de nuevo.',
		},
	},
};

export default es;
