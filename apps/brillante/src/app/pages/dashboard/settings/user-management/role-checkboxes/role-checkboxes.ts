import { Component, computed, forwardRef, inject, input, linkedSignal, model } from '@angular/core'
import type { FormValueControl } from '@angular/forms/signals'
import { UserRole } from '@contracts/permission/legacy-permission.constants'
import { AppTranslation } from '@providers/i18n/app-translation'
import { FormFieldCustomControl } from '@resetshop/ui/form-field/form-field-custom-control'
import { AuthStore } from '@store/auth/auth.store'
import { USER_ROLE_OPTIONS } from '../user-role-options'

/**
 * One checkbox per assignable role, bound to the list of selected role ids. The administrator and owner roles
 * are only offered to administrators and owners (or while already assigned), so a user manager cannot escalate privileges.
 */
@Component({
	selector: 'app-role-checkboxes',
	providers: [{ provide: FormFieldCustomControl, useExisting: forwardRef(() => RoleCheckboxes) }],
	template: `
		<div [class]="containerClasses()" role="group">
			@for (option of options(); track option.id) {
				<label class="flex items-center gap-2" data-touch-target>
					<input
						(change)="toggle(option.id)"
						[checked]="selectedSet().has(option.id)"
						[disabled]="option.locked"
						type="checkbox"
						class="border-input text-default focus:ring-ring h-4 w-4 rounded"
					/>
					<span class="text-sm text-gray-700 dark:text-gray-300">{{ option.label }}</span>
				</label>
			}
		</div>
	`,
})
export class RoleCheckboxes extends FormFieldCustomControl implements FormValueControl<number[]> {
	private readonly translation = inject(AppTranslation)
	private readonly authStore = inject(AuthStore)

	public readonly value = model<number[]>([])
	/** Roles that stay checked and cannot be toggled, because the backend refuses removing them. */
	public readonly lockedIds = input<readonly number[]>([])

	protected readonly options = computed(() => {
		const user = this.authStore.currentUser()
		const canGrantPrivileged = !!user && (user.hasRole(UserRole.ADMIN) || user.hasRole(UserRole.OWNER))
		const assigned = new Set(this.value())
		return USER_ROLE_OPTIONS.filter(
			(option) =>
				canGrantPrivileged || assigned.has(option.id) || (option.id !== UserRole.ADMIN && option.id !== UserRole.OWNER),
		).map((option) => ({
			id: option.id,
			label: this.translation.instant(option.labelKey),
			locked: this.lockedIds().includes(option.id),
		}))
	})

	protected readonly containerClasses = computed(() => {
		const base = 'space-y-1 rounded-md border p-3'
		return this.ariaInvalid() ? `${base} border-destructive` : `${base} border-gray-200 dark:border-gray-700`
	})

	protected readonly selectedSet = linkedSignal<number[], Set<number>>({
		source: this.value,
		computation: (ids) => new Set(ids),
	})

	protected toggle(id: number): void {
		const selected = new Set(this.selectedSet())
		if (selected.has(id)) {
			selected.delete(id)
		} else {
			selected.add(id)
		}
		this.selectedSet.set(selected)
		this.value.set([...selected])
	}
}
