import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { featherChevronRight } from '@ng-icons/feather-icons'

@Component({
	selector: 'app-navigation-card',
	imports: [NgIcon, RouterLink],
	viewProviders: [provideIcons({ featherChevronRight })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		<a
			[routerLink]="route()"
			class="group border-border bg-card hover:border-foreground/20 hover:bg-accent/50 relative flex min-h-32 flex-row rounded-xl border p-5 transition-all duration-150 ease-in-out"
		>
			@if (iconName(); as iconName) {
				<div class="text-foreground dark:text-foreground mr-4 flex flex-col">
					<ng-icon
						[name]="iconName"
						class="transition-transform group-hover:scale-110"
						size="24"
						data-testid="card-icon"
					/>
				</div>
			}
			<div class="flex h-full w-full flex-col gap-2">
				<h5 class="text-foreground pr-5 text-sm font-medium">{{ name() }}</h5>
				<p class="text-muted-foreground text-sm">{{ description() }}</p>
			</div>
			<div
				class="text-muted-foreground group-hover:text-foreground absolute top-4 right-4 transition-all duration-200 group-hover:right-3"
				data-testid="chevron-icon"
			>
				<ng-icon name="featherChevronRight" size="16" />
			</div>
		</a>
	`,
})
export default class NavigationCard {
	public readonly route = input.required<string>()
	public readonly name = input.required<string>()
	public readonly description = input.required<string>()
	public readonly icons = input<Record<string, string>>()

	protected readonly iconName = computed(() => {
		const i = this.icons()
		return i ? Object.keys(i)[0] : null
	})
}
