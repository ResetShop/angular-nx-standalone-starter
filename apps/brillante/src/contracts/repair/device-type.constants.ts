import type { DeviceTypeDto } from './repair.types'

/**
 * Device types accepted by the API. The catalogue is not served by any endpoint, so the ids are
 * fixed here.
 */
export const DEVICE_TYPES: readonly DeviceTypeDto[] = Object.freeze([
	{ id: 0, description: 'Smartphone' },
	{ id: 1, description: 'Tablet' },
	{ id: 2, description: 'Laptop' },
	{ id: 3, description: 'Escritorio' },
	{ id: 4, description: 'Smartwatch' },
	{ id: 5, description: 'Parlantes' },
])
