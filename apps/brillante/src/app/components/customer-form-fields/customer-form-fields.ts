import { Component, input } from '@angular/core'
import { type FieldTree, FormField as SignalFormField } from '@angular/forms/signals'
import type { CustomerFormModel } from '@domain/customer/customer-form'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { FormField } from '@resetshop/ui/form-field/form-field'

/**
 * The customer detail inputs shared by the clients drawers and the profile page. The owning form
 * is created by the host (so it controls validation, reset and submission); this component only
 * lays the fields out. Read-only state, such as a fixed email, comes from the form's own rules.
 */
@Component({
	selector: 'app-customer-form-fields',
	standalone: true,
	imports: [FormField, SignalFormField, TranslatePipe],
	template: `
		<div class="flex flex-col gap-4">
			@if (showCustomerDetails()) {
				<app-form-field [label]="'CLIENT_FORM.DNI' | translate">
					<input [formField]="fields().dni" type="text" inputmode="numeric" autocomplete="off" />
				</app-form-field>
			}

			<app-form-field [label]="'CLIENT_FORM.FIRST_NAME' | translate">
				<input [formField]="fields().firstName" type="text" autocomplete="given-name" />
			</app-form-field>

			<app-form-field [label]="'CLIENT_FORM.LAST_NAME' | translate">
				<input [formField]="fields().lastName" type="text" autocomplete="family-name" />
			</app-form-field>

			<app-form-field [label]="'CLIENT_FORM.EMAIL' | translate">
				<input [formField]="fields().email" type="email" autocomplete="email" />
			</app-form-field>

			@if (showCustomerDetails()) {
				<app-form-field [label]="'CLIENT_FORM.BIRTH_DATE' | translate">
					<input [formField]="fields().birthDate" type="date" autocomplete="bday" />
				</app-form-field>

				<app-form-field [label]="'CLIENT_FORM.TELEPHONE' | translate" [hint]="'CLIENT_FORM.TELEPHONE_HINT' | translate">
					<input [formField]="fields().telephone" type="tel" inputmode="numeric" autocomplete="tel" />
				</app-form-field>

				<app-form-field [label]="'CLIENT_FORM.ADDRESS' | translate">
					<input [formField]="fields().address" type="text" autocomplete="street-address" />
				</app-form-field>
			}
		</div>
	`,
})
export class CustomerFormFields {
	public readonly fields = input.required<FieldTree<CustomerFormModel>>()
	/** Hides the customer-only inputs (DNI, birth date, telephone, address). */
	public readonly showCustomerDetails = input(true)
}
