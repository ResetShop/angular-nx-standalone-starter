export const clientsEn = {
	CLIENTS: {
		PAGE: {
			TITLE: 'Clients',
			DESCRIPTION: 'Look up customers and keep their contact details up to date.',
			SEARCH: 'Search by DNI or email...',
			SEARCH_LABEL: 'Search clients',
			SEARCH_HINT: 'Type a full DNI (digits only) or a full email address.',
			CREATE_BUTTON: 'New client',
		},
		TABLE: {
			CAPTION: 'Clients list',
			HEADER: {
				ID: 'ID',
				DNI: 'DNI',
				NAME: 'Name',
				EMAIL: 'Email',
				TELEPHONE: 'Telephone',
				BIRTH_DATE: 'Birth date',
			},
			NO_BIRTH_DATE: 'Not registered',
		},
		CREATE_DRAWER: {
			TITLE: 'New client',
			SUCCESS_TOAST: 'Client created successfully.',
			EXISTING_TOAST: 'A client with that DNI was already registered, so no new client was created.',
		},
		EDIT_DRAWER: {
			TITLE: 'Edit client',
			SUCCESS_TOAST: 'Client updated successfully.',
		},
	},
	CLIENT_FORM: {
		DNI: 'DNI',
		FIRST_NAME: 'First name',
		LAST_NAME: 'Last name',
		EMAIL: 'Email',
		BIRTH_DATE: 'Birth date',
		ADDRESS: 'Address',
		TELEPHONE: 'Telephone',
		TELEPHONE_HINT: 'Digits only',
		ERRORS: {
			FUTURE_BIRTH_DATE: 'The birth date cannot be in the future',
		},
	},
}

export const clientsEs: typeof clientsEn = {
	CLIENTS: {
		PAGE: {
			TITLE: 'Clientes',
			DESCRIPTION: 'Buscá clientes y mantené sus datos de contacto actualizados.',
			SEARCH: 'Buscar por DNI o email...',
			SEARCH_LABEL: 'Buscar clientes',
			SEARCH_HINT: 'Ingresá un DNI completo (sólo números) o un email completo.',
			CREATE_BUTTON: 'Nuevo cliente',
		},
		TABLE: {
			CAPTION: 'Listado de clientes',
			HEADER: {
				ID: 'ID',
				DNI: 'DNI',
				NAME: 'Nombre',
				EMAIL: 'Email',
				TELEPHONE: 'Teléfono',
				BIRTH_DATE: 'Natalicio',
			},
			NO_BIRTH_DATE: 'No registrado',
		},
		CREATE_DRAWER: {
			TITLE: 'Nuevo cliente',
			SUCCESS_TOAST: 'Cliente creado correctamente.',
			EXISTING_TOAST: 'Ya había un cliente registrado con ese DNI, por lo que no se creó uno nuevo.',
		},
		EDIT_DRAWER: {
			TITLE: 'Editar cliente',
			SUCCESS_TOAST: 'Datos del cliente actualizados correctamente.',
		},
	},
	CLIENT_FORM: {
		DNI: 'DNI',
		FIRST_NAME: 'Nombre',
		LAST_NAME: 'Apellido',
		EMAIL: 'Email',
		BIRTH_DATE: 'Fecha de nacimiento',
		ADDRESS: 'Dirección',
		TELEPHONE: 'Teléfono',
		TELEPHONE_HINT: 'Sólo números',
		ERRORS: {
			FUTURE_BIRTH_DATE: 'La fecha de nacimiento no puede ser futura',
		},
	},
}
