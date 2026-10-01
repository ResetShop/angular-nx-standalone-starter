export interface OfficeBranchDto {
	id: number
	name: string
	address: string
}

export type CreateOfficeBranchRequest = Omit<OfficeBranchDto, 'id'>
