import { Injectable, signal, effect, inject, PLATFORM_ID, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ThemeProvider } from './theme.abstract';

export const provideTheme = () => [
	{
		provide: ThemeProvider,
		useClass: Theme,
	},
];

@Injectable()
export class Theme extends ThemeProvider {
	private readonly THEME_STORAGE_KEY = 'theme-preference';
	private readonly platformId = inject(PLATFORM_ID);
	private readonly isBrowser = isPlatformBrowser(this.platformId);

	readonly isDarkMode = computed(() => this._isDarkMode());
	private readonly _isDarkMode = signal<boolean>(this.getInitialTheme());

	constructor() {
		super();
		effect(() => {
			this.persistTheme(this._isDarkMode());
		});
	}

	toggleTheme(): void {
		this._isDarkMode.update((current) => !current);
		this.applyTheme();
	}

	applyTheme(): void {
		if (!this.isBrowser) {
			return;
		}

		const htmlElement = document.documentElement;
		if (this._isDarkMode()) {
			htmlElement.classList.add('dark');
		} else {
			htmlElement.classList.remove('dark');
		}
	}

	private getInitialTheme(): boolean {
		if (!this.isBrowser) {
			return false;
		}

		const stored = localStorage.getItem(this.THEME_STORAGE_KEY);
		if (stored !== null) {
			return stored === 'dark';
		}

		return window.matchMedia('(prefers-color-scheme: dark)').matches;
	}

	private persistTheme(isDark: boolean): void {
		if (!this.isBrowser) {
			return;
		}

		localStorage.setItem(this.THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
	}
}
