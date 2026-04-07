import type { TranslationSchema } from '@resetshop/angular-core/i18n/translations.schema'

const es: TranslationSchema = {
	AUTH: {
		LOGIN: {
			TITLE: 'Ingresar al sistema',
			EMAIL_LABEL: 'Dirección de email',
			PASSWORD_LABEL: 'Contraseña',
			FORGOT_PASSWORD: '¿Olvidaste tu contraseña?',
			SUBMIT: 'Iniciar sesión',
		},
		RESET_PASSWORD: {
			TITLE: 'Restablecer contraseña',
			EMAIL_LABEL: 'Dirección de email',
			SUBMIT: 'Enviar enlace de restablecimiento',
			BACK_TO_LOGIN: 'Volver al inicio de sesión',
		},
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
	COMMON: {
		LOADING: 'Cargando...',
		CANCEL: 'Cancelar',
		SAVE: 'Guardar',
		SAVING: 'Guardando...',
		CREATE: 'Crear',
		CREATING: 'Creando...',
		EDIT: 'Editar',
		DELETE: 'Eliminar',
		DISCARD: 'Descartar',
		CONFIRM: 'Confirmar',
		DISCARD_DIALOG: {
			TITLE: 'Descartar cambios',
			MESSAGE: 'Tienes cambios sin guardar. ¿Estás seguro de que deseas descartarlos?',
			CONFIRM: 'Descartar',
		},
		LOGOUT: 'Cerrar sesión',
		STATUS: {
			ACTIVE: 'Activo',
			DISABLED: 'Deshabilitado',
			DELETED: 'Eliminado',
		},
	},
	USERS: {
		PAGE: {
			NAV: 'Usuarios',
			TITLE: 'Usuarios',
			DESCRIPTION: 'Administrar usuarios del sistema, sus roles y estado de cuenta.',
			SEARCH: 'Buscar usuarios...',
			CREATE_BUTTON: 'Crear Usuario',
			DELETE_DIALOG: {
				TITLE: 'Eliminar Usuario',
				MESSAGE: "¿Estás seguro de que deseas eliminar al usuario '{name}'? Esta acción no se puede deshacer.",
			},
		},
		TABLE: {
			CAPTION: 'Lista de usuarios',
			HEADER: {
				NAME: 'Nombre',
				EMAIL: 'Correo Electrónico',
				STATUS: 'Estado',
				ROLES: 'Roles',
			},
		},
		CREATE_DRAWER: {
			TITLE: 'Crear Usuario',
			FIRST_NAME: 'Nombre',
			LAST_NAME: 'Apellido',
			EMAIL: 'Correo Electrónico',
			MUST_CHANGE_PASSWORD: 'Debe cambiar la contraseña al primer inicio de sesión',
			ROLES_LABEL: 'Roles',
			SUCCESS_TOAST: 'Usuario creado exitosamente.',
		},
		EDIT_DRAWER: {
			TITLE: 'Editar Usuario',
			FIRST_NAME: 'Nombre',
			LAST_NAME: 'Apellido',
			EMAIL: 'Correo Electrónico',
			ROLES_LABEL: 'Roles',
			SUCCESS_TOAST: 'Usuario actualizado exitosamente.',
		},
		DELETE_TOAST: 'Usuario eliminado exitosamente.',
	},
	ROLES: {
		PAGE: {
			NAV: 'Roles',
			TITLE: 'Roles',
			DESCRIPTION: 'Administrar roles del sistema y sus permisos asociados.',
			SEARCH: 'Buscar roles...',
			CREATE_BUTTON: 'Crear Rol',
			DELETE_DIALOG: {
				TITLE: 'Eliminar Rol',
				MESSAGE: "¿Estás seguro de que deseas eliminar el rol '{name}'? Esta acción no se puede deshacer.",
			},
		},
		TABLE: {
			CAPTION: 'Lista de roles',
			HEADER: {
				NAME: 'Nombre',
				CODE: 'Código',
				DESCRIPTION: 'Descripción',
			},
		},
		CREATE_DRAWER: {
			TITLE: 'Crear Rol',
			NAME: 'Nombre',
			CODE: 'Código',
			CODE_HINT: 'Generado automáticamente a partir del nombre',
			DESCRIPTION: 'Descripción',
			PERMISSIONS: 'Permisos',
			SUCCESS_TOAST: 'Rol creado exitosamente.',
		},
		EDIT_DRAWER: {
			TITLE: 'Editar Rol',
			NAME: 'Nombre',
			CODE: 'Código',
			CODE_HINT: 'El código no se puede cambiar',
			DESCRIPTION: 'Descripción',
			PERMISSIONS: 'Permisos',
			SUCCESS_TOAST: 'Rol actualizado exitosamente.',
		},
		DELETE_TOAST: 'Rol eliminado exitosamente.',
	},
	PERMISSIONS: {
		PAGE: {
			NAV: 'Permisos',
			TITLE: 'Permisos',
			DESCRIPTION_INTRO:
				'Ver todos los permisos del sistema organizados por recurso. Cada identificador sigue el patrón',
			DESCRIPTION_PATTERN: '.',
		},
		TABLE: {
			CAPTION: 'Permisos agrupados por recurso',
			HEADER: {
				RESOURCE: 'Recurso',
				ACTION: 'Acción',
				IDENTIFIER: 'Identificador',
				DESCRIPTION: 'Descripción',
			},
		},
	},
	SETTINGS: {
		NAV: 'Ajustes',
		TITLE: 'Ajustes',
		DESCRIPTION: 'Configura las preferencias de tu aplicación.',
		LANGUAGE: {
			LABEL: 'Idioma',
			ENGLISH: 'Inglés',
			SPANISH: 'Español',
		},
	},
	HEALTH: {
		NAV: 'Salud',
		TITLE: 'Verificador de Salud de la Aplicación',
		LOADING: 'Cargando...',
		STATUS_LABEL: 'Estado:',
		DATE_TIME_LABEL: 'Fecha y Hora:',
		CHECKS_HEADER: 'Controles',
		ERROR_TITLE: 'Error:',
		DATABASE: {
			HEADER: 'Base de Datos',
			STATUS: 'Estado:',
			RESPONSE_TIME: 'Tiempo de Respuesta:',
		},
	},
	DASHBOARD: {
		BREADCRUMB: 'Panel Principal',
		SECTIONS: {
			SETTINGS: 'Ajustes y Mantenimiento',
			ADMIN: 'Administración',
		},
		HOME: {
			NAV: 'Configuración Inicial',
			DESCRIPTIONS: {
				WELCOME: 'Guía de configuración inicial para preparar tu aplicación.',
				SETTINGS: 'Configura las preferencias de tu aplicación e idioma.',
				HEALTH: 'Monitorea el estado y la salud de los servicios de tu aplicación.',
				USERS: 'Gestiona las cuentas de usuario, sus roles y permisos de acceso.',
				AUTHORIZATION: 'Administra los roles y permisos que controlan el acceso a la plataforma.',
			},
		},
		AUTHORIZATION: {
			NAV: 'Autorización',
			TITLE: 'Autorización',
			ROLES_CARD: {
				NAME: 'Roles',
				DESCRIPTION: 'Define roles y asigna permisos para controlar el acceso a la plataforma.',
			},
			PERMISSIONS_CARD: {
				NAME: 'Permisos',
				DESCRIPTION: 'Consulta y gestiona las definiciones de permisos disponibles en el sistema.',
			},
		},
	},
	HTTP: {
		ERRORS: {
			FORBIDDEN: 'No tienes permiso para realizar esta acción',
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
	VALIDATION: {
		REQUIRED: 'Este campo es requerido',
		EMAIL: 'Ingrese un email válido',
		MIN_LENGTH: 'Debe tener al menos {min} caracteres',
		MAX_LENGTH: 'No debe tener más de {max} caracteres',
		MIN: 'Debe ser al menos {min}',
		MAX: 'No debe ser más de {max}',
		PATTERN: 'Formato inválido',
	},
}

export default es
