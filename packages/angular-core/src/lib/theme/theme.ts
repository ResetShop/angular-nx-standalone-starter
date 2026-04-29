import { isPlatformBrowser } from '@angular/common'
import { computed, effect, inject, Injectable, makeEnvironmentProviders, PLATFORM_ID, signal } from '@angular/core'
import { ThemeProvider } from './theme.abstract'

export function provideTheme() {
	return makeEnvironmentProviders([{ provide: ThemeProvider, useClass: Theme }])
}

@Injectable({ providedIn: 'root' })
export class Theme extends ThemeProvider {
	private readonly THEME_STORAGE_KEY = 'theme-preference'
	private readonly platformId = inject(PLATFORM_ID)
	private readonly isBrowser = isPlatformBrowser(this.platformId)

	public override readonly isDarkMode = computed(() => this._isDarkMode())
	private readonly _isDarkMode = signal<boolean>(this.getInitialTheme())

	private readonly persistThemeEffect = effect(() => {
		this.persistTheme(this._isDarkMode())
	})

	public override toggleTheme(): void {
		this._isDarkMode.update((current) => !current)
		this.applyTheme()
	}

	public override applyTheme(): void {
		if (!this.isBrowser) {
			return
		}

		const transition = document.startViewTransition.bind(document)
		const updateTheme = () => {
			const htmlElement = document.documentElement
			if (this._isDarkMode()) {
				htmlElement.classList.add('dark')
			} else {
				htmlElement.classList.remove('dark')
			}
		}

		if (transition) {
			transition(updateTheme)
		} else {
			updateTheme()
		}
	}

	private getInitialTheme(): boolean {
		if (!this.isBrowser) {
			return false
		}

		const stored = localStorage.getItem(this.THEME_STORAGE_KEY)
		if (stored !== null) {
			return stored === 'dark'
		}

		return window.matchMedia('(prefers-color-scheme: dark)').matches
	}

	private persistTheme(isDark: boolean): void {
		if (!this.isBrowser) {
			return
		}

		localStorage.setItem(this.THEME_STORAGE_KEY, isDark ? 'dark' : 'light')
	}
}
