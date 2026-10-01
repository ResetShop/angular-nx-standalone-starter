import { Component, computed, effect, inject, signal, untracked, viewChild } from '@angular/core'
import { form } from '@angular/forms/signals'
import { applyDeviceChanges, applyTrackingChanges } from '@domain/repair/repair.mapper'
import type { Repair } from '@domain/repair/repair.model'
import { AppTranslation } from '@providers/i18n/app-translation'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Alert, AlertDescription } from '@resetshop/ui/alert/alert'
import { Button } from '@resetshop/ui/button/button'
import { ConfirmDialog } from '@resetshop/ui/confirm-dialog/confirm-dialog'
import { Drawer } from '@resetshop/ui/drawer/drawer'
import { DrawerFooter } from '@resetshop/ui/drawer/drawer-footer'
import { Spinner } from '@resetshop/ui/spinner/spinner'
import { parseDurationToMs } from '@resetshop/util'
import { createMutationToast } from '@store/ui/mutation-toast'
import { RepairDeviceFields } from '../repair-device-fields/repair-device-fields'
import { toDeviceChanges } from '../repair-device-fields/repair-device.form'
import { RepairTrackingFields } from '../repair-tracking-fields/repair-tracking-fields'
import {
	generatesTransaction,
	paymentsMismatch,
	toTrackingChanges,
} from '../repair-tracking-fields/repair-tracking.form'
import { RepairStore } from '../repair.store'
import { DRAWER_CLOSE_AFTER_SUCCESS_DELAY } from '../repairs.constants'
import {
	editFormModelFromRepair,
	emptyEditFormModel,
	repairEditSchema,
	type RepairEditFormModel,
} from './repair-edit.form'

interface TrackingSubmission {
	repair: Repair
	generateTransaction: boolean
}

/**
 * Single edit surface for a stored repair: its device information and its tracking data (status,
 * price, cost, advance, warranty, note and, when the repair is closed with a price, the payments
 * that settle it). Only the blocks that changed are sent, the device first and the tracking after
 * it, so one save never overwrites the other with stale values.
 *
 * The repair to edit is passed to `open(repair)`, so one instance serves every row of the list as
 * well as the detail page. The drawer edits the full repair held by the store (`selectedRepair`),
 * loading it first when it is not the one selected.
 */
