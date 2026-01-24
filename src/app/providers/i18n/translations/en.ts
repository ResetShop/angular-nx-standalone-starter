import type { TranslationSchema } from '../translations.schema';

const en: TranslationSchema = {
	AUTH: {
		ERRORS: {
			INVALID_CREDENTIALS: 'Email or password is incorrect',
			ACCOUNT_LOCKED:
				'Your account has been temporarily locked due to multiple failed attempts. Please try again later.',
			ACCOUNT_DISABLED: 'Your account has been disabled. Please contact support.',
			ACCOUNT_DELETED: 'This account no longer exists.',
			TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
			TOKEN_INVALID: 'Invalid session. Please log in again.',
			GENERIC: 'Login error. Please try again.',
		},
	},
};

export default en;
