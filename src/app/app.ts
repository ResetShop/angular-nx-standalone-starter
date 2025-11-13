import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LoadingSpinnerComponent } from '@components/loading-spinner/loading-spinner.component';
import { Auth } from '@providers/auth/auth';

@Component({
	imports: [RouterModule, LoadingSpinnerComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	selector: 'app-root',
	template: `
		<div class="app-container">
			<app-loading-spinner
				[style.opacity]="isLoading() ? 1 : 0"
				[style.pointer-events]="isLoading() ? 'auto' : 'none'"
			/>
			<div
				[style.opacity]="!isLoading() ? 1 : 0"
				[style.pointer-events]="!isLoading() ? 'auto' : 'none'"
				class="router-outlet-wrapper"
			>
				<router-outlet />
			</div>
		</div>
	`,
	styles: `
		@reference "tailwindcss";
		:host {
			@apply bg-black/95;
		}

		.app-container {
			position: relative;
			width: 100%;
			height: 100%;
		}

		app-loading-spinner {
			position: absolute;
			inset: 0;
			transition: opacity 500ms cubic-bezier(0.4, 0, 0.2, 1);
			view-transition-name: app-loading;
		}

		.router-outlet-wrapper {
			position: absolute;
			inset: 0;
			transition: opacity 500ms cubic-bezier(0.4, 0, 0.2, 1);
			view-transition-name: app-content;
		}
	`,
})
export class App {
	readonly auth = inject(Auth);
	readonly isLoading = computed(() => !this.auth.isLoadingComplete());
}
