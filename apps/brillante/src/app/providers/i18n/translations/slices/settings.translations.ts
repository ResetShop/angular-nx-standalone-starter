export const settingsEn = {
	SETTINGS_HOME: {
		SECTIONS_TITLE: 'Management',
		LANGUAGE_TITLE: 'Preferences',
		CARDS: {
			OFFICE_BRANCHES: {
				TITLE: 'Branches',
				DESCRIPTION: 'Choose the branch this browser works on and add new branches.',
			},
			USER_MANAGEMENT: {
				TITLE: 'User management',
				DESCRIPTION: 'Edit users, assign their roles and disable or delete their accounts.',
			},
			CASH_CONCEPTS: {
				TITLE: 'Cash concepts',
				DESCRIPTION: 'Manage the concepts and subconcepts cash transactions are filed under.',
			},
		},
	},
	OFFICE_BRANCHES: {
		NAV: 'Branches',
		TITLE: 'Branches',
		DESCRIPTION: 'The assigned branch is the one new repairs, clients and cash transactions are recorded for.',
		CURRENT: {
			LABEL: 'Assigned branch',
			NONE: 'No branch assigned',
		},
		ADD_BUTTON: 'Add branch',
		ASSIGN: 'Assign',
		ASSIGNED: 'Assigned',
		ASSIGN_TOAST: 'Branch {name} assigned',
		TABLE: {
			CAPTION: 'Branches list',
			HEADER: {
				NAME: 'Name',
				ADDRESS: 'Address',
			},
		},
		ADD: {
			TITLE: 'Add branch',
			DESCRIPTION: 'Register a new branch. You can assign it to this browser afterwards.',
			NAME: 'Name',
			ADDRESS: 'Address',
			SUBMIT: 'Create branch',
			SUCCESS_TOAST: 'Branch created successfully.',
			BACK: 'Back to branches',
		},
	},
	MANAGED_USERS: {
		NAV: 'User management',
		TITLE: 'User management',
		DESCRIPTION: 'Edit users, assign their roles and disable or delete their accounts.',
		SEARCH: 'Search users...',
		NO_ROLES: 'No roles',
		TABLE: {
			CAPTION: 'Users list',
			HEADER: {
				NAME: 'Name',
				EMAIL: 'Email',
				ROLES: 'Roles',
				STATUS: 'Status',
			},
		},
		ROLES: {
			ADMIN: 'Administrator',
			OWNER: 'Owner',
			COUNTER_CLERK: 'Counter clerk',
			REPAIRMAN: 'Repairman',
			CUSTOMER: 'Customer',
			EMPLOYEE: 'Employee',
			ACCOUNTANT: 'Accountant',
		},
		DRAWER: {
			EDIT_TITLE: 'Edit user',
			FIRST_NAME: 'First name',
			LAST_NAME: 'Last name',
			EMAIL: 'Email',
			ROLES_LABEL: 'Roles',
			OWN_ROLES_NOTE: 'You cannot change your own roles.',
			LOCKED_ROLES_NOTE: 'Roles already assigned cannot be removed.',
		},
		STATUS: {
			ACTIVE: 'Active',
			DISABLED: 'Disabled',
		},
		ACTIONS: {
			DISABLE: 'Disable',
			ENABLE: 'Enable',
			RESET_PASSWORD: 'Reset password',
		},
		RESET_DIALOG: {
			TITLE: 'Reset password',
			MESSAGE:
				"Reset the password of '{name}'? A temporary password will be emailed to {email}, and it must be changed at the next sign-in. The current password stops working now.",
			CONFIRM: 'Reset password',
		},
		DELETE_DIALOG: {
			TITLE: 'Delete user',
			MESSAGE: "Are you sure you want to delete '{name}'? This action cannot be undone.",
		},
		SUCCESS: {
			UPDATED: 'User updated successfully.',
			DELETED: 'User deleted successfully.',
			PASSWORD_RESET: 'Password reset. The temporary password is being emailed to the user.',
		},
		ERRORS: {
			LOAD: 'Failed to load users',
			RESET_PASSWORD: 'Failed to reset the password',
			UPDATE: 'Failed to update user',
			DELETE: 'Failed to delete user',
		},
	},
	CASH_CONCEPTS: {
		NAV: 'Cash concepts',
		TITLE: 'Cash concepts',
		DESCRIPTION: 'Concepts and subconcepts that cash transactions are filed under.',
		NEW_CONCEPT: 'New concept',
		NEW_SUBCONCEPT: 'New subconcept',
		YES: 'Yes',
		NO: 'No',
		FILTER: {
			LABEL: 'Transaction type',
			ALL: 'All types',
		},
		TYPE: {
			INCOME: 'Income',
			EXPENSE: 'Expense',
		},
		STATUS: {
			ENABLED: 'Enabled',
			DISABLED: 'Disabled',
		},
		TABLE: {
			CAPTION: 'Cash concepts list',
			HEADER: {
				DESCRIPTION: 'Description',
				TYPE: 'Type',
				PARENT: 'Concept',
				MODIFIABLE: 'Modifiable',
				STATUS: 'Status',
			},
		},
		ACTIONS: {
			ADD_SUBCONCEPT: 'Add subconcept',
			ENABLE: 'Enable',
			DISABLE: 'Disable',
		},
		DRAWER: {
			CREATE_CONCEPT_TITLE: 'New concept',
			CREATE_SUBCONCEPT_TITLE: 'New subconcept',
			EDIT_TITLE: 'Edit concept',
			DESCRIPTION: 'Description',
			TYPE: 'Transaction type',
			PARENT: 'Concept',
			PARENT_PLACEHOLDER: 'Select a concept',
			MODIFIABLE: 'Modifiable',
			USER_ASSIGNABLE: 'Assignable by the user',
		},
		SUCCESS: {
			CREATED: 'Concept created successfully.',
			UPDATED: 'Concept updated successfully.',
			ENABLED: 'Concept enabled successfully.',
			DISABLED: 'Concept disabled successfully.',
		},
		ERRORS: {
			LOAD: 'Failed to load cash concepts',
			CREATE: 'Failed to create the concept',
			UPDATE: 'Failed to update the concept',
			SET_ENABLED: 'Failed to change the status of the concept',
		},
	},
}

