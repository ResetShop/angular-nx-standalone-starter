import { Component, computed, effect, inject, untracked } from '@angular/core'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { PageShell } from '@components/page-shell/page-shell'
import type { CashTransactionDraft } from '@domain/cash/cash-request.mapper'
import { AppTranslation } from '@providers/i18n/app-translation'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Alert, AlertDescription } from '@resetshop/ui/alert/alert'
import { Button } from '@resetshop/ui/button/button'
import { AuthStore } from '@store/auth/auth.store'
import { CashStore } from '@store/cash/cash.store'
import { createMutationToast } from '@store/ui/mutation-toast'
import { CashTransactionForm } from '../cash-transaction-form/cash-transaction-form'

@Component({
	selector: 'app-cash-edit',
	standalone: true,
	imports: [Alert, AlertDescription, Button, CashTransactionForm, PageShell, RouterLink, TranslatePipe],
	template: `
		<app-page-shell [loading]="isLoading()" [error]="readError()" [title]="'CASH.FORM.EDIT_TITLE' | translate">
			<div pageActions>
				<a appButton variant="outline" routerLink="/dashboard/cash">{{ 'CASH.ACTIONS.BACK' | translate }}</a>
			</div>

			@if (transaction(); as tx) {
				@if (isEditable()) {
					<app-cash-transaction-form
						(submitted)="onSubmit($event)"
						(cancelled)="onCancel()"
						[concepts]="store.assignableConcepts()"
						[paymentMethods]="store.paymentMethods()"
						[transaction]="tx"
						[userName]="userName()"
						[submitting]="store.isUpdating()"
						[error]="store.mutationError().update"
					/>
				} @else {
					<div appAlert>
						<p appAlertDescription>{{ 'CASH.FORM.NOT_EDITABLE' | translate }}</p>
					</div>
				}
			}
		</app-page-shell>
	`,
})
export default class CashEdit {
	protected readonly store = inject(CashStore)
	private readonly authStore = inject(AuthStore)
	private readonly router = inject(Router)
	private readonly route = inject(ActivatedRoute)
	private readonly translation = inject(AppTranslation)

	/** Deferred: a failure stays inline in the form; the success toast is shown on leaving the page. */
	private readonly updateToast = createMutationToast(this.translation.instant('CASH.TOASTS.UPDATED'), {
		deferred: true,
	})

	private readonly transactionId = Number(this.route.snapshot.paramMap.get('id'))

	protected readonly transaction = computed(() => {
		const selected = this.store.selectedTransaction()
		return selected?.id === this.transactionId ? selected : null
	})
	protected readonly userName = computed(() => this.authStore.currentUser()?.userName ?? '')
	protected readonly isLoading = computed(
		() => this.store.isLoadingDetail() || this.store.isLoadingConcepts() || this.store.isLoadingPaymentMethods(),
	)
	protected readonly readError = computed(() => {
		const errors = this.store.readError()
		return errors.detail ?? errors.concepts ?? errors.paymentMethods
	})

	/** Only transactions a user created can be edited, and only while their concept is still assignable. */
	protected readonly isEditable = computed(() => {
		const concept = this.transaction()?.concept
		if (!concept || !this.transaction()?.editable) return false
		return this.store.assignableConcepts().some((parent) => parent.children.some((child) => child.id === concept.id))
	})

	private readonly leaveOnSuccessEffect = effect(() => {
		const updating = this.store.isUpdating()
		const error = this.store.mutationError().update
		untracked(() => {
			if (this.updateToast.handleResult(updating, error) === 'success') {
				this.updateToast.flushPending()
				void this.router.navigate(['/dashboard/cash'])
			}
		})
	})

	constructor() {
		this.store.clearMutationError('update')
		this.store.loadTransaction(this.transactionId)
	}

	protected onSubmit(draft: CashTransactionDraft): void {
		this.updateToast.markSubmitted()
		this.store.updateTransaction(draft)
	}

	protected onCancel(): void {
		void this.router.navigate(['/dashboard/cash'])
	}
}
