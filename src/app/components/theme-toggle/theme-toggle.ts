import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { featherMoon, featherSun } from '@ng-icons/feather-icons';
import { Button } from '@components/button/button';
import { Theme } from '@providers/theme/theme';

@Component({
	selector: 'app-theme-toggle',
	standalone: true,
	imports: [Button, NgIcon],
	providers: [provideIcons({ featherSun, featherMoon })],
	template: `
		<button
			(click)="toggleTheme()"
			[attr.aria-label]="isDarkMode() ? 'Switch to light mode' : 'Switch to dark mode'"
			appButton
			variant="ghost"
			size="sm"
			class="rounded-lg"
		>
			<ng-icon [attr.aria-hidden]="true" [name]="buttonIcon()" />
		</button>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggle {
	private theme = inject(Theme);

	readonly isDarkMode = computed(() => this.theme.isDarkMode());
	readonly buttonIcon = computed(() => (this.isDarkMode() ? 'featherMoon' : 'featherSun'));

	toggleTheme(): void {
		this.theme.toggleTheme();
	}
}
