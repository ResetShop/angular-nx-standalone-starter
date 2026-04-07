import { Signal } from '@angular/core'

export abstract class ThemeProvider {
	public abstract readonly isDarkMode: Signal<boolean>

	public abstract toggleTheme(): void
	public abstract applyTheme(): void
}
