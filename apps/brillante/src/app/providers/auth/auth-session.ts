import { Injectable, signal } from '@angular/core'
import type { AuthenticatedUserDto } from '@contracts/user/legacy-user.types'

const SESSION_STORAGE_KEY = 'currentUser'

/**
 * Persists the API session (user + JWT) in localStorage so a page reload keeps the user signed in,
 * and exposes the token synchronously for the HTTP interceptor.
 */
@Injectable({ providedIn: 'root' })
export class AuthSession {
	private readonly state = signal<AuthenticatedUserDto | null>(this.readStored())

	public read(): AuthenticatedUserDto | null {
		return this.state()
	}

	public get token(): string | null {
		return this.state()?.token ?? null
	}

	public write(session: AuthenticatedUserDto): void {
		localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
		this.state.set(session)
	}

	public clear(): void {
		localStorage.removeItem(SESSION_STORAGE_KEY)
		this.state.set(null)
	}

	private readStored(): AuthenticatedUserDto | null {
		const raw = localStorage.getItem(SESSION_STORAGE_KEY)
		if (!raw) return null
		try {
			const parsed = JSON.parse(raw) as AuthenticatedUserDto
			return parsed?.token ? parsed : null
		} catch {
			localStorage.removeItem(SESSION_STORAGE_KEY)
			return null
		}
	}
}
