import { Component, computed, effect, inject, signal, untracked, viewChild } from '@angular/core'
import { form } from '@angular/forms/signals'
import { CustomerFormFields } from '@components/customer-form-fields/customer-form-fields'
import {
	createEmptyCustomerForm,
	type CustomerFormModel,
	fromCustomerFormModel,
	toCustomerFormModel,
} from '@domain/customer/customer-form'
import { customerFormSchema } from '@domain/customer/customer-form.schema'
import type { ICustomer } from '@domain/customer/customer.interface'
import { AppTranslation } from '@providers/i18n/app-translation'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Alert, AlertDescription } from '@resetshop/ui/alert/alert'
import { Button } from '@resetshop/ui/button/button'
import { Drawer } from '@resetshop/ui/drawer/drawer'
import { DrawerFooter } from '@resetshop/ui/drawer/drawer-footer'
import { Spinner } from '@resetshop/ui/spinner/spinner'
import { parseDurationToMs } from '@resetshop/util'
import { createMutationToast } from '@store/ui/mutation-toast'
import { DRAWER_CLOSE_AFTER_SUCCESS_DELAY } from '../clients.constants'
import { CustomersStore } from '../customers.store'

/**
 * Edits an existing customer. The customer is passed to `open(customer)`, so one instance serves
 * every row of the list. Saving is only possible once the form holds a valid, changed value.
 */
@Component({
	selector: 'app-edit-customer-drawer',
	standalone: true,
	imports: [Alert, AlertDescription, Button, CustomerFormFields, Drawer, DrawerFooter, Spinner, TranslatePipe],
	template: `
		<app-drawer
			(closed)="onDrawerClosed()"
			(afterClosed)="toast.flushPending()"
			[closeOnBackdrop]="false"
			[title]="'CLIENTS.EDIT_DRAWER.TITLE' | translate"
			class="w-full sm:w-lg"
			#drawer
		>
			<form (submit)="onSubmit($event)" id="edit-customer-form" class="flex h-full flex-col gap-4">
				@if (mutationError()) {
					<div appAlert variant="destructive">
						<p appAlertDescription>{{ mutationError() }}</p>
					</div>
				}

				<app-customer-form-fields [fields]="customerForm" />
			</form>

			<ng-template appDrawerFooter>
				<div class="flex justify-end gap-3">
					<button (click)="drawer.close()" appButton variant="outline" type="button">
						{{ 'COMMON.CANCEL' | translate }}
					</button>
					<button
						[disabled]="showSubmitSpinner() || !isFormValid() || !isDirty()"
						appButton
						type="submit"
						form="edit-customer-form"
					>
						@if (showSubmitSpinner()) {
							<app-spinner data-icon="start" />
						}
						{{ showSubmitSpinner() ? ('COMMON.SAVING' | translate) : ('COMMON.SAVE' | translate) }}
					</button>
				</div>
			</ng-template>
		</app-drawer>
	`,
})
export class EditCustomerDrawer {
	private readonly store = inject(CustomersStore)
	private readonly translation = inject(AppTranslation)
	protected readonly drawer = viewChild.required<Drawer>('drawer')

	/** The customer being edited; set by `open()`. */
	private readonly customer = signal<ICustomer | null>(null)

	protected readonly toast = createMutationToast(this.translation.instant('CLIENTS.EDIT_DRAWER.SUCCESS_TOAST'), {
		deferred: true,
	})

	private readonly model = signal<CustomerFormModel>(createEmptyCustomerForm())
	protected readonly customerForm = form(
		this.model,
		customerFormSchema({
			requireBirthDate: false,
			futureBirthDateMessage: this.translation.instant('CLIENT_FORM.ERRORS.FUTURE_BIRTH_DATE'),
		}),
	)

	protected readonly isFormValid = computed(() => this.customerForm().valid())
	protected readonly isDirty = computed(() => this.customerForm().dirty())
	private readonly closingAfterSuccess = signal(false)
	protected readonly showSubmitSpinner = computed(() => this.store.isUpdating() || this.closingAfterSuccess())
	protected readonly mutationError = computed(() => this.store.mutationError().update)

	private readonly closeOnSuccessEffect = effect(() => {
		const updating = this.store.isUpdating()
		const error = this.store.mutationError().update
		untracked(() => this.onUpdateSettled(updating, error))
	})

	public open(customer: ICustomer): void {
		this.customer.set(customer)
		this.model.set(toCustomerFormModel(customer))
		this.customerForm().reset()
		this.drawer().show()
		this.drawer().setContentReady()
	}

	protected onDrawerClosed(): void {
		this.store.clearMutationError('update')
	}

	protected onSubmit(event: Event): void {
		event.preventDefault()
		const customer = this.customer()
		if (!customer || customer.id === undefined || !this.isFormValid() || !this.isDirty()) return

		this.toast.markSubmitted()
		this.store.updateCustomer({ ...fromCustomerFormModel(this.model()), id: customer.id })
	}

	private onUpdateSettled(updating: boolean, error: string | null): void {
		if (this.toast.handleResult(updating, error) !== 'success') return
		this.closingAfterSuccess.set(true)
		setTimeout(() => {
			this.closingAfterSuccess.set(false)
			this.drawer().close()
		}, parseDurationToMs(DRAWER_CLOSE_AFTER_SUCCESS_DELAY))
	}
}
