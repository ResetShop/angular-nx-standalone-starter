import { ChangeDetectionStrategy, Component, computed, forwardRef, input, model } from '@angular/core'
import type { FormValueControl } from '@angular/forms/signals'
import { FormFieldCustomControl } from '@components/form-field/form-field-custom-control'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { featherChevronDown } from '@ng-icons/feather-icons'
import { NgpSelect, NgpSelectDropdown, NgpSelectOption, NgpSelectPortal } from 'ng-primitives/select'
import type { SelectOption } from './select-option'

@Component({
	selector: 'app-select',
	standalone: true,
	imports: [NgpSelect, NgpSelectDropdown, NgpSelectOption, NgpSelectPortal, NgIcon],
	providers: [
		provideIcons({ featherChevronDown }),
		{ provide: FormFieldCustomControl, useExisting: forwardRef(() => Select) },
	],
	template: `
		<div
			(ngpSelectOpenChange)="onOpenChange($event)"
			[(ngpSelectValue)]="value"
			[ngpSelectDisabled]="isDisabled()"
			[attr.aria-disabled]="isDisabled() || null"
			[class]="triggerClasses()"
			ngpSelect
		>
			@if (selectedLabel(); as label) {
				<span class="truncate">{{ label }}</span>
			} @else {
				<span class="text-muted-foreground truncate">{{ placeholder() }}</span>
			}
			<ng-icon name="featherChevronDown" class="text-muted-foreground ml-auto shrink-0" size="16" />

			<div *ngpSelectPortal ngpSelectDropdown>
				@for (option of options(); track option.value) {
					<div [ngpSelectOptionValue]="option.value" ngpSelectOption>
						{{ option.label }}
					</div>
				} @empty {
					<div class="text-muted-foreground px-3 py-2 text-center text-sm">No options</div>
				}
			</div>
		</div>
	`,
	styleUrl: './select.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Select extends FormFieldCustomControl implements FormValueControl<string> {
	public readonly options = input.required<SelectOption[]>()
	public readonly value = model<string>('')
	public readonly placeholder = input<string>('')
	public readonly isDisabled = input<boolean>(false)
	public readonly touched = model<boolean>(false)

	protected readonly selectedLabel = computed(() => {
		const current = this.value()
		if (!current) return ''
		return this.options().find((o) => o.value === current)?.label ?? ''
	})

	protected readonly triggerClasses = computed(() => {
		return this.ariaInvalid() ? 'invalid' : ''
	})

	protected onOpenChange(open: boolean): void {
		if (!open) {
			this.touched.set(true)
		}
	}
}
