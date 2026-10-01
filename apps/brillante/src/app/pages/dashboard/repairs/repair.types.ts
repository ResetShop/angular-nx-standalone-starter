import type { PaymentMethodDto } from '@contracts/cash/payment-method.types'
import type { Repair, RepairStatus, RepairStatusEntry } from '@domain/repair/repair.model'

export interface RepairReadError {
	list: string | null
	detail: string | null
	history: string | null
	statuses: string | null
	paymentMethods: string | null
}

export interface RepairMutationError {
	updateDevice: string | null
	updateTracking: string | null
	delete: string | null
}

/**
 * Parameters that change what the API returns for the list. Both dates must be set for the
 * date range to apply; otherwise every repair matching `showFinished` is requested.
 */
export interface RepairListParams {
	showFinished: boolean
	dateFrom: Date | null
	dateTo: Date | null
}

export interface RepairState {
	repairs: Repair[]
	selectedRepair: Repair | null
	history: RepairStatusEntry[]
	statuses: RepairStatus[]
	paymentMethods: PaymentMethodDto[]
	showFinished: boolean
	dateFrom: Date | null
	dateTo: Date | null
	statusFilter: number | null
	searchQuery: string
	currentPage: number
	pageSize: number
	isLoadingList: boolean
	isLoadingDetail: boolean
	isLoadingHistory: boolean
	isUpdatingDevice: boolean
	isUpdatingTracking: boolean
	isDeleting: boolean
	readError: RepairReadError
	mutationError: RepairMutationError
}

export const initialRepairReadError: RepairReadError = {
	list: null,
	detail: null,
	history: null,
	statuses: null,
	paymentMethods: null,
}

export const initialRepairMutationError: RepairMutationError = {
	updateDevice: null,
	updateTracking: null,
	delete: null,
}

export const initialRepairState: RepairState = {
	repairs: [],
	selectedRepair: null,
	history: [],
	statuses: [],
	paymentMethods: [],
	showFinished: false,
	dateFrom: null,
	dateTo: null,
	statusFilter: null,
	searchQuery: '',
	currentPage: 1,
	pageSize: 15,
	isLoadingList: false,
	isLoadingDetail: false,
	isLoadingHistory: false,
	isUpdatingDevice: false,
	isUpdatingTracking: false,
	isDeleting: false,
	readError: initialRepairReadError,
	mutationError: initialRepairMutationError,
}
