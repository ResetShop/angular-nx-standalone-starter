import type { OfficeBranchDto } from '@contracts/office-branch/office-branch.types'

export interface OfficeBranchReadError {
	list: string | null
}

export interface OfficeBranchMutationError {
	create: string | null
}

export interface OfficeBranchState {
	branches: OfficeBranchDto[]
	currentBranch: OfficeBranchDto | null
	isLoadingList: boolean
	isCreating: boolean
	readError: OfficeBranchReadError
	mutationError: OfficeBranchMutationError
}

export const initialOfficeBranchState: OfficeBranchState = {
	branches: [],
	currentBranch: null,
	isLoadingList: false,
	isCreating: false,
	readError: { list: null },
	mutationError: { create: null },
}
