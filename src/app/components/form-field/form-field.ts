import {
	afterRenderEffect,
	ChangeDetectionStrategy,
	Component,
	computed,
	contentChild,
	effect,
	ElementRef,
	ErrorHandler,
	inject,
	input,
	viewChild,
} from '@angular/core';
import type { ValidationError } from '@angular/forms/signals';
import { NgValidationError, REQUIRED, FormField as SignalFormField } from '@angular/forms/signals';
import { Translation } from '@providers/i18n/translation';
import { NgpFormField } from 'ng-primitives/form-field';

@Component({
	selector: 'app-form-field',
	standalone: true,
	changeDetection: ChangeDetectionStrategy.OnPush,
	exportAs: 'formField',
	hostDirectives: [NgpFormField],
	host: { class: 'block' },
	template: `
		<label [for]="resolvedId()" class="text-foreground block text-sm/6 font-medium">
			{{ label() }}
			@if (isRequired()) {
				<span aria-hidden="true" class="ml-0.5">*</span>
			}
		</label>

		<div #contentWrapper class="mt-2">
			<ng-content select="input, select, textarea" />
		</div>

		@if (hint() && !showErrors()) {
			<p class="text-muted-foreground mt-1.5 text-sm">{{ hint() }}</p>
		}

		@if (showErrors()) {
			<p role="alert" class="text-destructive mt-1.5 text-sm">
				{{ translatedError() }}
			</p>
		}
	`,
	styles: `
		app-form-field ::ng-deep [aria-invalid='true'] {
			border-color: var(--destructive);
		}
	`,
})
export class FormField {
	private readonly autoId = `form-field-${crypto.randomUUID().slice(0, 8)}`;
	private readonly errorHandler = inject(ErrorHandler);
	private readonly translation = inject(Translation);
	private readonly contentWrapper = viewChild<ElementRef<HTMLElement>>('contentWrapper');
	private readonly formFieldDirective = contentChild(SignalFormField);

	readonly label = input.required<string>();
	readonly hint = input<string | undefined>(undefined);
	readonly fieldId = input<string | undefined>(undefined);
	readonly showRequired = input<boolean | undefined>(undefined);

	protected readonly resolvedId = computed(() => this.fieldId() ?? this.autoId);

	protected readonly fieldState = computed(() => this.formFieldDirective()?.state());

	protected readonly isRequired = computed(() => {
		const override = this.showRequired();
		if (override !== undefined) return override;
		const state = this.fieldState();
		if (!state) return false;
		const requiredSignal = state.metadata(REQUIRED);
		return requiredSignal ? requiredSignal() : false;
	});

	protected readonly errors = computed(() => this.fieldState()?.errors() ?? []);

	protected readonly showErrors = computed(() => {
		const state = this.fieldState();
		if (!state) return false;
		return state.touched() && this.errors().length > 0;
	});

	protected readonly translatedError = computed(() => {
		const errors = this.errors();
		if (errors.length === 0) return '';
		return this.mapErrorToMessage(errors[0]);
	});

	constructor() {
		// TODO (#66): Replace errorHandler.handleError with logging service when available
		effect(() => {
			const supportedControls = 'input, select, textarea';
			const wrapper = this.contentWrapper()?.nativeElement;
			if (!wrapper) return;

			const directChildren = wrapper.children;

			if (directChildren.length > 1) {
				this.errorHandler.handleError(
					new Error(`FormField expects a single projected element, but received ${directChildren.length}.`),
				);
			}

			if (directChildren.length === 1 && !directChildren[0].matches(supportedControls)) {
				this.errorHandler.handleError(
					new Error(
						`FormField received an unsupported element <${directChildren[0].tagName.toLowerCase()}>. ` +
							`Supported elements: ${supportedControls}.`,
					),
				);
			}

			if (directChildren.length === 1 && directChildren[0].matches(supportedControls) && !this.formFieldDirective()) {
				this.errorHandler.handleError(
					new Error(
						'FormField requires a [formField] directive on the projected form control. ' +
							'Add [formField]="yourField" to the input, select, or textarea element.',
					),
				);
			}
		});

		afterRenderEffect(() => {
			const wrapper = this.contentWrapper()?.nativeElement;
			if (!wrapper) return;

			const el = wrapper.querySelector('input, select, textarea');
			if (!el) return;

			el.setAttribute('aria-invalid', String(this.showErrors()));
		});
	}

	private mapErrorToMessage(error: ValidationError): string {
		if (!(error instanceof NgValidationError)) return error.message ?? error.kind;

		switch (error.kind) {
			case 'required':
				return this.translation.instant('VALIDATION.REQUIRED');
			case 'email':
				return this.translation.instant('VALIDATION.EMAIL');
			case 'minLength':
				return this.translation.instant('VALIDATION.MIN_LENGTH').replace('{min}', String(error.minLength));
			case 'maxLength':
				return this.translation.instant('VALIDATION.MAX_LENGTH').replace('{max}', String(error.maxLength));
			case 'min':
				return this.translation.instant('VALIDATION.MIN').replace('{min}', String(error.min));
			case 'max':
				return this.translation.instant('VALIDATION.MAX').replace('{max}', String(error.max));
			case 'pattern':
				return this.translation.instant('VALIDATION.PATTERN');
			default:
				return error.message ?? error.kind;
		}
	}
}