@Component({
	selector: 'app-repair-edit-drawer',
	standalone: true,
	imports: [
		Alert,
		AlertDescription,
		Button,
		ConfirmDialog,
		Drawer,
		DrawerFooter,
		RepairDeviceFields,
		RepairTrackingFields,
		Spinner,
		TranslatePipe,
	],
	template: `
		<app-drawer
			(closed)="onDrawerClosed()"
			(afterClosed)="flushToasts()"
			[closeOnBackdrop]="false"
			[title]="title()"
			class="w-full sm:w-lg"
			#drawerRef
		>
			<form (submit)="onSubmit($event)" id="edit-repair-form" class="flex flex-col gap-6" novalidate>
				@if (loadError()) {
					<div appAlert variant="destructive">
						<p appAlertDescription>{{ loadError() }}</p>
					</div>
				}

				@if (mutationError()) {
					<div appAlert variant="destructive">
						<p appAlertDescription>{{ mutationError() }}</p>
					</div>
				}

				@if (repair()) {
					<section class="border-border bg-card rounded-xl border p-4" aria-labelledby="edit-device-title">
						<h2 id="edit-device-title" class="text-foreground mb-4 text-lg font-semibold">
							{{ 'REPAIRS.DEVICE.TITLE' | translate }}
						</h2>
						<app-repair-device-fields [device]="editForm.device" />
					</section>

					<section class="border-border bg-card rounded-xl border p-4" aria-labelledby="edit-tracking-title">
						<h2 id="edit-tracking-title" class="text-foreground mb-4 text-lg font-semibold">
							{{ 'REPAIRS.TRACKING.TITLE' | translate }}
						</h2>
						<app-repair-tracking-fields
							[tracking]="editForm.tracking"
							[statuses]="store.statuses()"
							[paymentMethods]="store.paymentMethods()"
						/>
					</section>
				}
			</form>

			<ng-template appDrawerFooter>
				<div class="flex justify-end gap-3">
					<button (click)="onCancel()" appButton variant="outline" type="button">
						{{ 'COMMON.CANCEL' | translate }}
					</button>
					<button [disabled]="!canSave()" appButton type="submit" form="edit-repair-form">
						@if (showSubmitSpinner()) {
							<app-spinner data-icon="start" />
						}
						{{ showSubmitSpinner() ? ('COMMON.SAVING' | translate) : ('REPAIRS.EDIT_DRAWER.SAVE' | translate) }}
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
export class RepairEditDrawer {
	protected readonly store = inject(RepairStore)

	private readonly translation = inject(AppTranslation)
	protected readonly drawer = viewChild.required<Drawer>('drawerRef')
	private readonly discardDialog = viewChild.required<ConfirmDialog>('discardDialogRef')

	private readonly deviceToast = createMutationToast(this.translation.instant('REPAIRS.DEVICE.SUCCESS_TOAST'), {
		deferred: true,
	})
	private readonly trackingToast = createMutationToast(this.translation.instant('REPAIRS.TRACKING.SUCCESS_TOAST'), {
		deferred: true,
	})

	/** One object per `open()` call, so reopening the same repair starts a fresh editing session. */
	private readonly session = signal<{ id: number } | null>(null)
	private initialisedSession: object | null = null
	private pendingTracking: TrackingSubmission | null = null

	/** The stored repair being edited; null until the store holds the repair the session targets. */
	protected readonly repair = computed(() => {
		const id = this.session()?.id
		const selected = this.store.selectedRepair()
		return id !== undefined && selected?.id === id ? selected : null
	})

	private readonly model = signal<RepairEditFormModel>(emptyEditFormModel())
	protected readonly editForm = form(this.model, repairEditSchema)

	protected readonly title = computed(() => {
		const base = this.translation.instant('REPAIRS.EDIT_DRAWER.TITLE')
		const id = this.session()?.id
		return id === undefined ? base : `${base} #${id}`
	})

	protected readonly loadError = computed(() =>
		this.session() !== null && this.repair() === null ? this.store.readError().detail : null,
	)

	protected readonly mutationError = computed(
		() => this.store.mutationError().updateDevice ?? this.store.mutationError().updateTracking,
	)

	private readonly deviceChanged = computed(() => {
		const repair = this.repair()
		return (
			repair !== null && JSON.stringify(this.model().device) !== JSON.stringify(editFormModelFromRepair(repair).device)
		)
	})

	private readonly trackingChanged = computed(() => {
		const repair = this.repair()
		return (
			repair !== null &&
			JSON.stringify(this.model().tracking) !== JSON.stringify(editFormModelFromRepair(repair).tracking)
		)
	})

	private readonly closingAfterSuccess = signal(false)

	protected readonly showSubmitSpinner = computed(
		() => this.store.isUpdatingDevice() || this.store.isUpdatingTracking() || this.closingAfterSuccess(),
	)

	protected readonly canSave = computed(
		() =>
			this.repair() !== null &&
			(this.deviceChanged() || this.trackingChanged()) &&
			this.editForm().valid() &&
			!paymentsMismatch(this.model().tracking) &&
			!this.showSubmitSpinner(),
	)

	private readonly loadSessionEffect = effect(() => {
		const session = this.session()
		const repair = this.repair()
		const failed = this.loadError() !== null
		untracked(() => this.onSessionContent(session, repair, failed))
	})

	private readonly deviceResultEffect = effect(() => {
		const updating = this.store.isUpdatingDevice()
		const error = this.store.mutationError().updateDevice
		untracked(() => this.onDeviceSettled(this.deviceToast.handleResult(updating, error)))
	})

	private readonly trackingResultEffect = effect(() => {
		const updating = this.store.isUpdatingTracking()
		const error = this.store.mutationError().updateTracking
		untracked(() => {
			if (this.trackingToast.handleResult(updating, error) === 'success') this.closeAfterSuccess()
		})
	})

	public open(repair: Repair): void {
		if (repair.id === null) return
		if (this.store.selectedRepair()?.id !== repair.id) this.store.loadRepair(repair.id)
		this.session.set({ id: repair.id })
		this.drawer().show()
	}

	protected flushToasts(): void {
		this.deviceToast.flushPending()
		this.trackingToast.flushPending()
	}

	protected onCancel(): void {
		if (this.editForm().dirty()) {
			this.discardDialog().show()
		} else {
			this.drawer().close()
		}
	}

	protected onDrawerClosed(): void {
		this.pendingTracking = null
		this.store.clearMutationError('updateDevice')
		this.store.clearMutationError('updateTracking')
	}

	protected onSubmit(event: Event): void {
		event.preventDefault()
		const repair = this.repair()
		if (!repair || !this.canSave()) return

		const { device, tracking } = this.model()
		const withDevice = applyDeviceChanges(repair, toDeviceChanges(device))
		const trackingChanges = toTrackingChanges(
			tracking,
			this.store.statuses(),
			this.store.paymentMethods(),
			repair.payments,
		)
		const submission: TrackingSubmission | null = this.trackingChanged()
			? {
					repair: applyTrackingChanges(withDevice, trackingChanges),
					generateTransaction: generatesTransaction(tracking),
				}
			: null

		if (this.deviceChanged()) {
			this.pendingTracking = submission
			this.deviceToast.markSubmitted()
			this.store.updateDeviceInfo(withDevice)
		} else if (submission) {
			this.submitTracking(submission)
		}
	}

	/** Starts an editing session on the first render of its repair, or surfaces a failed load. */
	private onSessionContent(session: object | null, repair: Repair | null, failed: boolean): void {
		if (session === null || this.initialisedSession === session) return
		if (repair === null && !failed) return
		this.initialisedSession = session
		if (repair !== null) {
			this.model.set(editFormModelFromRepair(repair))
			this.editForm().reset()
		}
		this.drawer().setContentReady()
	}

	private onDeviceSettled(result: 'success' | 'error' | null): void {
		if (result === null) return
		const next = this.pendingTracking
		this.pendingTracking = null
		if (result === 'error') return
		if (next) {
			this.submitTracking(next)
		} else {
			this.closeAfterSuccess()
		}
	}

	private submitTracking(submission: TrackingSubmission): void {
		this.trackingToast.markSubmitted()
		this.store.updateTrackingInfo(submission)
	}

	private closeAfterSuccess(): void {
		this.closingAfterSuccess.set(true)
		setTimeout(() => {
			this.closingAfterSuccess.set(false)
			this.drawer().close()
		}, parseDurationToMs(DRAWER_CLOSE_AFTER_SUCCESS_DELAY))
	}
}
