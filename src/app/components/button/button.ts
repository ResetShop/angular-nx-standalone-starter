import { computed, Component, input } from '@angular/core';
import { NgpButton } from 'ng-primitives/button';

export type ButtonVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
	// eslint-disable-next-line @angular-eslint/component-selector
	selector: 'button[appButton], a[appButton]',
	standalone: true,
	hostDirectives: [NgpButton],
	template: `<ng-content />`,
	host: {
		'[class]': 'computedClasses()',
		'[attr.type]': 'type()',
	},
})
export class Button {
	/**
	 * Visual variant of the button
	 * @default 'default'
	 */
	readonly variant = input<ButtonVariant>('default');

	/**
	 * Size of the button
	 * @default 'md'
	 */
	readonly size = input<ButtonSize>('md');

	/**
	 * Whether the button should take full width
	 * @default false
	 */
	readonly fullWidth = input<boolean>(false);

	/**
	 * Button type attribute (only applies to button elements)
	 * @default 'button'
	 */
	readonly type = input<'button' | 'submit' | 'reset'>('button');

	/**
	 * Computed classes based on variant, size, and fullWidth
	 */
	readonly computedClasses = computed(() => {
		const classes: string[] = [
			// Base classes - common to all buttons
			'font-sans',
			'inline-flex',
			'items-center',
			'justify-center',
			'rounded-lg',
			'font-medium',
			'transition-colors',
			'duration-300',
			'ease-in-out',
			'data-[focus-visible]:outline-2',
			'data-[focus-visible]:outline-offset-2',
			'disabled:pointer-events-none',
			'disabled:opacity-50',
			'cursor-pointer',
		];

		// Size classes (based on Angular Primitives)
		const sizeClasses: Record<ButtonSize, string[]> = {
			sm: ['h-8', 'px-3', 'text-sm'],
			md: ['h-10', 'px-4', 'text-base'],
			lg: ['h-12', 'px-6', 'text-lg'],
		};
		classes.push(...sizeClasses[this.size()]);

		// Variant classes
		const variantClasses: Record<ButtonVariant, string[]> = {
			default: [
				'bg-primary-600',
				'text-white',
				'data-[hover]:bg-primary-600/90',
				'data-[focus-visible]:outline-primary-500',
				'dark:bg-primary-500',
				'dark:data-[hover]:bg-primary-500/90',
			],
			secondary: [
				'bg-gray-200',
				'text-gray-900',
				'data-[hover]:bg-gray-200/80',
				'data-[focus-visible]:outline-gray-500',
				'dark:bg-gray-800',
				'dark:text-gray-100',
				'dark:data-[hover]:bg-gray-800/80',
			],
			destructive: [
				'bg-danger-600',
				'text-white',
				'data-[hover]:bg-danger-600/90',
				'data-[focus-visible]:outline-danger-500',
				'dark:bg-danger-500',
				'dark:data-[hover]:bg-danger-500/90',
			],
			outline: [
				'border',
				'border-solid',
				'border-gray-300',
				'bg-white',
				'text-gray-900',
				'data-[hover]:bg-gray-100',
				'data-[focus-visible]:outline-primary-500',
				'dark:border-gray-700',
				'dark:bg-gray-950',
				'dark:text-gray-100',
				'dark:data-[hover]:bg-gray-800',
			],
			ghost: [
				'bg-transparent',
				'text-gray-900',
				'data-[hover]:bg-gray-100',
				'data-[hover]:text-gray-900',
				'data-[focus-visible]:outline-primary-500',
				'dark:text-gray-100',
				'dark:data-[hover]:bg-gray-800',
				'dark:data-[hover]:text-gray-100',
			],
			link: [
				'bg-transparent',
				'text-primary-600',
				'underline-offset-4',
				'data-[hover]:underline',
				'data-[focus-visible]:outline-primary-500',
				'dark:text-primary-400',
			],
		};
		classes.push(...variantClasses[this.variant()]);

		// Full width
		if (this.fullWidth()) {
			classes.push('w-full');
		}

		return classes.join(' ');
	});
}
