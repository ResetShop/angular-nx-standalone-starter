import { ChangeDetectionStrategy, Component, computed, forwardRef, input, linkedSignal, model } from '@angular/core'
import type { FormValueControl } from '@angular/forms/signals'
import type { IRole } from '@domain/access/role.interface'
import { FormFieldCustomControl } from '@resetshop/ui/form-field/form-field-custom-control'

@Component({
	selector: 'app-role-selector',
	standalone: true,
	providers: [{ provide: FormFieldCustomControl, useExisting: forwardRef(() => RoleSelector) }],
	template: `
		<div [class]="containerClasses()">
			@for (role of roles(); track role.id) {
				<label class="flex items-center gap-2" data-touch-target>
					<input
						(change)="toggleRole(role.id)"
						[checked]="selectedSet().has(role.id)"
						type="checkbox"
						class="border-input text-default focus:ring-ring h-4 w-4 rounded"
					/>
					<div class="flex flex-col sm:flex-row sm:items-center sm:gap-2">
						<span class="text-sm text-gray-700 dark:text-gray-300">{{ role.name }}</span>
						@if (role.description) {
							<span class="text-xs text-gray-500 dark:text-gray-400">
								<span class="hidden sm:inline">—</span>
								{{ role.description }}
							</span>
						}
					</div>
				</label>
			}
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleSelector extends FormFieldCustomControl implements FormValueControl<number[]> {
	public readonly roles = input.required<IRole[]>()
	public readonly value = model<number[]>([])

	protected readonly containerClasses = computed(() => {
		const base = 'min-h-0 flex-1 overflow-y-auto rounded-md border p-3 space-y-1'
		return this.ariaInvalid() ? `${base} border-destructive` : `${base} border-gray-200 dark:border-gray-700`
	})

	protected readonly selectedSet = linkedSignal<number[], Set<number>>({
		source: this.value,
		computation: (ids) => new Set(ids),
	})

	protected toggleRole(id: number): void {
		const set = new Set(this.selectedSet())
		if (set.has(id)) {
			set.delete(id)
		} else {
			set.add(id)
		}
		this.selectedSet.set(set)
		this.value.set([...set])
	}
}
