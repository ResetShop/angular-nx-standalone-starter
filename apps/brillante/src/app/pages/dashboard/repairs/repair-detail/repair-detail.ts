import { Component, computed, effect, inject, untracked, viewChild } from '@angular/core'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { PageShell } from '@components/page-shell/page-shell'
import { Permission } from '@contracts/permission/permission.constants'
import { canGenerateVoucher } from '@domain/repair/repair.functions'
import { applyDeviceChanges, applyTrackingChanges } from '@domain/repair/repair.mapper'
import type { RepairDeviceChanges } from '@domain/repair/repair.model'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { featherArrowLeft, featherPrinter, featherTrash2 } from '@ng-icons/feather-icons'
import { AppTranslation } from '@providers/i18n/app-translation'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Button } from '@resetshop/ui/button/button'
import { ConfirmDialog } from '@resetshop/ui/confirm-dialog/confirm-dialog'
import { AuthStore } from '@store/auth/auth.store'
import { RepairStore } from '@store/repair/repair.store'
import { createMutationToast } from '@store/ui/mutation-toast'
import { UIStore } from '@store/ui/ui.store'
import { NotificationType } from '@store/ui/ui.types'
import { RepairStatusBadge } from '../repair-status-badge/repair-status-badge'
import { RepairVoucherPrinter } from '../repair-voucher/repair-voucher.printer'
import { RepairDeviceForm } from './repair-device-form'
import { RepairHistory } from './repair-history'
import { RepairSummary } from './repair-summary'
import { type RepairTrackingSubmission, RepairTrackingForm } from './repair-tracking-form'

@Component({
	selector: 'app-repair-detail',
	standalone: true,
	imports: [
		Button,
		ConfirmDialog,
		NgIcon,
		PageShell,
		RepairDeviceForm,
		RepairHistory,
		RepairStatusBadge,
		RepairSummary,
		RepairTrackingForm,
		RouterLink,
		TranslatePipe,
	],
	viewProviders: [provideIcons({ featherArrowLeft, featherPrinter, featherTrash2 })],
	template: `
		<a
			routerLink="/dashboard/repairs"
			class="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-2 text-sm font-medium"
		>
			<ng-icon name="featherArrowLeft" size="16" />
			{{ 'REPAIRS.DETAIL.BACK' | translate }}
		</a>

		<app-page-shell [title]="pageTitle()" [loading]="store.isLoadingDetail()" [error]="store.readError().detail">
			<section class="flex flex-col gap-4">
				@if (store.selectedRepair(); as repair) {
					<div class="flex flex-wrap items-center justify-between gap-3">
						<app-repair-status-badge [status]="repair.status" />
						<div class="flex gap-3">
							<button (click)="onPrint()" appButton type="button" variant="outline">
								<ng-icon data-icon="start" name="featherPrinter" size="16" />
								{{ 'REPAIRS.DETAIL.PRINT_VOUCHER' | translate }}
							</button>
							@if (canManage()) {
								<button (click)="onDeleteClick()" appButton type="button" variant="destructive">
									<ng-icon data-icon="start" name="featherTrash2" size="16" />
									{{ 'COMMON.DELETE' | translate }}
								</button>
							}
						</div>
					</div>

					<app-repair-summary [repair]="repair" />

					@if (canManage()) {
						<app-repair-device-form
							(save)="onSaveDevice($event)"
							[repair]="repair"
							[saving]="store.isUpdatingDevice()"
						/>
						<app-repair-tracking-form
							(save)="onSaveTracking($event)"
							[repair]="repair"
							[statuses]="store.statuses()"
							[paymentMethods]="store.paymentMethods()"
							[saving]="store.isUpdatingTracking()"
						/>
					}

					<app-repair-history [entries]="store.history()" />
				}
			</section>
		</app-page-shell>

		<app-confirm-dialog
			(confirmed)="onDeleteConfirmed()"
			[title]="'REPAIRS.DELETE_DIALOG.TITLE' | translate"
			[message]="deleteMessage()"
			[confirmText]="'COMMON.DELETE' | translate"
			#confirmDeleteDialog
			confirmVariant="destructive"
		/>
	`,
})
export default class RepairDetail {
	protected readonly store = inject(RepairStore)

