import { Component, computed, effect, inject, signal, untracked, viewChild } from '@angular/core'
import { form, maxLength, required, schema, FormField as SignalFormField } from '@angular/forms/signals'
import { TRANSACTION_TYPES, TransactionTypeId } from '@domain/cash-concept/cash-concept.constants'
import type { CashConceptRow } from '@domain/cash-concept/cash-concept.interface'
import { AppTranslation } from '@providers/i18n/app-translation'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Alert, AlertDescription } from '@resetshop/ui/alert/alert'
import { Button } from '@resetshop/ui/button/button'
import { ConfirmDialog } from '@resetshop/ui/confirm-dialog/confirm-dialog'
import { Drawer } from '@resetshop/ui/drawer/drawer'
import { DrawerFooter } from '@resetshop/ui/drawer/drawer-footer'
import { FormField } from '@resetshop/ui/form-field/form-field'
import { Select } from '@resetshop/ui/select/select'
import type { SelectOption } from '@resetshop/ui/select/select-option'
import { Spinner } from '@resetshop/ui/spinner/spinner'
import { parseDurationToMs } from '@resetshop/util'
import { createMutationToast } from '@store/ui/mutation-toast'
import { DRAWER_CLOSE_AFTER_SUCCESS_DELAY } from '../../settings.constants'
import { CashConceptsStore } from '../cash-concepts.store'

interface ConceptFormModel {
	description: string
	/** Transaction type id as text, the value type of the select control. */
	transactionTypeId: string
	/** Id of the parent concept as text; empty while a top level concept is handled. */
	parentId: string
	userAssignable: boolean
	modifiable: boolean
}

type ConceptDrawerMode = 'create-concept' | 'create-subconcept' | 'edit'

/**
 * Create and edit surface for cash concepts. A top level concept picks its transaction type, a
 * subconcept picks the concept it belongs to (and inherits that concept's type), and an existing
 * concept can only change its description and flags.
 */
@Component({
	selector: 'app-concept-drawer',
	imports: [
		Alert,
		AlertDescription,
		Button,
		ConfirmDialog,
		Drawer,
		DrawerFooter,
		FormField,
		Select,
		SignalFormField,
		Spinner,
		TranslatePipe,
	],
	template: `
		<app-drawer
			(closed)="onDrawerClosed()"
			(afterClosed)="createToast.flushPending(); updateToast.flushPending()"
			[closeOnBackdrop]="false"
			[title]="title()"
			class="w-full sm:w-lg"
			#drawer
		>
			<form (submit)="onSubmit($event)" id="concept-form" class="flex h-full flex-col gap-4">
				@if (mutationError()) {
					<div appAlert variant="destructive">
						<p appAlertDescription>{{ mutationError() }}</p>
					</div>
				}

				@if (mode() === 'create-subconcept') {
					<app-form-field [label]="'CASH_CONCEPTS.DRAWER.PARENT' | translate">
						<app-select
							[formField]="conceptForm.parentId"
							[options]="parentOptions()"
							[placeholder]="'CASH_CONCEPTS.DRAWER.PARENT_PLACEHOLDER' | translate"
						/>
					</app-form-field>
				}

				<app-form-field [label]="'CASH_CONCEPTS.DRAWER.DESCRIPTION' | translate">
					<input [formField]="conceptForm.description" type="text" />
				</app-form-field>

				@if (mode() === 'create-concept') {
					<app-form-field [label]="'CASH_CONCEPTS.DRAWER.TYPE' | translate">
						<app-select [formField]="conceptForm.transactionTypeId" [options]="typeOptions()" />
					</app-form-field>
				} @else {
					<div class="flex flex-col gap-1.5">
						<span class="text-foreground text-sm font-medium">{{ 'CASH_CONCEPTS.DRAWER.TYPE' | translate }}</span>
						<span class="text-muted-foreground text-sm" data-testid="concept-type-readonly">{{ typeLabel() }}</span>
					</div>
				}

				<app-form-field [label]="'CASH_CONCEPTS.DRAWER.MODIFIABLE' | translate">
					<input [formField]="conceptForm.modifiable" type="checkbox" />
				</app-form-field>

				@if (hasAssignableFlag()) {
					<app-form-field [label]="'CASH_CONCEPTS.DRAWER.USER_ASSIGNABLE' | translate">
						<input [formField]="conceptForm.userAssignable" type="checkbox" />
					</app-form-field>
				}
			</form>

			<ng-template appDrawerFooter>
				<div class="flex justify-end gap-3">
					<button (click)="onCancel()" appButton variant="outline">{{ 'COMMON.CANCEL' | translate }}</button>
					<button [disabled]="!canSubmit()" appButton type="submit" form="concept-form">
						@if (isSaving()) {
							<app-spinner data-icon="start" />
						}
						{{ submitLabelKey() | translate }}
					</button>
				</div>
			</ng-template>
		</app-drawer>

		<app-confirm-dialog
			(confirmed)="drawer.close()"
			[title]="'COMMON.DISCARD_DIALOG.TITLE' | translate"
			[message]="'COMMON.DISCARD_DIALOG.MESSAGE' | translate"
			[confirmText]="'COMMON.DISCARD_DIALOG.CONFIRM' | translate"
			confirmVariant="destructive"
			#discardDialog
		/>
	`,
})
export class ConceptDrawer {
	private readonly store = inject(CashConceptsStore)
	private readonly translation = inject(AppTranslation)
	private readonly drawer = viewChild.required<Drawer>('drawer')
	private readonly discardDialog = viewChild.required<ConfirmDialog>('discardDialog')

