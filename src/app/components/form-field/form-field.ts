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
import { type FieldTree, REQUIRED } from '@angular/forms/signals';
import { Translation } from '@providers/i18n/translation';
import type { TranslationKey } from '@providers/i18n/translations.schema';
import { NgpFormField } from 'ng-primitives/form-field';

interface ErrorMapping {
	readonly key: TranslationKey;
	readonly param?: string;
}

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

	private interpolate(template: string, params: Record<string, string | number>): string {
		return template.replace(/\{(\w+)}/g, (_, key: string) => String(params[key] ?? `{${key}}`));
	}

	private mapErrorToMessage(error: ValidationError): string {
		const errorMap: Record<string, ErrorMapping> = {
			required: { key: 'VALIDATION.REQUIRED' },
			email: { key: 'VALIDATION.EMAIL' },
			minLength: { key: 'VALIDATION.MIN_LENGTH', param: 'min' },
			maxLength: { key: 'VALIDATION.MAX_LENGTH', param: 'max' },
			min: { key: 'VALIDATION.MIN', param: 'min' },
			max: { key: 'VALIDATION.MAX', param: 'max' },
			pattern: { key: 'VALIDATION.PATTERN' },
		};

		const mapping = errorMap[error.kind];
		if (!mapping) return error.message ?? error.kind;

		const template = this.translation.instant(mapping.key);
		if (!mapping.param) return template;

		const value = (error as unknown as Record<string, number>)[error.kind];
		return this.interpolate(template, { [mapping.param]: value });
	}
}
