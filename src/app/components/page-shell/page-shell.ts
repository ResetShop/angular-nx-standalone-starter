import { ChangeDetectionStrategy, Component, computed, input, OnDestroy, signal } from '@angular/core'
import { Alert, AlertDescription, AlertTitle } from '@components/alert/alert'
import { Spinner } from '@components/spinner/spinner'
import { parseDurationToMs } from '@utils/duration'

export const PAGE_SHELL_MIN_DISPLAY = '500ms'

@Component({
	selector: 'app-page-shell',
	standalone: true,
	imports: [Alert, AlertTitle, AlertDescription, Spinner],
	template: `
		<div class="space-y-6">
			<div>
				<h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ title() }}</h1>
				<p class="mt-1 text-sm text-gray-600 empty:hidden dark:text-gray-400">
					<ng-content select="[pageDescription]" />
				</p>
			</div>

			@if (showLoading()) {
				<div
					class="page-shell-fade-in border-border bg-card text-muted-foreground flex flex-col items-center justify-center gap-4 rounded-lg border p-8 py-12 text-center"
					role="status"
				>
					<app-spinner class="size-8" />
					<span>Cargando...</span>
				</div>
			} @else if (error()) {
				<div class="page-shell-fade-in" appAlert variant="destructive">
					<h5 appAlertTitle>Error</h5>
					<p appAlertDescription>{{ error() }}</p>
				</div>
			} @else {
				<div class="page-shell-fade-in space-y-6">
					<ng-content class="page-shell-fade-in" />
				</div>
			}
		</div>
	`,
	styles: `
		.page-shell-fade-in {
			animation: page-shell-fade-in 300ms ease-out;
		}

		@keyframes page-shell-fade-in {
			from {
				opacity: 0;
				transform: translateY(4px);
			}
			to {
				opacity: 1;
				transform: translateY(0);
			}
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageShell implements OnDestroy {
	public readonly title = input.required<string>()
	public readonly loading = input(true)
	public readonly error = input<string | null>(null)

	private readonly minimumElapsed = signal(false)
	private minimumTimer: ReturnType<typeof setTimeout> | null = null

	protected readonly showLoading = computed(() => this.loading() || !this.minimumElapsed())

	constructor() {
		this.minimumTimer = setTimeout(() => this.minimumElapsed.set(true), parseDurationToMs(PAGE_SHELL_MIN_DISPLAY))
	}

	public ngOnDestroy(): void {
		if (this.minimumTimer) {
			clearTimeout(this.minimumTimer)
			this.minimumTimer = null
		}
	}
}