	protected readonly createToast = createMutationToast(this.translation.instant('CASH_CONCEPTS.SUCCESS.CREATED'), {
		deferred: true,
	})
	protected readonly updateToast = createMutationToast(this.translation.instant('CASH_CONCEPTS.SUCCESS.UPDATED'), {
		deferred: true,
	})

	protected readonly mode = signal<ConceptDrawerMode>('create-concept')
	/** The concept being edited; null while the drawer creates one. */
	private readonly editedConcept = signal<CashConceptRow | null>(null)

	protected readonly model = signal<ConceptFormModel>(emptyModel())
	protected readonly conceptForm = form(
		this.model,
		schema<ConceptFormModel>((concept) => {
			required(concept.description)
			maxLength(concept.description, 100)
			required(concept.parentId, { when: () => this.mode() === 'create-subconcept' })
		}),
	)

	protected readonly typeOptions = computed<SelectOption[]>(() =>
		TRANSACTION_TYPES.map((type) => ({
			value: String(type.id),
			label: this.translation.instant(typeLabelKey(type.id)),
		})),
	)
	protected readonly parentOptions = computed<SelectOption[]>(() =>
		this.store.parentCandidates().map((concept) => ({ value: String(concept.id), label: concept.description })),
	)

	/** Text of the transaction type: the edited concept's, or the chosen parent's for a new subconcept. */
	protected readonly typeLabel = computed(() => {
		const edited = this.editedConcept()
		const parent = this.store.parentCandidates().find((concept) => String(concept.id) === this.model().parentId)
		const typeId = edited?.transactionTypeId ?? parent?.transactionTypeId
		return typeId === undefined ? '' : this.translation.instant(typeLabelKey(typeId))
	})

	/** Top level concepts are always assignable by the user, so only subconcepts expose the flag. */
	protected readonly hasAssignableFlag = computed(() => {
		const edited = this.editedConcept()
		return edited ? edited.level === 1 : this.mode() === 'create-subconcept'
	})

	protected readonly title = computed(() => {
		switch (this.mode()) {
			case 'create-concept':
				return this.translation.instant('CASH_CONCEPTS.DRAWER.CREATE_CONCEPT_TITLE')
			case 'create-subconcept':
				return this.translation.instant('CASH_CONCEPTS.DRAWER.CREATE_SUBCONCEPT_TITLE')
			case 'edit':
				return this.translation.instant('CASH_CONCEPTS.DRAWER.EDIT_TITLE')
		}
	})
	protected readonly mutationError = computed(() =>
		this.mode() === 'edit' ? this.store.mutationError().update : this.store.mutationError().create,
	)

