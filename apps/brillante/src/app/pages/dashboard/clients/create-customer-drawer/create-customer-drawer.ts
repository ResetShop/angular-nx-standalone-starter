import { Component, computed, effect, inject, signal, untracked, viewChild } from '@angular/core'
import { form } from '@angular/forms/signals'
import { CustomerFormFields } from '@components/customer-form-fields/customer-form-fields'
import { createEmptyCustomerForm, type CustomerFormModel, fromCustomerFormModel } from '@domain/customer/customer-form'
import { customerFormSchema } from '@domain/customer/customer-form.schema'
import { AppTranslation } from '@providers/i18n/app-translation'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Alert, AlertDescription } from '@resetshop/ui/alert/alert'
import { Button } from '@resetshop/ui/button/button'
import { ConfirmDialog } from '@resetshop/ui/confirm-dialog/confirm-dialog'
import { Drawer } from '@resetshop/ui/drawer/drawer'
import { DrawerFooter } from '@resetshop/ui/drawer/drawer-footer'
import { Spinner } from '@resetshop/ui/spinner/spinner'
import { parseDurationToMs } from '@resetshop/util'
import { CustomersStore } from '@store/customers/customers.store'
import { UIStore } from '@store/ui/ui.store'
import { NotificationType, type UINotification } from '@store/ui/ui.types'
import { DRAWER_CLOSE_AFTER_SUCCESS_DELAY } from '../clients.constants'

/**
 * Creates a customer. The API answers with the customer and a `created` flag: when a customer with
 * the same DNI already existed nothing is inserted, so the user gets a warning instead of the
 * success confirmation. The confirmation is shown once the drawer has finished closing.
 */
@Component({
	selector: 'app-create-customer-drawer',
	standalone: true,
	imports: [
		Alert,
		AlertDescription,
		Button,
		ConfirmDialog,
		CustomerFormFields,
		Drawer,
		DrawerFooter,
		Spinner,
		TranslatePipe,
	],
	template: `
		<app-drawer
			(closed)="onDrawerClosed()"
			(afterClosed)="flushNotification()"
			[closeOnBackdrop]="false"
			[title]="'CLIENTS.CREATE_DRAWER.TITLE' | translate"
			class="w-full sm:w-lg"
			#drawerRef
		>
			<form (submit)="onSubmit($event)" id="create-customer-form" class="flex h-full flex-col gap-4">
				@if (mutationError()) {
					<div appAlert variant="destructive">
						<p appAlertDescription>{{ mutationError() }}</p>
					</div>
				}

				<app-customer-form-fields [fields]="customerForm" />
			</form>

			<ng-template appDrawerFooter>
				<div class="flex justify-end gap-3">
					<button (click)="onCancel()" appButton variant="outline" type="button">
						{{ 'COMMON.CANCEL' | translate }}
					</button>
					<button
						[disabled]="showSubmitSpinner() || !isFormValid()"
						appButton
						type="submit"
						form="create-customer-form"
					>
						@if (showSubmitSpinner()) {
							<app-spinner data-icon="start" />
						}
						{{ showSubmitSpinner() ? ('COMMON.CREATING' | translate) : ('COMMON.CREATE' | translate) }}
					</button>
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
export class CreateCustomerDrawer {
	private readonly store = inject(CustomersStore)
	private readonly uiStore = inject(UIStore)
	private readonly translation = inject(AppTranslation)
	protected readonly drawer = viewChild.required<Drawer>('drawerRef')
	private readonly discardDialog = viewChild.required<ConfirmDialog>('discardDialogRef')

	private readonly model = signal<CustomerFormModel>(createEmptyCustomerForm())
	protected readonly customerForm = form(
		this.model,
		customerFormSchema({
			requireBirthDate: true,
			futureBirthDateMessage: this.translation.instant('CLIENT_FORM.ERRORS.FUTURE_BIRTH_DATE'),
		}),
	)

	protected readonly isFormValid = computed(() => this.customerForm().valid())
	private readonly closingAfterSuccess = signal(false)
	protected readonly showSubmitSpinner = computed(() => this.store.isCreating() || this.closingAfterSuccess())
	protected readonly mutationError = computed(() => this.store.mutationError().create)

	private submitted = false
	private pendingNotification: Omit<UINotification, 'id'> | null = null

	private readonly closeOnSuccessEffect = effect(() => {
		const creating = this.store.isCreating()
		const error = this.store.mutationError().create
		const outcome = this.store.createOutcome()
		untracked(() => this.onCreateSettled(creating, error, outcome))
	})

	public open(): void {
		this.drawer().show()
		this.drawer().setContentReady()
	}

	protected onCancel(): void {
		if (this.customerForm().dirty()) {
			this.discardDialog().show()
		} else {
			this.drawer().close()
		}
	}

	protected onDrawerClosed(): void {
		this.model.set(createEmptyCustomerForm())
		this.customerForm().reset()
		this.store.clearMutationError('create')
	}

	protected flushNotification(): void {
		if (this.pendingNotification) {
			this.uiStore.showNotification(this.pendingNotification)
			this.pendingNotification = null
		}
	}

	protected onSubmit(event: Event): void {
		event.preventDefault()
		if (!this.isFormValid()) return

		this.submitted = true
		this.store.createCustomer(fromCustomerFormModel(this.model()))
	}

	private onCreateSettled(creating: boolean, error: string | null, outcome: 'created' | 'existing' | null): void {
		if (creating || !this.submitted) return
		this.submitted = false
		if (error !== null) return

		this.pendingNotification =
			outcome === 'existing'
				? { type: NotificationType.WARNING, message: this.translation.instant('CLIENTS.CREATE_DRAWER.EXISTING_TOAST') }
				: { type: NotificationType.SUCCESS, message: this.translation.instant('CLIENTS.CREATE_DRAWER.SUCCESS_TOAST') }
		this.closingAfterSuccess.set(true)
		setTimeout(() => {
			this.closingAfterSuccess.set(false)
			this.drawer().close()
		}, parseDurationToMs(DRAWER_CLOSE_AFTER_SUCCESS_DELAY))
	}
}
