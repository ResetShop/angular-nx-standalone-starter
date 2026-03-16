import type { IPermission } from './permission.interface'

export class Permission implements IPermission {
	readonly id: number
	readonly name: string
	readonly description: string | null
	readonly resource: string
	readonly action: string

	constructor(id: number, name: string, description: string | null, resource: string, action: string) {
		this.id = id
		this.name = name
		this.description = description
		this.resource = resource
		this.action = action
	}

	get identifier(): string {
		return `${this.resource}:${this.action}`
	}

	matches(resource: string, action: string): boolean {
		return this.resource === resource && this.action === action
	}
}