	private readonly authStore = inject(AuthStore)
	private readonly uiStore = inject(UIStore)
	private readonly route = inject(ActivatedRoute)
	private readonly router = inject(Router)
	private readonly translation = inject(AppTranslation)
	private readonly printer = inject(RepairVoucherPrinter)

	private readonly repairId = Number(this.route.snapshot.paramMap.get('id'))
	private readonly deleteDialog = viewChild.required<ConfirmDialog>('confirmDeleteDialog')

	private readonly deviceToast = createMutationToast(this.translation.instant('REPAIRS.DEVICE.SUCCESS_TOAST'))
	private readonly trackingToast = createMutationToast(this.translation.instant('REPAIRS.TRACKING.SUCCESS_TOAST'))
	private readonly deleteToast = createMutationToast(this.translation.instant('REPAIRS.DELETE_TOAST'))

	protected readonly canManage = computed(
		() => this.authStore.currentUser()?.hasPermission(Permission.REPAIRS_MANAGE) ?? false,
	)

	protected readonly pageTitle = computed(() => {
		const title = this.translation.instant('REPAIRS.DETAIL.TITLE')
		return this.store.selectedRepair() ? `${title} #${this.store.selectedRepair()?.id}` : title
	})

	protected readonly deleteMessage = computed(() =>
		this.translation.instant('REPAIRS.DELETE_DIALOG.MESSAGE').replace('{id}', String(this.repairId)),
	)

	private readonly deviceToastEffect = effect(() => {
		const updating = this.store.isUpdatingDevice()
		const error = this.store.mutationError().updateDevice
		untracked(() => this.deviceToast.handleResult(updating, error))
	})

	private readonly trackingToastEffect = effect(() => {
		const updating = this.store.isUpdatingTracking()
		const error = this.store.mutationError().updateTracking
		untracked(() => this.trackingToast.handleResult(updating, error))
	})

	// Toast then leave the page once the viewed repair is deleted: the page has nothing left to show.
	private readonly deleteSuccessEffect = effect(() => {
		const deleting = this.store.isDeleting()
		const error = this.store.mutationError().delete
		untracked(() => {
			if (this.deleteToast.handleResult(deleting, error) === 'success') {
				void this.router.navigate(['/dashboard/repairs'])
			}
		})
	})

	constructor() {
		// Read the snapshot once: the route id is stable for the lifetime of the page.
		if (Number.isInteger(this.repairId) && this.repairId > 0) {
			this.store.selectRepair(null)
			this.store.loadRepair(this.repairId)
			this.store.loadHistory(this.repairId)
		}
	}

	protected onSaveDevice(changes: RepairDeviceChanges): void {
		const repair = this.store.selectedRepair()
		if (!repair) return
		this.deviceToast.markSubmitted()
		this.store.updateDeviceInfo(applyDeviceChanges(repair, changes))
	}

	protected onSaveTracking({ changes, generateTransaction }: RepairTrackingSubmission): void {
		const repair = this.store.selectedRepair()
		if (!repair) return
		this.trackingToast.markSubmitted()
		this.store.updateTrackingInfo({ repair: applyTrackingChanges(repair, changes), generateTransaction })
	}

	protected onPrint(): void {
		const repair = this.store.selectedRepair()
		if (!repair) return
		if (canGenerateVoucher(repair)) {
			this.printer.print(repair)
			return
		}
		this.uiStore.showNotification({
			type: NotificationType.INFO,
			message: this.translation.instant('REPAIRS.VOUCHER.NOT_AVAILABLE'),
		})
	}

	protected onDeleteClick(): void {
		this.deleteDialog().show()
	}

	protected onDeleteConfirmed(): void {
		this.deleteToast.markSubmitted()
		this.store.deleteRepair(this.repairId)
	}
}
