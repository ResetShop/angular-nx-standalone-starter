import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

@Component({
	// eslint-disable-next-line @angular-eslint/component-selector
	selector: 'span[appBadge]',
	standalone: true,
	template: `
		<ng-content />
	`,
	host: {
		'[class]': 'computedClasses()',
	},
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Badge {
	/**
	 * Visual variant of the badge
	 * @default 'default'
	 */
	readonly variant = input<BadgeVariant>('default');

	/**
	 * Computed classes based on variant
	 */
	readonly computedClasses = computed(() => {
		const baseClasses = [
			'inline-flex',
			'items-center',
			'rounded-full',
			'px-2.5',
			'py-0.5',
			'text-xs',
			'font-semibold',
			'transition-colors',
			'duration-300',
			'ease-in-out',
		];

		const variantClasses: Record<BadgeVariant, string[]> = {
			default: ['bg-default', 'text-default-foreground'],
			secondary: ['bg-secondary', 'text-secondary-foreground'],
			destructive: ['bg-destructive', 'text-destructive-foreground'],
			outline: ['border', 'border-solid', 'border-border', 'text-foreground', 'bg-transparent'],
		};

		return [...baseClasses, ...variantClasses[this.variant()]].join(' ');
	});
}