	private readonly closingAfterSuccess = signal(false)
	protected readonly isSaving = computed(
		() => this.store.isCreating() || this.store.isUpdating() || this.closingAfterSuccess(),
	)
	protected readonly canSubmit = computed(
		() => !this.isSaving() && this.conceptForm().valid() && (this.mode() !== 'edit' || this.conceptForm().dirty()),
	)
	protected readonly submitLabelKey = computed(() => {
		const editing = this.mode() === 'edit'
		if (this.isSaving()) return editing ? 'COMMON.SAVING' : 'COMMON.CREATING'
		return editing ? 'COMMON.SAVE' : 'COMMON.CREATE'
	})

	private readonly closeOnSuccessEffect = effect(() => {
		const creating = this.store.isCreating()
		const updating = this.store.isUpdating()
		const createError = this.store.mutationError().create
		const updateError = this.store.mutationError().update
		untracked(() => {
			const outcome =
				this.createToast.handleResult(creating, createError) ?? this.updateToast.handleResult(updating, updateError)
			if (outcome === 'success') {
				this.closeAfterSuccessDelay()
			}
		})
	})

	public openCreateConcept(): void {
		this.open('create-concept', null, emptyModel())
	}

	public openCreateSubconcept(parentId?: number): void {
		this.open('create-subconcept', null, { ...emptyModel(), parentId: parentId === undefined ? '' : String(parentId) })
	}

	public openEdit(concept: CashConceptRow): void {
		this.open('edit', concept, {
			description: concept.description,
			transactionTypeId: String(concept.transactionTypeId),
			parentId: concept.parentId === null ? '' : String(concept.parentId),
			userAssignable: concept.userAssignable,
			modifiable: concept.modifiable,
		})
	}

	protected onCancel(): void {
		if (this.conceptForm().dirty()) {
			this.discardDialog().show()
		} else {
			this.drawer().close()
		}
	}

	protected onDrawerClosed(): void {
		this.model.set(emptyModel())
		this.conceptForm().reset()
		this.store.clearMutationError('create')
		this.store.clearMutationError('update')
	}

	protected onSubmit(event: Event): void {
		event.preventDefault()
		if (!this.canSubmit()) return

		const { description, transactionTypeId, parentId, userAssignable, modifiable } = this.model()
		const edited = this.editedConcept()

		if (edited) {
			this.updateToast.markSubmitted()
			this.store.updateConcept({ id: edited.id, description, userAssignable, modifiable })
			return
		}

		this.createToast.markSubmitted()
		this.store.createConcept({
			description,
			transactionTypeId: Number(transactionTypeId),
			parentId: parentId === '' ? null : Number(parentId),
			userAssignable,
			modifiable,
		})
	}

	private open(mode: ConceptDrawerMode, concept: CashConceptRow | null, model: ConceptFormModel): void {
		this.mode.set(mode)
		this.editedConcept.set(concept)
		this.model.set(model)
		this.conceptForm().reset()
		this.drawer().show()
		this.drawer().setContentReady()
	}

	private closeAfterSuccessDelay(): void {
		this.closingAfterSuccess.set(true)
		setTimeout(() => {
			this.closingAfterSuccess.set(false)
			this.drawer().close()
		}, parseDurationToMs(DRAWER_CLOSE_AFTER_SUCCESS_DELAY))
	}
}

function emptyModel(): ConceptFormModel {
	return {
		description: '',
		transactionTypeId: String(TransactionTypeId.INCOME),
		parentId: '',
		userAssignable: true,
		modifiable: true,
	}
}

function typeLabelKey(typeId: number): 'CASH_CONCEPTS.TYPE.INCOME' | 'CASH_CONCEPTS.TYPE.EXPENSE' {
	return typeId === TransactionTypeId.INCOME ? 'CASH_CONCEPTS.TYPE.INCOME' : 'CASH_CONCEPTS.TYPE.EXPENSE'
}
