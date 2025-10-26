import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, linkedSignal, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { LoginFormParams, LoginResponse } from '@interfaces/auth';
import { of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class Auth {
	private http = inject(HttpClient);

	readonly currentUser = computed(() => this._currentUser());
	readonly isAuthenticated = computed(() => !!this._currentUser());

	readonly loginRequestParams = signal<LoginFormParams | null>(null);
	private readonly _currentUser = linkedSignal(() => this.authResource.value());

	private authResource = rxResource({
		params: this.loginRequestParams,
		stream: ({ params }) => {
			if (!params) {
				return of(null);
			}
			return this.http.post<LoginResponse>('/api/auth/login', params);
		},
	});

	logout() {
		this._currentUser.set(null);
		localStorage.removeItem('auth_token');
	}
}
