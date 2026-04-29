import { computed, makeEnvironmentProviders, signal } from '@angular/core'
import { ThemeProvider } from './theme.abstract'

export function provideMockTheme(isDarkModeInitial: boolean = false) {
	return makeEnvironmentProviders([{ provide: ThemeProvider, useValue: new ThemeMock(isDarkModeInitial) }])
}

export class ThemeMock extends ThemeProvider {
	private readonly _isDarkMode = signal<boolean>(false)
	public override readonly isDarkMode = computed(() => this._isDarkMode())

	constructor(isDarkModeInitial: boolean = false) {
		super()
		this._isDarkMode.set(isDarkModeInitial)
	}

	public override toggleTheme(): void {
		this._isDarkMode.update((current) => !current)
		this.applyTheme()
	}

	public override applyTheme(): void {
		if (this._isDarkMode()) {
			document.documentElement.classList.add('dark')
		} else {
			document.documentElement.classList.remove('dark')
		}
	}

	public setDarkMode(isDark: boolean): void {
		this._isDarkMode.set(isDark)
		this.applyTheme()
	}
}
