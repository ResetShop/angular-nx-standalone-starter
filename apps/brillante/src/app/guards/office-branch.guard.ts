import { inject } from '@angular/core'
import type { CanActivateFn } from '@angular/router'
import { Router } from '@angular/router'
import { AppTranslation } from '@providers/i18n/app-translation'
import { OfficeBranchStore } from '@store/office-branch/office-branch.store'
import { UIStore } from '@store/ui/ui.store'
import { NotificationType } from '@store/ui/ui.types'

/**
 * Modules that record branch-scoped data (repairs, cash, clients) require a branch to be
 * assigned to this browser. Without one the user is sent to the branch selection screen with
 * an explanation.
 */
export const officeBranchGuard: CanActivateFn = () => {
	const officeBranchStore = inject(OfficeBranchStore)

	if (officeBranchStore.hasCurrentBranch()) {
		return true
	}

	inject(UIStore).showNotification({
		type: NotificationType.ERROR,
		message: inject(AppTranslation).instant('SHELL.OFFICE_BRANCH.NOT_ASSIGNED'),
	})

	return inject(Router).createUrlTree(['/dashboard/settings/office-branches'])
}
