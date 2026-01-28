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
		return [...this.BASE_CLASSES, ...this.VARIANT_CLASSES[this.variant()]].join(' ');
	});

	private readonly BASE_CLASSES = [
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

	private readonly VARIANT_CLASSES: Record<BadgeVariant, string[]> = {
		default: ['bg-primary', 'text-gray-50', 'dark:bg-gray-50', 'dark:text-primary'],
		secondary: ['bg-gray-200', 'text-gray-900', 'dark:bg-gray-800', 'dark:text-gray-100'],
		destructive: ['bg-danger', 'text-gray-50', 'dark:bg-danger', 'dark:text-gray-50'],
		outline: [
			'border',
			'border-solid',
			'border-gray-300',
			'text-gray-700',
			'bg-transparent',
			'dark:border-gray-600',
			'dark:text-gray-300',
		],
	};
}
