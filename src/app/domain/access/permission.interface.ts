export interface IPermission {
	readonly id: number
	readonly name: string
	readonly description: string | null
	readonly resource: string
	readonly action: string
	readonly identifier: string

	matches(resource: string, action: string): boolean
}