export const settingsEs: typeof settingsEn = {
	SETTINGS_HOME: {
		SECTIONS_TITLE: 'Gestión',
		LANGUAGE_TITLE: 'Preferencias',
		CARDS: {
			OFFICE_BRANCHES: {
				TITLE: 'Sucursales',
				DESCRIPTION: 'Elegí la sucursal en la que trabaja este navegador y agregá nuevas sucursales.',
			},
			USER_MANAGEMENT: {
				TITLE: 'Gestión de usuarios',
				DESCRIPTION: 'Editá usuarios, asignales roles y deshabilitá o eliminá sus cuentas.',
			},
			CASH_CONCEPTS: {
				TITLE: 'Conceptos de caja',
				DESCRIPTION: 'Gestioná los conceptos y subconceptos bajo los que se registran los movimientos de caja.',
			},
		},
	},
	OFFICE_BRANCHES: {
		NAV: 'Sucursales',
		TITLE: 'Sucursales',
		DESCRIPTION:
			'La sucursal asignada es aquella para la que se registran reparaciones, clientes y movimientos de caja.',
		CURRENT: {
			LABEL: 'Sucursal asignada',
			NONE: 'Ninguna sucursal asignada',
		},
		ADD_BUTTON: 'Agregar sucursal',
		ASSIGN: 'Asignar',
		ASSIGNED: 'Asignada',
		ASSIGN_TOAST: 'Sucursal {name} asignada',
		TABLE: {
			CAPTION: 'Lista de sucursales',
			HEADER: {
				NAME: 'Nombre',
				ADDRESS: 'Dirección',
			},
		},
		ADD: {
			TITLE: 'Agregar sucursal',
			DESCRIPTION: 'Registrá una nueva sucursal. Después podés asignarla a este navegador.',
			NAME: 'Nombre',
			ADDRESS: 'Dirección',
			SUBMIT: 'Crear sucursal',
			SUCCESS_TOAST: 'Sucursal creada correctamente.',
			BACK: 'Volver a sucursales',
		},
	},
	MANAGED_USERS: {
		NAV: 'Gestión de usuarios',
		TITLE: 'Gestión de usuarios',
		DESCRIPTION: 'Editá usuarios, asignales roles y deshabilitá o eliminá sus cuentas.',
		SEARCH: 'Buscar usuarios...',
		NO_ROLES: 'Sin roles',
		TABLE: {
			CAPTION: 'Lista de usuarios',
			HEADER: {
				NAME: 'Nombre',
				EMAIL: 'Correo electrónico',
				ROLES: 'Roles',
				STATUS: 'Estado',
			},
		},
		ROLES: {
			ADMIN: 'Administrador',
			OWNER: 'Dueño',
			COUNTER_CLERK: 'Encargado de local',
			REPAIRMAN: 'Técnico',
			CUSTOMER: 'Cliente',
			EMPLOYEE: 'Empleado',
			ACCOUNTANT: 'Contador',
		},
		DRAWER: {
			EDIT_TITLE: 'Editar usuario',
			FIRST_NAME: 'Nombre',
			LAST_NAME: 'Apellido',
			EMAIL: 'Correo electrónico',
			ROLES_LABEL: 'Roles',
			OWN_ROLES_NOTE: 'No podés cambiar tus propios roles.',
			LOCKED_ROLES_NOTE: 'Los roles ya asignados no se pueden quitar.',
		},
		STATUS: {
			ACTIVE: 'Activo',
			DISABLED: 'Deshabilitado',
		},
		ACTIONS: {
			DISABLE: 'Deshabilitar',
			ENABLE: 'Habilitar',
			RESET_PASSWORD: 'Restablecer contraseña',
		},
		RESET_DIALOG: {
			TITLE: 'Restablecer contraseña',
			MESSAGE:
				"¿Querés restablecer la contraseña de '{name}'? Se le va a enviar una contraseña temporal a {email}, y deberá cambiarla en su próximo ingreso. La contraseña actual deja de funcionar ahora.",
			CONFIRM: 'Restablecer contraseña',
		},
		DELETE_DIALOG: {
			TITLE: 'Eliminar usuario',
			MESSAGE: "¿Seguro que querés eliminar a '{name}'? Esta acción no se puede deshacer.",
		},
		SUCCESS: {
			UPDATED: 'Usuario actualizado correctamente.',
			DELETED: 'Usuario eliminado correctamente.',
			PASSWORD_RESET: 'Contraseña restablecida. La contraseña temporal se está enviando por correo al usuario.',
		},
		ERRORS: {
			LOAD: 'No se pudieron cargar los usuarios',
			RESET_PASSWORD: 'No se pudo restablecer la contraseña',
			UPDATE: 'No se pudo actualizar el usuario',
			DELETE: 'No se pudo eliminar el usuario',
		},
	},
	CASH_CONCEPTS: {
		NAV: 'Conceptos de caja',
		TITLE: 'Conceptos de caja',
		DESCRIPTION: 'Conceptos y subconceptos bajo los que se registran los movimientos de caja.',
		NEW_CONCEPT: 'Nuevo concepto',
		NEW_SUBCONCEPT: 'Nuevo subconcepto',
		YES: 'Sí',
		NO: 'No',
		FILTER: {
			LABEL: 'Tipo de transacción',
			ALL: 'Todos los tipos',
		},
		TYPE: {
			INCOME: 'Ingreso',
			EXPENSE: 'Egreso',
		},
		STATUS: {
			ENABLED: 'Habilitado',
			DISABLED: 'Deshabilitado',
		},
		TABLE: {
			CAPTION: 'Lista de conceptos de caja',
			HEADER: {
				DESCRIPTION: 'Descripción',
				TYPE: 'Tipo',
				PARENT: 'Concepto',
				MODIFIABLE: 'Modificable',
				STATUS: 'Estado',
			},
		},
		ACTIONS: {
			ADD_SUBCONCEPT: 'Agregar subconcepto',
			ENABLE: 'Habilitar',
			DISABLE: 'Deshabilitar',
		},
		DRAWER: {
			CREATE_CONCEPT_TITLE: 'Nuevo concepto',
			CREATE_SUBCONCEPT_TITLE: 'Nuevo subconcepto',
			EDIT_TITLE: 'Editar concepto',
			DESCRIPTION: 'Descripción',
			TYPE: 'Tipo de transacción',
			PARENT: 'Concepto',
			PARENT_PLACEHOLDER: 'Seleccioná un concepto',
			MODIFIABLE: 'Modificable',
			USER_ASSIGNABLE: 'Asignable por el usuario',
		},
		SUCCESS: {
			CREATED: 'Concepto creado correctamente.',
			UPDATED: 'Concepto actualizado correctamente.',
			ENABLED: 'Concepto habilitado correctamente.',
			DISABLED: 'Concepto deshabilitado correctamente.',
		},
		ERRORS: {
			LOAD: 'No se pudieron cargar los conceptos de caja',
			CREATE: 'No se pudo crear el concepto',
			UPDATE: 'No se pudo actualizar el concepto',
			SET_ENABLED: 'No se pudo cambiar el estado del concepto',
		},
	},
}
