import { TestBed } from '@angular/core/testing'
import type { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router'
import { provideRouter, UrlTree } from '@angular/router'
import { OfficeBranchApi } from '@providers/office-branch/office-branch.interface'
import { InMemoryOfficeBranchApi } from '@providers/office-branch/office-branch.mock'
import { clearAllMocks } from '@resetshop/util/test-utils'
import { OfficeBranchStore } from '@store/office-branch/office-branch.store'
import { UIStore } from '@store/ui/ui.store'
import { officeBranchGuard } from './office-branch.guard'

describe('officeBranchGuard', () => {
	beforeEach(() => {
		clearAllMocks()
		localStorage.clear()

		TestBed.configureTestingModule({
			providers: [provideRouter([]), { provide: OfficeBranchApi, useValue: new InMemoryOfficeBranchApi() }],
		})
	})

	function runGuard(): boolean | UrlTree {
		return TestBed.runInInjectionContext(() =>
			officeBranchGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
		) as boolean | UrlTree
	}

	it('lets the navigation through when a branch is assigned', () => {
		TestBed.inject(OfficeBranchStore).assign({ id: 1, name: 'Centro', address: 'San Martín 100' })

		expect(runGuard()).toBe(true)
	})

	it('redirects to the branch selection page when no branch is assigned', () => {
		const result = runGuard()

		expect(result).toBeInstanceOf(UrlTree)
		expect((result as UrlTree).toString()).toBe('/dashboard/settings/office-branches')
	})

	it('explains the redirect with an error notification', () => {
		runGuard()

		const notifications = TestBed.inject(UIStore).notifications()
		expect(notifications).toHaveLength(1)
		expect(notifications[0].type).toBe('error')
	})
})
