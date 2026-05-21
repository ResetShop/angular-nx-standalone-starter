import type { TranslationSchema } from '@resetshop/angular-core/i18n/translations.schema'

const en: TranslationSchema = {
	AUTH: {
		LOGIN: {
			TITLE: 'Sign in to your account',
			EMAIL_LABEL: 'Email address',
			PASSWORD_LABEL: 'Password',
			FORGOT_PASSWORD: 'Forgot your password?',
			SUBMIT: 'Sign in',
		},
		RESET_PASSWORD: {
			TITLE: 'Reset password',
			EMAIL_LABEL: 'Email address',
			SUBMIT: 'Send reset link',
			BACK_TO_LOGIN: 'Back to sign in',
		},
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
	COMMON: {
		LOADING: 'Loading...',
		CANCEL: 'Cancel',
		SAVE: 'Save',
		SAVING: 'Saving...',
		CREATE: 'Create',
		CREATING: 'Creating...',
		EDIT: 'Edit',
		DELETE: 'Delete',
		DISCARD: 'Discard',
		CONFIRM: 'Confirm',
		DISCARD_DIALOG: {
			TITLE: 'Discard changes',
			MESSAGE: 'You have unsaved changes. Are you sure you want to discard them?',
			CONFIRM: 'Discard',
		},
		LOGOUT: 'Logout',
		STATUS: {
			ACTIVE: 'Active',
			DISABLED: 'Disabled',
			DELETED: 'Deleted',
		},
	},
	USERS: {
		PAGE: {
			NAV: 'Users',
			TITLE: 'Users',
			DESCRIPTION: 'Manage system users, their roles, and account status.',
			SEARCH: 'Search users...',
			CREATE_BUTTON: 'Create User',
			DELETE_DIALOG: {
				TITLE: 'Delete User',
				MESSAGE: "Are you sure you want to delete the user '{name}'? This action cannot be undone.",
			},
		},
		TABLE: {
			CAPTION: 'Users list',
			HEADER: {
				NAME: 'Name',
				EMAIL: 'Email',
				STATUS: 'Status',
				ROLES: 'Roles',
			},
		},
		CREATE_DRAWER: {
			TITLE: 'Create User',
			FIRST_NAME: 'First Name',
			LAST_NAME: 'Last Name',
			EMAIL: 'Email',
			MUST_CHANGE_PASSWORD: 'Must change password on first login',
			ROLES_LABEL: 'Roles',
			SUCCESS_TOAST: 'User created successfully.',
		},
		EDIT_DRAWER: {
			TITLE: 'Edit User',
			FIRST_NAME: 'First Name',
			LAST_NAME: 'Last Name',
			EMAIL: 'Email',
			ROLES_LABEL: 'Roles',
			SUCCESS_TOAST: 'User updated successfully.',
		},
		DELETE_TOAST: 'User deleted successfully.',
	},
	ROLES: {
		PAGE: {
			NAV: 'Roles',
			TITLE: 'Roles',
			DESCRIPTION: 'Manage system roles and their associated permissions.',
			SEARCH: 'Search roles...',
			CREATE_BUTTON: 'Create Role',
			DELETE_DIALOG: {
				TITLE: 'Delete Role',
				MESSAGE: "Are you sure you want to delete the role '{name}'? This action cannot be undone.",
			},
		},
		TABLE: {
			CAPTION: 'Roles list',
			HEADER: {
				NAME: 'Name',
				CODE: 'Code',
				DESCRIPTION: 'Description',
			},
		},
		CREATE_DRAWER: {
			TITLE: 'Create Role',
			NAME: 'Name',
			CODE: 'Code',
			CODE_HINT: 'Auto-generated from name',
			DESCRIPTION: 'Description',
			PERMISSIONS: 'Permissions',
			SUCCESS_TOAST: 'Role created successfully.',
		},
		EDIT_DRAWER: {
			TITLE: 'Edit Role',
			NAME: 'Name',
			CODE: 'Code',
			CODE_HINT: 'Code cannot be changed',
			DESCRIPTION: 'Description',
			PERMISSIONS: 'Permissions',
			SUCCESS_TOAST: 'Role updated successfully.',
		},
		DELETE_TOAST: 'Role deleted successfully.',
	},
	PERMISSIONS: {
		PAGE: {
			NAV: 'Permissions',
			TITLE: 'Permissions',
			DESCRIPTION_INTRO: 'View all system permissions organized by resource. Each identifier follows the',
			DESCRIPTION_PATTERN: 'pattern.',
		},
		TABLE: {
			CAPTION: 'Permissions grouped by resource',
			HEADER: {
				RESOURCE: 'Resource',
				ACTION: 'Action',
				IDENTIFIER: 'Identifier',
				DESCRIPTION: 'Description',
			},
		},
		ERRORS: {
			ACCESS_DENIED: "You don't have permission to access that page.",
		},
	},
	SETTINGS: {
		NAV: 'Settings',
		TITLE: 'Settings',
		DESCRIPTION: 'Configure your application preferences.',
		LANGUAGE: {
			LABEL: 'Language',
			ENGLISH: 'English',
			SPANISH: 'Spanish',
		},
	},
	HEALTH: {
		NAV: 'Health',
		TITLE: 'Application Health Checker',
		LOADING: 'Loading...',
		STATUS_LABEL: 'Status:',
		DATE_TIME_LABEL: 'Date & Time:',
		CHECKS_HEADER: 'Checks',
		ERROR_TITLE: 'Error:',
		DATABASE: {
			HEADER: 'Database',
			STATUS: 'Status:',
			RESPONSE_TIME: 'Response Time:',
		},
	},
	DASHBOARD: {
		BREADCRUMB: 'Dashboard',
		SECTIONS: {
			SETTINGS: 'Settings & Maintenance',
			ADMIN: 'Administration',
		},
		HOME: {
			NAV: 'Initial Setup',
			NO_ACCESS_TITLE: 'No module access',
			NO_ACCESS_MESSAGE:
				"Your account doesn't have access to any modules yet. Contact your administrator to request the permissions you need.",
			DESCRIPTIONS: {
				WELCOME: 'Initial setup guide to prepare your application.',
				SETTINGS: 'Configure your application preferences and language.',
				HEALTH: 'Monitor the health and status of your application services.',
				USERS: 'Manage user accounts, their roles, and access permissions.',
				AUTHORIZATION: 'Manage roles and permissions that control access to the platform.',
			},
		},
		AUTHORIZATION: {
			NAV: 'Authorization',
			TITLE: 'Authorization',
			ROLES_CARD: {
				NAME: 'Roles',
				DESCRIPTION: 'Define roles and assign permissions to control access across the platform.',
			},
			PERMISSIONS_CARD: {
				NAME: 'Permissions',
				DESCRIPTION: 'View and manage the granular permission definitions available in the system.',
			},
		},
	},
	HTTP: {
		ERRORS: {
			FORBIDDEN: "You don't have permission to perform this action",
		},
	},
	DATA_TABLE: {
		EMPTY: 'No data available',
		LOADING: 'Loading...',
		TOGGLE: {
			TABLE: 'Table view',
			CARDS: 'Card view',
			GROUP_LABEL: 'Display mode',
		},
	},
	PAGINATION: {
		LABEL: 'Pagination',
		ROWS_PER_PAGE: 'Rows per page',
		GO_TO_PREVIOUS: 'Go to previous page',
		GO_TO_NEXT: 'Go to next page',
		GO_TO_PAGE: 'Go to page {page}',
		PAGE_OF: 'Page {current} of {total}',
	},
	VALIDATION: {
		REQUIRED: 'This field is required',
		EMAIL: 'Please enter a valid email address',
		MIN_LENGTH: 'Must be at least {min} characters',
		MAX_LENGTH: 'Must be no more than {max} characters',
		MIN: 'Must be at least {min}',
		MAX: 'Must be no more than {max}',
		PATTERN: 'Invalid format',
	},
}

export default en
