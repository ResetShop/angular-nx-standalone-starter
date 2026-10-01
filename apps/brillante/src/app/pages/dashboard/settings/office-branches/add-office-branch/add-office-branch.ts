import { Component, computed, effect, inject, signal, untracked } from '@angular/core'
import { form, maxLength, required, schema, FormField as SignalFormField } from '@angular/forms/signals'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { PageShell } from '@components/page-shell/page-shell'
import { AppTranslation } from '@providers/i18n/app-translation'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Button } from '@resetshop/ui/button/button'
import { FormField } from '@resetshop/ui/form-field/form-field'
import { Spinner } from '@resetshop/ui/spinner/spinner'
import { OfficeBranchStore } from '@store/office-branch/office-branch.store'
import { createMutationToast } from '@store/ui/mutation-toast'

interface AddOfficeBranchForm {
	name: string
	address: string
}

/**
 * Registers a new branch. On success the user is taken back to the branch list, which shows the
 * refreshed branches.
 */
@Component({
	selector: 'app-add-office-branch',
	imports: [Button, FormField, PageShell, RouterLink, SignalFormField, Spinner, TranslatePipe],
	template: `
		<app-page-shell [loading]="false" [title]="'OFFICE_BRANCHES.ADD.TITLE' | translate">
			<p pageDescription>{{ 'OFFICE_BRANCHES.ADD.DESCRIPTION' | translate }}</p>

			<form (submit)="onSubmit($event)" class="max-w-md space-y-4">
				<app-form-field [label]="'OFFICE_BRANCHES.ADD.NAME' | translate">
					<input [formField]="branchForm.name" type="text" autocomplete="organization" />
				</app-form-field>

				<app-form-field [label]="'OFFICE_BRANCHES.ADD.ADDRESS' | translate">
					<input [formField]="branchForm.address" type="text" autocomplete="street-address" />
				</app-form-field>

				<div class="flex gap-3">
					<a [routerLink]="['..']" appButton variant="outline">{{ 'COMMON.CANCEL' | translate }}</a>
					<button [disabled]="isCreating() || !isFormValid()" appButton type="submit">
						@if (isCreating()) {
							<app-spinner data-icon="start" />
						}
						{{ isCreating() ? ('COMMON.CREATING' | translate) : ('OFFICE_BRANCHES.ADD.SUBMIT' | translate) }}
					</button>
				</div>
			</form>
		</app-page-shell>
	`,
})
export default class AddOfficeBranch {
	private readonly store = inject(OfficeBranchStore)
	private readonly router = inject(Router)
	private readonly route = inject(ActivatedRoute)
	private readonly translation = inject(AppTranslation)

	private readonly toast = createMutationToast(this.translation.instant('OFFICE_BRANCHES.ADD.SUCCESS_TOAST'))

	private readonly model = signal<AddOfficeBranchForm>({ name: '', address: '' })
	protected readonly branchForm = form(
		this.model,
		schema<AddOfficeBranchForm>((branch) => {
			required(branch.name)
			maxLength(branch.name, 100)
			required(branch.address)
			maxLength(branch.address, 200)
		}),
	)

	protected readonly isFormValid = computed(() => this.branchForm().valid())
	protected readonly isCreating = computed(() => this.store.isCreating())

	private readonly backToListOnSuccessEffect = effect(() => {
		const creating = this.store.isCreating()
		const error = this.store.mutationError().create
		untracked(() => {
			if (this.toast.handleResult(creating, error) === 'success') {
				void this.router.navigate(['..'], { relativeTo: this.route })
			}
		})
	})

	protected onSubmit(event: Event): void {
		event.preventDefault()
		if (!this.isFormValid()) return

		const { name, address } = this.model()
		this.toast.markSubmitted()
		this.store.createBranch({ name: name.trim(), address: address.trim() })
	}
}
