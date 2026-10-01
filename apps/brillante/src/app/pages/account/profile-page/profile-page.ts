import { Component, computed, effect, inject, signal, untracked } from '@angular/core'
import { apply, form, readonly, required } from '@angular/forms/signals'
import { CustomerFormFields } from '@components/customer-form-fields/customer-form-fields'
import { PageShell } from '@components/page-shell/page-shell'
import { UserRole } from '@contracts/permission/permission.constants'
import {
	createEmptyCustomerForm,
	type CustomerFormModel,
	fromCustomerFormModel,
	toCustomerFormModel,
} from '@domain/customer/customer-form'
import { customerFormSchema } from '@domain/customer/customer-form.schema'
import { AppTranslation } from '@providers/i18n/app-translation'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Alert, AlertDescription, AlertTitle } from '@resetshop/ui/alert/alert'
import { Button } from '@resetshop/ui/button/button'
import { Spinner } from '@resetshop/ui/spinner/spinner'
import { AuthStore } from '@store/auth/auth.store'
import { ProfileStore } from '@store/customers/profile.store'
import { createMutationToast } from '@store/ui/mutation-toast'

/**
 * The signed-in user's own profile. Every account can edit its name; customer accounts also
 * complete their customer registration (DNI, birth date, telephone, address). The email is the
 * account identity and is shown read-only.
 */
@Component({
	selector: 'app-profile-page',
	standalone: true,
	imports: [Alert, AlertDescription, AlertTitle, Button, CustomerFormFields, PageShell, Spinner, TranslatePipe],
	template: `
		<app-page-shell
			[loading]="store.isLoading()"
			[error]="store.readError().customer"
			[title]="'PROFILE.TITLE' | translate"
		>
			<p pageDescription>{{ 'PROFILE.DESCRIPTION' | translate }}</p>

			@if (needsRegistration()) {
				<div appAlert data-testid="profile-incomplete">
					<h3 appAlertTitle>{{ 'PROFILE.INCOMPLETE_TITLE' | translate }}</h3>
					<p appAlertDescription>{{ 'PROFILE.INCOMPLETE_MESSAGE' | translate }}</p>
				</div>
			}

			<form
				(submit)="onSubmit($event)"
				class="border-border bg-card flex max-w-2xl flex-col gap-4 rounded-xl border p-4 sm:p-6"
			>
				<h2 class="text-foreground text-lg font-semibold">
					{{ (isCustomer ? 'PROFILE.CUSTOMER_SECTION' : 'PROFILE.PERSONAL_SECTION') | translate }}
				</h2>

				@if (mutationError()) {
					<div appAlert variant="destructive">
						<p appAlertDescription>{{ mutationError() }}</p>
					</div>
				}

				<app-customer-form-fields [fields]="profileForm" [showCustomerDetails]="isCustomer" />
				<p class="text-muted-foreground text-sm">{{ 'PROFILE.EMAIL_HINT' | translate }}</p>

				<div class="flex justify-end">
					<button [disabled]="store.isSaving() || !isFormValid() || !isDirty()" appButton type="submit">
						@if (store.isSaving()) {
							<app-spinner data-icon="start" />
						}
						{{ (store.isSaving() ? 'PROFILE.SAVING' : 'PROFILE.SAVE') | translate }}
					</button>
				</div>
			</form>
		</app-page-shell>
	`,
})
export default class ProfilePage {
	protected readonly store = inject(ProfileStore)
	private readonly authStore = inject(AuthStore)
	private readonly translation = inject(AppTranslation)

	private readonly user = this.authStore.currentUser()
	protected readonly isCustomer = !!this.user?.hasRole(UserRole.CUSTOMER)

	private readonly saveToast = createMutationToast(this.translation.instant('PROFILE.SUCCESS_TOAST'))

	private readonly model = signal<CustomerFormModel>({
		...createEmptyCustomerForm(),
		firstName: this.user?.firstName ?? '',
		lastName: this.user?.lastName ?? '',
		email: this.user?.email ?? '',
	})
	protected readonly profileForm = form(this.model, (profile) => {
		if (this.isCustomer) {
			apply(
				profile,
				customerFormSchema({
					requireBirthDate: true,
					futureBirthDateMessage: this.translation.instant('CLIENT_FORM.ERRORS.FUTURE_BIRTH_DATE'),
				}),
			)
		} else {
			required(profile.firstName)
			required(profile.lastName)
		}
		readonly(profile.email)
	})

	protected readonly isFormValid = computed(() => this.profileForm().valid())
	protected readonly isDirty = computed(() => this.profileForm().dirty())
	protected readonly mutationError = computed(() => this.store.mutationError().save)
	protected readonly needsRegistration = computed(
		() => this.isCustomer && !(this.authStore.currentUser()?.hasFinishedRegistration ?? true),
	)

	private readonly populateEffect = effect(() => {
		const customer = this.store.customer()
		if (!customer) return
		untracked(() => {
			const user = this.authStore.currentUser()
			// The account's own name wins over the customer record's copy of it.
			this.model.set({
				...toCustomerFormModel(customer),
				firstName: user?.firstName || customer.firstName,
				lastName: user?.lastName || customer.lastName,
				email: user?.email ?? customer.email,
			})
			this.profileForm().reset()
		})
	})

	private readonly saveResultEffect = effect(() => {
		const saving = this.store.isSaving()
		const error = this.store.mutationError().save
		untracked(() => {
			if (this.saveToast.handleResult(saving, error) === 'success') {
				this.profileForm().reset()
			}
		})
	})

	constructor() {
		if (this.isCustomer && this.user) {
			this.store.loadCustomer(this.user.email)
		}
	}

	protected onSubmit(event: Event): void {
		event.preventDefault()
		if (!this.isFormValid() || !this.isDirty()) return

		const { firstName, lastName } = this.model()
		this.saveToast.markSubmitted()
		this.store.saveProfile({
			firstName: firstName.trim(),
			lastName: lastName.trim(),
			customer: this.isCustomer ? fromCustomerFormModel(this.model()) : null,
		})
	}
}
