import { signal, computed } from '@angular/core';
import { ThemeProvider } from './theme.abstract';

export const provideMockTheme = (isDarkModeInitial: boolean = false) => [
	{
		provide: ThemeProvider,
		useValue: new ThemeMock(isDarkModeInitial),
	},
];

export class ThemeMock extends ThemeProvider {
	private readonly _isDarkMode = signal<boolean>(false);
	readonly isDarkMode = computed(() => this._isDarkMode());

	constructor(isDarkModeInitial: boolean = false) {
		super();
		this._isDarkMode.set(isDarkModeInitial);
	}

	toggleTheme(): void {
		this._isDarkMode.update((current) => !current);
		this.applyTheme();
	}

	applyTheme(): void {
		if (this._isDarkMode()) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	}

	setDarkMode(isDark: boolean): void {
		this._isDarkMode.set(isDark);
		this.applyTheme();
	}
}
