import { Component, computed, effect, inject, signal, untracked, viewChild } from '@angular/core'
import type { CashTransactionDraft } from '@domain/cash/cash-request.mapper'
import type { CashTransaction } from '@domain/cash/cash-transaction.model'
import { AppTranslation } from '@providers/i18n/app-translation'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Alert, AlertDescription } from '@resetshop/ui/alert/alert'
import { Button } from '@resetshop/ui/button/button'
import { ConfirmDialog } from '@resetshop/ui/confirm-dialog/confirm-dialog'
import { Drawer } from '@resetshop/ui/drawer/drawer'
import { DrawerFooter } from '@resetshop/ui/drawer/drawer-footer'
import { Spinner } from '@resetshop/ui/spinner/spinner'
import { parseDurationToMs } from '@resetshop/util'
import { AuthStore } from '@store/auth/auth.store'
import { createMutationToast } from '@store/ui/mutation-toast'
import { CashTransactionForm } from '../cash-transaction-form/cash-transaction-form'
import { DRAWER_CLOSE_AFTER_SUCCESS_DELAY } from '../cash.constants'
import { CashStore } from '../cash.store'

/**
 * Single drawer that creates a cash transaction (`openCreate()`) or edits one (`openEdit(tx)`).
 * The form is mounted only while the drawer is in use, so every opening starts from a fresh form.
 * A dirty form asks for confirmation before it is discarded; a successful save closes the drawer
 * and shows the confirmation toast once the closing animation ends.
 */
@Component({
	selector: 'app-cash-transaction-drawer',
	standalone: true,
	imports: [
		Alert,
		AlertDescription,
		Button,
		CashTransactionForm,
		ConfirmDialog,
		Drawer,
		DrawerFooter,
		Spinner,
		TranslatePipe,
	],
	template: `
		<app-drawer
			(afterClosed)="onAfterClosed()"
			[closeOnBackdrop]="false"
			[title]="title() | translate"
			class="w-full sm:w-lg"
			#drawerRef
		>
			@if (active()) {
				@if (mutationError(); as message) {
					<div appAlert variant="destructive" class="mb-4">
						<p appAlertDescription>{{ message }}</p>
					</div>
				}

				@if (catalogueError(); as message) {
					<div appAlert variant="destructive">
						<p appAlertDescription>{{ message }}</p>
					</div>
				} @else if (isLoadingCatalogues()) {
					<p class="text-muted-foreground text-sm" role="status">{{ 'CASH.FORM.LOADING' | translate }}</p>
				} @else if (isEdit() && !isEditable()) {
					<div appAlert>
						<p appAlertDescription>{{ 'CASH.FORM.NOT_EDITABLE' | translate }}</p>
					</div>
				} @else {
					<app-cash-transaction-form
						(submitted)="onSubmit($event)"
						[concepts]="store.assignableConcepts()"
						[paymentMethods]="store.paymentMethods()"
						[transaction]="transaction()"
						[userName]="userName()"
						[submitting]="isSubmitting()"
					/>
				}
			}

			<ng-template appDrawerFooter>
				<div class="flex justify-end gap-3">
					<button (click)="onCancel()" appButton type="button" variant="outline">
						{{ 'COMMON.CANCEL' | translate }}
					</button>
					@if (formRef(); as formComponent) {
						<button
							[disabled]="isSubmitting() || !formComponent.isFormValid()"
							[attr.form]="formComponent.formId"
							appButton
							type="submit"
						>
							@if (isSubmitting()) {
								<app-spinner data-icon="start" />
							}
							{{ submitLabel() }}
						</button>
					}
				</div>
			</ng-template>
		</app-drawer>

		<app-confirm-dialog
			(confirmed)="drawer().close()"
			[title]="'COMMON.DISCARD_DIALOG.TITLE' | translate"
			[message]="'COMMON.DISCARD_DIALOG.MESSAGE' | translate"
			[confirmText]="'COMMON.DISCARD_DIALOG.CONFIRM' | translate"
			confirmVariant="destructive"
			#discardDialogRef
		/>
	`,
})
export class CashTransactionDrawer {
	protected readonly store = inject(CashStore)
	private readonly authStore = inject(AuthStore)
	private readonly translation = inject(AppTranslation)

