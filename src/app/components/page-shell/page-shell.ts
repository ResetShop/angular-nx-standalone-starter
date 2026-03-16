import { ChangeDetectionStrategy, Component, input } from '@angular/core'
import { Alert, AlertDescription, AlertTitle } from '@components/alert/alert'
import { Spinner } from '@components/spinner/spinner'

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

			@if (loading()) {
				<div class="flex justify-center py-12">
					<app-spinner class="size-5" />
				</div>
			} @else if (error()) {
				<div appAlert variant="destructive">
					<h5 appAlertTitle>Error</h5>
					<p appAlertDescription>{{ error() }}</p>
				</div>
			} @else {
				<ng-content />
			}
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageShell {
	public readonly title = input.required<string>()
	public readonly loading = input(false)
	public readonly error = input<string | null>(null)
}
