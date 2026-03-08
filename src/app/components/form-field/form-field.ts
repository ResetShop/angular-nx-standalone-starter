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
	signal,
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
	hostDirectives: [NgpFormField],
	host: { class: 'block' },
	template: `
		<div [class]="isCheckbox() ? 'flex items-center gap-3' : ''">
			<label
				[for]="resolvedId()"
				[class]="
					isCheckbox()
						? 'text-foreground order-2 text-sm/6 font-medium select-none'
						: 'text-foreground block text-sm/6 font-medium'
				"
			>
				{{ label() }}
				@if (isRequired()) {
					<span aria-hidden="true" class="ml-0.5">*</span>
				}
			</label>

			<div [class]="isCheckbox() ? 'order-1 flex items-center' : 'mt-2'" #contentWrapper>
				<ng-content select="input, select, textarea" />
			</div>
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
	private readonly errorHandler = inject(ErrorHandler);
	private readonly translation = inject(Translation);
	private readonly contentWrapper = viewChild<ElementRef<HTMLElement>>('contentWrapper');
	private readonly formFieldDirective = contentChild(SignalFormField);

	readonly label = input.required<string>();
	readonly hint = input<string>();
	readonly showRequired = input<boolean>();

	protected readonly resolvedId = signal('');
	protected readonly isCheckbox = signal(false);

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

	private readonly supportedControls = 'input, select, textarea';

	constructor() {
		effect(() => this.setupContentValidation());
		afterRenderEffect(() => this.setupIdAndAriaSync());
	}

	/**
	 * This method verifies that:
	 * 1. The length of children is exactly one (i.e. only one element is projected inside an instance of form-field)
	 * 2. The single child is a supported HTML element
	 * 3. The child element has the formField directive attached
	 */
	private setupContentValidation() {
		const wrapper = this.contentWrapper()?.nativeElement;
		if (!wrapper) return;

		const directChildren = wrapper.children;

		if (directChildren.length > 1) {
			// TODO (#66): Replace errorHandler.handleError with logging service when available
			this.errorHandler.handleError(
				new Error(`FormField expects a single projected element, but received ${directChildren.length}.`),
			);
		}

		if (directChildren.length === 1 && !directChildren[0].matches(this.supportedControls)) {
			this.errorHandler.handleError(
				new Error(
					`FormField received an unsupported element <${directChildren[0].tagName.toLowerCase()}>. ` +
						`Supported elements: ${this.supportedControls}.`,
				),
			);
		}

		if (
			directChildren.length === 1 &&
			directChildren[0].matches(this.supportedControls) &&
			!this.formFieldDirective()
		) {
			this.errorHandler.handleError(
				new Error(
					'FormField requires a [formField] directive on the projected form control. ' +
						'Add [formField]="yourField" to the input, select, or textarea element.',
				),
			);
		}
	}

	/**
	 * Sets up the content child id and aria-invalid attribute when the child is in an invalid status
	 */
	private setupIdAndAriaSync() {
		const wrapper = this.contentWrapper()?.nativeElement;
		if (!wrapper) return;

		const el = wrapper.querySelector(this.supportedControls);
		if (!el) return;

		let id = el.getAttribute('id');
		if (!id) {
			id = `form-field-${crypto.randomUUID().slice(0, 8)}`;
			el.setAttribute('id', id);
		}
		this.resolvedId.set(id);
		this.isCheckbox.set(el instanceof HTMLInputElement && el.type === 'checkbox');

		el.setAttribute('aria-invalid', String(this.showErrors()));
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
