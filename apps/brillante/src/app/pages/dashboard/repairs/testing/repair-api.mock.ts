import type { PaymentMethodApi } from '@providers/payment-method/payment-method.interface'
import { fn, type MockFn } from '@resetshop/util/test-utils'
import type { RepairApi } from '../repair.interface'

/**
 * Structurally linked mock of the repair API: every method is a `fn()` the spec configures.
 */
export function createRepairApiMock(): Record<keyof RepairApi, MockFn> {
	return {
		getAll: fn(),
		getAllByDate: fn(),
		getById: fn(),
		getHistory: fn(),
		getByClientId: fn(),
		create: fn(),
		updateDeviceInfo: fn(),
		updateTrackingInfo: fn(),
		delete: fn(),
		getStatuses: fn(),
	}
}

export function createPaymentMethodApiMock(): Record<keyof PaymentMethodApi, MockFn> {
	return { getAll: fn() }
}
