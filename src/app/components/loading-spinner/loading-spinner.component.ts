import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'app-loading-spinner',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<dialog open class="align-self-center flex justify-self-center bg-transparent">
			<div
				class="flex flex-col items-center justify-center gap-6 rounded-xl border border-gray-200 bg-white p-8 shadow-2xs sm:h-[420px] sm:w-[420px] md:p-10 dark:border-neutral-700 dark:bg-neutral-900 dark:shadow-neutral-700/70"
			>
				<div class="spinner relative h-[60px] w-[60px]">
					<div class="spinner-ring border-t-primary border-transparent"></div>
					<div class="spinner-ring border-t-primary border-transparent"></div>
					<div class="spinner-ring border-t-primary border-transparent"></div>
					<div class="spinner-ring border-t-primary border-transparent"></div>
				</div>
				<p class="text-center text-lg font-medium text-gray-600 dark:text-neutral-400">Cargando...</p>
			</div>
		</dialog>
	`,
	styles: `
		@reference "tailwindcss";
		:host {
			@apply flex h-svh w-svw items-center justify-center bg-black/95;
		}

		.spinner-ring {
			position: absolute;
			width: 100%;
			height: 100%;
			border-width: 4px;
			border-radius: 50%;
			animation: spin 1.5s cubic-bezier(0.5, 0, 0.5, 1) infinite;
		}

		.spinner-ring:nth-child(1) {
			animation-delay: -0.45s;
		}

		.spinner-ring:nth-child(2) {
			animation-delay: -0.3s;
		}

		.spinner-ring:nth-child(3) {
			animation-delay: -0.15s;
		}

		@keyframes spin {
			0% {
				transform: rotate(0deg);
			}
			100% {
				transform: rotate(360deg);
			}
		}
	`,
})
export class LoadingSpinnerComponent {}
