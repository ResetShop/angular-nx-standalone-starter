import {
	ChangeDetectionStrategy,
	Component,
	computed,
	effect,
	inject,
	input,
	untracked,
	viewChild,
} from '@angular/core'
import { Router } from '@angular/router'
import { HasPermissionDirective } from '@directives/has-permission.directive'
import type { IManagedUser } from '@domain/user-management/managed-user.interface'
import { CurrentUser } from '@resetshop/angular-core/auth/current-user'
import { TranslatePipe } from '@resetshop/angular-core/i18n/translate.pipe'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import { Button } from '@resetshop/ui/button/button'
import { ConfirmDialog } from '@resetshop/ui/confirm-dialog/confirm-dialog'
import { createMutationToast } from '@store/ui/mutation-toast'
import { UsersStore } from '@store/users/users.store'

@Component({
	selector: 'app-user-danger-zone',
	standalone: true,
	imports: [Button, ConfirmDialog, HasPermissionDirective, TranslatePipe],
	template: `
		@if (!currentUser.is(user())) {
			<section
				class="border-destructive/30 bg-destructive/5 rounded-xl border p-4 sm:p-5"
				aria-labelledby="danger-zone-title"
			>
				<h2 id="danger-zone-title" class="text-destructive text-lg font-semibold">
					{{ 'USERS.DETAIL.DANGER.TITLE' | translate }}
				</h2>
				<p class="text-muted-foreground mt-1 text-sm">{{ 'USERS.DETAIL.DANGER.DESCRIPTION' | translate }}</p>

				<div class="mt-4 flex justify-end">
					<button (click)="deleteDialog().show()" *hasPermission="'admin:users:delete'" appButton variant="destructive">
						{{ 'USERS.DETAIL.DANGER.DELETE' | translate }}
					</button>
				</div>
			</section>

			<app-confirm-dialog
				(confirmed)="onDeleteConfirmed()"
				[title]="'USERS.PAGE.DELETE_DIALOG.TITLE' | translate"
				[message]="deleteMessage()"
				[confirmText]="'COMMON.DELETE' | translate"
				confirmVariant="destructive"
				#deleteDialog
			/>
		}
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDangerZone {
	public readonly user = input.required<IManagedUser>()

	private readonly usersStore = inject(UsersStore)
	private readonly translation = inject(Translation)
	private readonly router = inject(Router)
	protected readonly currentUser = inject(CurrentUser)

	private readonly deleteDialog = viewChild.required<ConfirmDialog>('deleteDialog')
	private readonly deleteToast = createMutationToast(this.translation.instant('USERS.DELETE_TOAST'))

	protected readonly deleteMessage = computed(() =>
		this.translation.instant('USERS.PAGE.DELETE_DIALOG.MESSAGE').replace('{name}', this.user().fullName),
	)

	// On successful delete, toast then navigate back to the list.
	private readonly deleteToastEffect = effect(() => {
		const deleting = this.usersStore.isDeleting()
		const error = this.usersStore.mutationError().delete
		untracked(() => {
			if (this.deleteToast.handleResult(deleting, error) === 'success') {
				void this.router.navigate(['/dashboard/users'])
			}
		})
	})

	protected onDeleteConfirmed(): void {
		this.deleteToast.markSubmitted()
		this.usersStore.deleteUser(this.user().id)
	}
}
