import { Signal } from '@angular/core'

export abstract class ThemeProvider {
	abstract readonly isDarkMode: Signal<boolean>

	abstract toggleTheme(): void
	abstract applyTheme(): void
}
