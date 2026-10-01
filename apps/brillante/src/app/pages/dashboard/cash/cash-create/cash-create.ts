import { Component, computed, effect, inject, untracked } from '@angular/core'
import { Router, RouterLink } from '@angular/router'
import { PageShell } from '@components/page-shell/page-shell'
import type { CashTransactionDraft } from '@domain/cash/cash-request.mapper'
import { AppTranslation } from '@providers/i18n/app-translation'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Button } from '@resetshop/ui/button/button'
import { AuthStore } from '@store/auth/auth.store'
import { CashStore } from '@store/cash/cash.store'
import { createMutationToast } from '@store/ui/mutation-toast'
import { CashTransactionForm } from '../cash-transaction-form/cash-transaction-form'

@Component({
	selector: 'app-cash-create',
	standalone: true,
	imports: [Button, CashTransactionForm, PageShell, RouterLink, TranslatePipe],
	template: `
		<app-page-shell
			[loading]="isLoadingCatalogues()"
			[error]="catalogueError()"
			[title]="'CASH.FORM.CREATE_TITLE' | translate"
		>
			<div pageActions>
				<a appButton variant="outline" routerLink="/dashboard/cash">{{ 'CASH.ACTIONS.BACK' | translate }}</a>
			</div>

			<app-cash-transaction-form
				(submitted)="onSubmit($event)"
				(cancelled)="onCancel()"
				[concepts]="store.assignableConcepts()"
				[paymentMethods]="store.paymentMethods()"
				[userName]="userName()"
				[submitting]="store.isCreating()"
				[error]="store.mutationError().create"
			/>
		</app-page-shell>
	`,
})
export default class CashCreate {
	protected readonly store = inject(CashStore)
	private readonly authStore = inject(AuthStore)
	private readonly router = inject(Router)
	private readonly translation = inject(AppTranslation)

	/** Deferred: a failure stays inline in the form; the success toast is shown on leaving the page. */
	private readonly createToast = createMutationToast(this.translation.instant('CASH.TOASTS.CREATED'), {
		deferred: true,
	})

	protected readonly userName = computed(() => this.authStore.currentUser()?.userName ?? '')
	protected readonly isLoadingCatalogues = computed(
		() => this.store.isLoadingConcepts() || this.store.isLoadingPaymentMethods(),
	)
	protected readonly catalogueError = computed(
		() => this.store.readError().concepts ?? this.store.readError().paymentMethods,
	)

	private readonly leaveOnSuccessEffect = effect(() => {
		const creating = this.store.isCreating()
		const error = this.store.mutationError().create
		untracked(() => {
			if (this.createToast.handleResult(creating, error) === 'success') {
				this.createToast.flushPending()
				void this.router.navigate(['/dashboard/cash'])
			}
		})
	})

	constructor() {
		this.store.clearMutationError('create')
	}

	protected onSubmit(draft: CashTransactionDraft): void {
		this.createToast.markSubmitted()
		this.store.createTransaction(draft)
	}

	protected onCancel(): void {
		void this.router.navigate(['/dashboard/cash'])
	}
}
