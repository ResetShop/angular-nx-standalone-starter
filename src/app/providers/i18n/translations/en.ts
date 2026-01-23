import type { TranslationSchema } from '../translations.schema';

const en: TranslationSchema = {
	AUTH: {
		ERRORS: {
			ACCOUNT_LOCKED:
				'Your account has been temporarily locked due to multiple failed attempts. Please try again later.',
			INVALID_CREDENTIALS: 'Email or password is incorrect',
			GENERIC: 'Login error. Please try again.',
		},
	},
};

export default en;
