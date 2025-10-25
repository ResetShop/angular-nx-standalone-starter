import { ChangeDetectionStrategy, Component, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
		@if (isBrowser()) {
			<button
				(click)="toggleTheme()"
				[attr.aria-label]="isDarkMode() ? 'Switch to light mode' : 'Switch to dark mode'"
				appButton
				variant="ghost"
				size="sm"
				class="animate-slide-in-from-right rounded-lg"
			>
				<ng-icon [attr.aria-hidden]="true" [name]="buttonIcon()" />
			</button>
		}
	`,
	styles: `
		@keyframes slide-in-from-right {
			from {
				opacity: 0;
				transform: translateX(100%);
			}
			to {
				opacity: 1;
				transform: translateX(0);
			}
		}

		:host {
			display: contents;
		}

		.animate-slide-in-from-right {
			animation: slide-in-from-right 0.5s ease-out;
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggle {
	private theme = inject(Theme);
	private platformId = inject(PLATFORM_ID);

	readonly isBrowser = computed(() => isPlatformBrowser(this.platformId));
	readonly isDarkMode = computed(() => this.theme.isDarkMode());
	readonly buttonIcon = computed(() => (this.isDarkMode() ? 'featherMoon' : 'featherSun'));

	toggleTheme(): void {
		this.theme.toggleTheme();
	}
}
