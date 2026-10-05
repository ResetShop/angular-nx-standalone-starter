import { inject, Injectable } from '@angular/core'
import { parseDurationToMs } from '@resetshop/util'
import { finalize, map, type Observable, of, shareReplay, tap } from 'rxjs'
import { AuthApi } from './auth.interface'

/**
 * Holds the token the legacy API accepts. The legacy API cannot read the cookie session, so the backend issues a
 * short-lived token for the signed-in user on request; it is kept in memory only (never in storage) and renewed a
 * minute before it expires. Concurrent callers share one request.
 */
@Injectable({ providedIn: 'root' })
export class LegacyTokenSession {
	private readonly authApi = inject(AuthApi)

	private token: string | null = null
	private expiresAt = 0
	private inFlight: Observable<string> | null = null
	/** Bumped by `clear()`: a token issued for a request that started before it must not be cached afterwards. */
	private generation = 0

	/** A usable token: the cached one while it is not about to expire, otherwise a freshly issued one. */
	public get(): Observable<string> {
		const renewBefore = parseDurationToMs('1m')
		if (this.token && Date.now() < this.expiresAt - renewBefore) {
			return of(this.token)
		}
		return this.fetch()
	}

	/** Drops the cached token and issues a new one, for when the legacy API rejected the current one. */
	public renew(): Observable<string> {
		this.token = null
		return this.fetch()
	}

	/** Forgets the token, on sign-out. */
	public clear(): void {
		this.generation++
		this.inFlight = null
		this.token = null
		this.expiresAt = 0
	}

	private fetch(): Observable<string> {
		const generation = this.generation
		this.inFlight ??= this.authApi.getLegacyToken().pipe(
			tap((response) => {
				if (generation !== this.generation) return
				this.token = response.token
				this.expiresAt = new Date(response.expiresAt).getTime()
			}),
			map((response) => response.token),
			finalize(() => {
				if (generation === this.generation) this.inFlight = null
			}),
			shareReplay({ bufferSize: 1, refCount: false }),
		)
		return this.inFlight
	}
}
