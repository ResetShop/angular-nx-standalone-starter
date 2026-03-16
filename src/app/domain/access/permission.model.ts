import type { IPermission } from './permission.interface'

export class Permission implements IPermission {
	public readonly id: number
	public readonly name: string
	public readonly description: string | null
	public readonly resource: string
	public readonly action: string

	constructor(id: number, name: string, description: string | null, resource: string, action: string) {
		this.id = id
		this.name = name
		this.description = description
		this.resource = resource
		this.action = action
	}

	public get identifier(): string {
		return `${this.resource}:${this.action}`
	}

	public matches(resource: string, action: string): boolean {
		return this.resource === resource && this.action === action
	}
}
