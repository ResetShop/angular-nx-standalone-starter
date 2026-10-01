export interface RepairStatus {
	readonly id: number
	readonly description: string
}

export interface DeviceType {
	readonly id: number
	readonly description: string
}

export interface RepairCustomer {
	readonly id: number | null
	readonly dni: number
	readonly firstName: string
	readonly lastName: string
	readonly fullName: string
	readonly email: string
	readonly address: string
	readonly telephone: string
	readonly birthDate: Date | null
}

export interface RepairDevice {
	readonly turnedOn: boolean
	readonly manufacturer: string
	readonly model: string
	readonly deviceId: string
	readonly type: DeviceType
}

export interface RepairPayment {
	readonly id: number | null
	readonly amount: number
	readonly date: Date | null
	readonly paymentMethodId: number
	readonly paymentMethodDescription: string
}

export interface Repair {
	readonly id: number | null
	readonly customer: RepairCustomer
	readonly device: RepairDevice
	readonly status: RepairStatus
	readonly issue: string
	readonly note: string
	readonly paymentInAdvance: number
	readonly price: number
	readonly cost: number
	readonly warrantyTerm: number
	readonly checkIn: Date | null
	readonly lastUpdate: Date | null
	readonly checkOut: Date | null
	readonly createdAt: Date | null
	readonly createdByUserName: string | null
	readonly payments: readonly RepairPayment[]
}

export interface RepairStatusEntry {
	readonly id: number
	readonly status: RepairStatus
	readonly cost: number
	readonly price: number
	readonly paymentInAdvance: number
	readonly note: string
	readonly userName: string | null
	readonly changedAt: Date | null
}

/**
 * Device data editable while a repair is open.
 */
export interface RepairDeviceChanges {
	readonly turnedOn: boolean
	readonly typeId: number
	readonly manufacturer: string
	readonly model: string
	readonly deviceId: string
	readonly issue: string
}

/**
 * Tracking data editable while a repair is open. `payments` are the cash transactions attached
 * to the repair, already resolved to their payment method description.
 */
export interface RepairTrackingChanges {
	readonly status: RepairStatus
	readonly note: string
	readonly price: number
	readonly cost: number
	readonly paymentInAdvance: number
	readonly warrantyTerm: number
	readonly payments: readonly RepairPayment[]
}

export interface RepairCustomerInput {
	readonly id: number | null
	readonly dni: number
	readonly firstName: string
	readonly lastName: string
	readonly email: string
	readonly address: string
	readonly telephone: string
	readonly birthDate: Date | null
}

/**
 * Everything the intake form captures to open a new repair.
 */
export interface RepairIntake {
	readonly customer: RepairCustomerInput
	readonly device: Omit<RepairDeviceChanges, 'issue'>
	readonly issue: string
	readonly note: string
	readonly status: RepairStatus
	readonly paymentInAdvance: number
	readonly price: number
	readonly cost: number
	readonly warrantyTerm: number
}
