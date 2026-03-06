import {
	afterRenderEffect,
	ChangeDetectionStrategy,
	Component,
	computed,
	ElementRef,
	inject,
	input,
	viewChild,
} from '@angular/core';
import type { ValidationError } from '@angular/forms/signals';
import { NgValidationError, REQUIRED, type FieldTree } from '@angular/forms/signals';
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
			<ng-content />
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
})
export class FormField {
	private readonly autoId = `form-field-${crypto.randomUUID().slice(0, 8)}`;
	private readonly translation = inject(Translation);
	private readonly contentWrapper = viewChild<ElementRef<HTMLElement>>('contentWrapper');

	readonly label = input.required<string>();
	readonly field = input.required<FieldTree<unknown>>();
	readonly hint = input<string | undefined>(undefined);
	readonly fieldId = input<string | undefined>(undefined);
	readonly showRequired = input<boolean | undefined>(undefined);

	protected readonly resolvedId = computed(() => this.fieldId() ?? this.autoId);

	protected readonly fieldState = computed(() => this.field()());

	protected readonly isRequired = computed(() => {
		const override = this.showRequired();
		if (override !== undefined) return override;
		const requiredSignal = this.fieldState().metadata(REQUIRED);
		return requiredSignal ? requiredSignal() : false;
	});

	protected readonly errors = computed(() => this.fieldState().errors());

	protected readonly showErrors = computed(() => this.fieldState().touched() && this.errors().length > 0);

	protected readonly translatedError = computed(() => {
		const errors = this.errors();
		if (errors.length === 0) return '';
		return this.mapErrorToMessage(errors[0]);
	});

	constructor() {
		afterRenderEffect(() => {
			const hasErrors = this.showErrors();
			const el = this.contentWrapper()?.nativeElement.querySelector<HTMLElement>('input, select, textarea');
			if (!el) return;

			el.style.borderColor = hasErrors ? 'var(--destructive)' : '';
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