	private readonly discardDialog = viewChild.required<ConfirmDialog>('discardDialogRef')
	protected readonly drawer = viewChild.required<Drawer>('drawerRef')
	protected readonly formRef = viewChild(CashTransactionForm)

	/** Deferred: a failure stays inline in the drawer; the success toast waits for the closing animation. */
	private readonly createToast = createMutationToast(this.translation.instant('CASH.TOASTS.CREATED'), {
		deferred: true,
	})
	private readonly updateToast = createMutationToast(this.translation.instant('CASH.TOASTS.UPDATED'), {
		deferred: true,
	})

	protected readonly active = signal(false)
	/** The transaction being edited; `null` while creating. */
	protected readonly transaction = signal<CashTransaction | null>(null)
	protected readonly isEdit = computed(() => this.transaction() !== null)
	private readonly closingAfterSuccess = signal(false)

	protected readonly title = computed(() => (this.isEdit() ? 'CASH.FORM.EDIT_TITLE' : 'CASH.FORM.CREATE_TITLE'))
	protected readonly userName = computed(() => this.authStore.currentUser()?.userName ?? '')
	protected readonly isLoadingCatalogues = computed(
		() => this.store.isLoadingConcepts() || this.store.isLoadingPaymentMethods(),
	)
	protected readonly catalogueError = computed(
		() => this.store.readError().concepts ?? this.store.readError().paymentMethods,
	)
	protected readonly mutationError = computed(() =>
		this.isEdit() ? this.store.mutationError().update : this.store.mutationError().create,
	)
	protected readonly isSubmitting = computed(
		() => (this.isEdit() ? this.store.isUpdating() : this.store.isCreating()) || this.closingAfterSuccess(),
	)
	protected readonly submitLabel = computed(() => {
		if (this.isSubmitting()) return this.translation.instant('COMMON.SAVING')
		return this.translation.instant(this.isEdit() ? 'CASH.FORM.SUBMIT_EDIT' : 'CASH.FORM.SUBMIT_CREATE')
	})

	/** Only transactions a user created can be edited, and only while their concept is still assignable. */
	protected readonly isEditable = computed(() => {
		const transaction = this.transaction()
		if (!transaction?.editable) return false
		return this.store
			.assignableConcepts()
			.some((parent) => parent.children.some((child) => child.id === transaction.concept.id))
	})

	private readonly closeOnCreateEffect = effect(() => {
		const creating = this.store.isCreating()
		const error = this.store.mutationError().create
		untracked(() => this.closeOnSuccess(this.createToast.handleResult(creating, error)))
	})

	private readonly closeOnUpdateEffect = effect(() => {
		const updating = this.store.isUpdating()
		const error = this.store.mutationError().update
		untracked(() => this.closeOnSuccess(this.updateToast.handleResult(updating, error)))
	})

	public openCreate(): void {
		this.store.clearMutationError('create')
		this.transaction.set(null)
		this.show()
	}

	public openEdit(transaction: CashTransaction): void {
		this.store.clearMutationError('update')
		this.transaction.set(transaction)
		this.show()
	}

	protected onSubmit(draft: CashTransactionDraft): void {
		if (this.isEdit()) {
			this.updateToast.markSubmitted()
			this.store.updateTransaction(draft)
		} else {
			this.createToast.markSubmitted()
			this.store.createTransaction(draft)
		}
	}

	protected onCancel(): void {
		if (this.formRef()?.isDirty()) {
			this.discardDialog().show()
		} else {
			this.drawer().close()
		}
	}

	protected onAfterClosed(): void {
		this.createToast.flushPending()
		this.updateToast.flushPending()
		this.active.set(false)
		this.transaction.set(null)
	}

	private show(): void {
		this.active.set(true)
		this.drawer().show()
		this.drawer().setContentReady()
	}

	private closeOnSuccess(result: 'success' | 'error' | null): void {
		if (result !== 'success') return
		this.closingAfterSuccess.set(true)
		setTimeout(() => {
			this.closingAfterSuccess.set(false)
			this.drawer().close()
		}, parseDurationToMs(DRAWER_CLOSE_AFTER_SUCCESS_DELAY))
	}
}
