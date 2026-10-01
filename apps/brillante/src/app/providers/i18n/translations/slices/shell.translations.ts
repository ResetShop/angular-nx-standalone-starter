export const shellEn = {
	SHELL: {
		NAV: {
			HOME: 'Home',
			CLIENTS: 'Clients',
			REPAIRS: 'Repairs',
			CASH: 'Cash',
			REPORTS: 'Reports',
			SETTINGS: 'Settings',
			SECTIONS: {
				OPERATIONS: 'Operations',
				MANAGEMENT: 'Management',
			},
		},
		LOGIN: {
			PAGE_TITLE: 'Sign in',
			TITLE: 'Brillante Store',
			DESCRIPTION: 'Shine - management system. Sign in with your Brillante account to continue.',
			BUTTON: 'Sign in',
			SIGNING_IN: 'Signing in...',
			ERROR: 'We could not sign you in. Please try again.',
			NO_ACCOUNT: 'Your Auth0 session is not linked to a Brillante user yet. Contact an administrator.',
		},
		HOME: {
			WELCOME: 'Hello, {name}',
			DESCRIPTION: 'Pick a module to get started.',
			NO_ACCESS_TITLE: 'No module access',
			NO_ACCESS_MESSAGE:
				"Your account doesn't have access to any modules yet. Contact an administrator to request the permissions you need.",
			CARDS: {
				CLIENTS: 'Look up customers and manage their contact details.',
				REPAIRS: 'Track repair orders, statuses and deliveries.',
				CASH: 'Register incomes and expenses and close the cash register.',
				REPORTS: 'Review cash movements over any period.',
				SETTINGS: 'Branches, users and cash concepts.',
			},
		},
		OFFICE_BRANCH: {
			LABEL: 'Branch',
			NONE: 'None',
			NOT_ASSIGNED: 'Please assign a branch to access this module.',
		},
		ERRORS: {
			GENERIC: 'Something went wrong. Please try again.',
			UNAUTHORIZED: 'Your session has expired. Please sign in again.',
		},
	},
}

export const shellEs: typeof shellEn = {
	SHELL: {
		NAV: {
			HOME: 'Inicio',
			CLIENTS: 'Clientes',
			REPAIRS: 'Reparaciones',
			CASH: 'Caja',
			REPORTS: 'Reportes',
			SETTINGS: 'Configuración',
			SECTIONS: {
				OPERATIONS: 'Operaciones',
				MANAGEMENT: 'Administración',
			},
		},
		LOGIN: {
			PAGE_TITLE: 'Iniciar sesión',
			TITLE: 'Brillante Store',
			DESCRIPTION: 'Shine - Sistema de gestión. Iniciá sesión con tu cuenta de Brillante para continuar.',
			BUTTON: 'Iniciar sesión',
			SIGNING_IN: 'Iniciando sesión...',
			ERROR: 'No pudimos iniciar tu sesión. Intentá nuevamente.',
			NO_ACCOUNT:
				'Tu sesión de Auth0 todavía no está vinculada a un usuario de Brillante. Contactá a un administrador.',
		},
		HOME: {
			WELCOME: 'Hola, {name}',
			DESCRIPTION: 'Elegí un módulo para comenzar.',
			NO_ACCESS_TITLE: 'Sin acceso a módulos',
			NO_ACCESS_MESSAGE:
				'Tu cuenta todavía no tiene acceso a ningún módulo. Contactá a un administrador para solicitar los permisos que necesitás.',
			CARDS: {
				CLIENTS: 'Buscá clientes y gestioná sus datos de contacto.',
				REPAIRS: 'Seguí las órdenes de reparación, sus estados y entregas.',
				CASH: 'Registrá ingresos y egresos y cerrá la caja.',
				REPORTS: 'Revisá los movimientos de caja de cualquier período.',
				SETTINGS: 'Sucursales, usuarios y conceptos de caja.',
			},
		},
		OFFICE_BRANCH: {
			LABEL: 'Sucursal',
			NONE: 'Ninguna',
			NOT_ASSIGNED: 'Por favor asigná una sucursal para poder acceder al módulo.',
		},
		ERRORS: {
			GENERIC: 'Algo salió mal. Intentá nuevamente.',
			UNAUTHORIZED: 'Tu sesión expiró. Iniciá sesión nuevamente.',
		},
	},
}
