import type { Language } from '@resetshop/angular-core/i18n/translation'

/**
 * Shared translation stub consumed by both unit-test mocks (`translation.mock.ts`)
 * and the Storybook global mock (`.storybook/translation-mock.ts`). Keys not present
 * fall through to the raw key — acceptable for spec assertions and visual stories.
 *
 * The `en` side is comprehensive — it covers the full app surface that specs assert on
 * and the keys Storybook stories render. The `es` side is sparser — it only covers the
 * keys Storybook's language toggle needs (specs default to `en`).
 *
 * Strings are kept aligned with production translations (`./translations/en.ts`,
 * `./translations/es.ts`); the production files remain the source of truth for the
 * real app, but this file is the single source of truth for mocks.
 */
export const MOCK_TRANSLATIONS: Record<Language, Record<string, string>> = {
	en: {
		// Auth
		'AUTH.LOGIN.TITLE': 'Sign in to your account',
		'AUTH.LOGIN.EMAIL_LABEL': 'Email address',
		'AUTH.LOGIN.PASSWORD_LABEL': 'Password',
		'AUTH.LOGIN.FORGOT_PASSWORD': 'Forgot your password?',
		'AUTH.LOGIN.SUBMIT': 'Sign in',
		'AUTH.RESET_PASSWORD.TITLE': 'Reset password',
		'AUTH.RESET_PASSWORD.EMAIL_LABEL': 'Email address',
		'AUTH.RESET_PASSWORD.SUBMIT': 'Send reset link',
		'AUTH.RESET_PASSWORD.BACK_TO_LOGIN': 'Back to sign in',

		// Common
		'COMMON.LOADING': 'Loading...',
		'COMMON.CANCEL': 'Cancel',
		'COMMON.SAVE': 'Save',
		'COMMON.SAVING': 'Saving...',
		'COMMON.CREATE': 'Create',
		'COMMON.CREATING': 'Creating...',
		'COMMON.EDIT': 'Edit',
		'COMMON.DELETE': 'Delete',
		'COMMON.DISCARD': 'Discard',
		'COMMON.CONFIRM': 'Confirm',
		'COMMON.LOGOUT': 'Logout',
		'COMMON.DISCARD_DIALOG.TITLE': 'Discard changes',
		'COMMON.DISCARD_DIALOG.MESSAGE': 'You have unsaved changes. Are you sure you want to discard them?',
		'COMMON.DISCARD_DIALOG.CONFIRM': 'Discard',
		'COMMON.STATUS.ACTIVE': 'Active',
		'COMMON.STATUS.DISABLED': 'Disabled',
		'COMMON.STATUS.DELETED': 'Deleted',

		// Data table
		'DATA_TABLE.EMPTY': 'No data available',
		'DATA_TABLE.LOADING': 'Loading...',
		'DATA_TABLE.TOGGLE.TABLE': 'Table view',
		'DATA_TABLE.TOGGLE.CARDS': 'Card view',
		'DATA_TABLE.TOGGLE.GROUP_LABEL': 'Display mode',

		// Pagination
		'PAGINATION.LABEL': 'Pagination',
		'PAGINATION.ROWS_PER_PAGE': 'Rows per page',
		'PAGINATION.GO_TO_PREVIOUS': 'Go to previous page',
		'PAGINATION.GO_TO_NEXT': 'Go to next page',
		'PAGINATION.GO_TO_PAGE': 'Go to page {page}',
		'PAGINATION.PAGE_OF': 'Page {current} of {total}',

		// Validation
		'VALIDATION.REQUIRED': 'This field is required',
		'VALIDATION.EMAIL': 'Please enter a valid email address',
		'VALIDATION.MIN_LENGTH': 'Must be at least {min} characters',
		'VALIDATION.MAX_LENGTH': 'Maximum {max} characters',
		'VALIDATION.MIN': 'Must be at least {min}',
		'VALIDATION.MAX': 'Must be no more than {max}',
		'VALIDATION.PATTERN': 'Invalid format',

		// Users
		'USERS.PAGE.TITLE': 'Users',
		'USERS.PAGE.DESCRIPTION': 'Manage system users, their roles, and account status.',
		'USERS.PAGE.SEARCH': 'Search users...',
		'USERS.PAGE.CREATE_BUTTON': 'Create User',
		'USERS.PAGE.DELETE_DIALOG.TITLE': 'Delete User',
		'USERS.PAGE.DELETE_DIALOG.MESSAGE':
			"Are you sure you want to delete the user '{name}'? This action cannot be undone.",
		'USERS.TABLE.CAPTION': 'Users list',
		'USERS.TABLE.HEADER.NAME': 'Name',
		'USERS.TABLE.HEADER.EMAIL': 'Email',
		'USERS.TABLE.HEADER.STATUS': 'Status',
		'USERS.TABLE.HEADER.ROLES': 'Roles',
		'USERS.CREATE_DRAWER.TITLE': 'Create User',
		'USERS.CREATE_DRAWER.FIRST_NAME': 'First Name',
		'USERS.CREATE_DRAWER.LAST_NAME': 'Last Name',
		'USERS.CREATE_DRAWER.EMAIL': 'Email',
		'USERS.CREATE_DRAWER.MUST_CHANGE_PASSWORD': 'Must change password on first login',
		'USERS.CREATE_DRAWER.ROLES_LABEL': 'Roles',
		'USERS.CREATE_DRAWER.SUCCESS_TOAST': 'User created successfully.',
		'USERS.EDIT_DRAWER.TITLE': 'Edit User',
		'USERS.EDIT_DRAWER.FIRST_NAME': 'First Name',
		'USERS.EDIT_DRAWER.LAST_NAME': 'Last Name',
		'USERS.EDIT_DRAWER.EMAIL': 'Email',
		'USERS.EDIT_DRAWER.ROLES_LABEL': 'Roles',
		'USERS.EDIT_DRAWER.SUCCESS_TOAST': 'User updated successfully.',
		'USERS.DELETE_TOAST': 'User deleted successfully.',

		// Roles
		'ROLES.PAGE.TITLE': 'Roles',
		'ROLES.PAGE.DESCRIPTION': 'Manage system roles and their associated permissions.',
		'ROLES.PAGE.SEARCH': 'Search roles...',
		'ROLES.PAGE.CREATE_BUTTON': 'Create Role',
		'ROLES.PAGE.DELETE_DIALOG.TITLE': 'Delete Role',
		'ROLES.PAGE.DELETE_DIALOG.MESSAGE':
			"Are you sure you want to delete the role '{name}'? This action cannot be undone.",
		'ROLES.TABLE.CAPTION': 'Roles list',
		'ROLES.TABLE.HEADER.NAME': 'Name',
		'ROLES.TABLE.HEADER.CODE': 'Code',
		'ROLES.TABLE.HEADER.DESCRIPTION': 'Description',
		'ROLES.CREATE_DRAWER.TITLE': 'Create Role',
		'ROLES.CREATE_DRAWER.NAME': 'Name',
		'ROLES.CREATE_DRAWER.CODE': 'Code',
		'ROLES.CREATE_DRAWER.CODE_HINT': 'Auto-generated from name',
		'ROLES.CREATE_DRAWER.DESCRIPTION': 'Description',
		'ROLES.CREATE_DRAWER.PERMISSIONS': 'Permissions',
		'ROLES.CREATE_DRAWER.SUCCESS_TOAST': 'Role created successfully.',
		'ROLES.EDIT_DRAWER.TITLE': 'Edit Role',
		'ROLES.EDIT_DRAWER.NAME': 'Name',
		'ROLES.EDIT_DRAWER.CODE': 'Code',
		'ROLES.EDIT_DRAWER.CODE_HINT': 'Code cannot be changed',
		'ROLES.EDIT_DRAWER.DESCRIPTION': 'Description',
		'ROLES.EDIT_DRAWER.PERMISSIONS': 'Permissions',
		'ROLES.EDIT_DRAWER.SUCCESS_TOAST': 'Role updated successfully.',
		'ROLES.DELETE_TOAST': 'Role deleted successfully.',

		// Permissions
		'PERMISSIONS.PAGE.TITLE': 'Permissions',
		'PERMISSIONS.TABLE.CAPTION': 'Permissions grouped by resource',
		'PERMISSIONS.TABLE.HEADER.RESOURCE': 'Resource',
		'PERMISSIONS.TABLE.HEADER.ACTION': 'Action',
		'PERMISSIONS.TABLE.HEADER.IDENTIFIER': 'Identifier',
		'PERMISSIONS.TABLE.HEADER.DESCRIPTION': 'Description',

		// Health
		'HEALTH.TITLE': 'Application Health Checker',
		'HEALTH.LOADING': 'Loading...',
		'HEALTH.STATUS_LABEL': 'Status:',
		'HEALTH.DATE_TIME_LABEL': 'Date & Time:',
		'HEALTH.CHECKS_HEADER': 'Checks',
		'HEALTH.ERROR_TITLE': 'Error:',
		'HEALTH.DATABASE.HEADER': 'Database',
		'HEALTH.DATABASE.STATUS': 'Status:',
		'HEALTH.DATABASE.RESPONSE_TIME': 'Response Time:',

		// Settings
		'SETTINGS.TITLE': 'Settings',
		'SETTINGS.DESCRIPTION': 'Configure your application preferences.',
		'SETTINGS.LANGUAGE.LABEL': 'Language',
		'SETTINGS.LANGUAGE.ENGLISH': 'English',
		'SETTINGS.LANGUAGE.SPANISH': 'Spanish',
		'SETTINGS.NAV': 'Settings',

		// Dashboard
		'DASHBOARD.BREADCRUMB': 'Dashboard',
	},
	es: {
		// Auth
		'AUTH.LOGIN.TITLE': 'Inicia sesión en tu cuenta',
		'AUTH.LOGIN.EMAIL_LABEL': 'Correo electrónico',
		'AUTH.LOGIN.PASSWORD_LABEL': 'Contraseña',
		'AUTH.LOGIN.FORGOT_PASSWORD': '¿Olvidaste tu contraseña?',
		'AUTH.LOGIN.SUBMIT': 'Iniciar sesión',
		'AUTH.RESET_PASSWORD.TITLE': 'Restablecer contraseña',
		'AUTH.RESET_PASSWORD.EMAIL_LABEL': 'Correo electrónico',
		'AUTH.RESET_PASSWORD.SUBMIT': 'Enviar enlace',
		'AUTH.RESET_PASSWORD.BACK_TO_LOGIN': 'Volver al inicio de sesión',

		// Common
		'COMMON.LOADING': 'Cargando...',
		'COMMON.EDIT': 'Editar',
		'COMMON.DELETE': 'Eliminar',
		'COMMON.CANCEL': 'Cancelar',
		'COMMON.SAVE': 'Guardar',
		'COMMON.CONFIRM': 'Confirmar',

		// Data table
		'DATA_TABLE.EMPTY': 'No hay datos disponibles',
		'DATA_TABLE.LOADING': 'Cargando...',
		'DATA_TABLE.TOGGLE.TABLE': 'Vista de tabla',
		'DATA_TABLE.TOGGLE.CARDS': 'Vista de tarjetas',
		'DATA_TABLE.TOGGLE.GROUP_LABEL': 'Modo de visualización',

		// Pagination
		'PAGINATION.LABEL': 'Paginación',
		'PAGINATION.ROWS_PER_PAGE': 'Filas por página',
		'PAGINATION.GO_TO_PREVIOUS': 'Ir a la página anterior',
		'PAGINATION.GO_TO_NEXT': 'Ir a la página siguiente',
		'PAGINATION.GO_TO_PAGE': 'Ir a la página {page}',
		'PAGINATION.PAGE_OF': 'Página {current} de {total}',
	},
}
