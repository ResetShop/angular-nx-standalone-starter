import type { Provider } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import type { OfficeBranchDto } from '@contracts/office-branch/office-branch.types'
import { Permission, UserRole } from '@contracts/permission/permission.constants'
import type { IUser } from '@domain/user/user.interface'
import { createMockUser } from '@mocks/user.mock'
import { AuthApi } from '@providers/auth/auth.interface'
import { InMemoryAuthApi } from '@providers/auth/auth.mock'
import { CashConceptApi } from '@providers/cash-concept/cash-concept.interface'
import { mockTranslation, type TranslationStub } from '@providers/i18n/translation.mock'
import { cashEn } from '@providers/i18n/translations/slices/cash.translations'
import { IdentityApi } from '@providers/identity/identity.interface'
import { InMemoryIdentityApi } from '@providers/identity/identity.mock'
import { OfficeBranchApi } from '@providers/office-branch/office-branch.interface'
import { InMemoryOfficeBranchApi } from '@providers/office-branch/office-branch.mock'
import { PaymentMethodApi } from '@providers/payment-method/payment-method.interface'
import { Translation } from '@resetshop/angular-core/i18n/translation'
import { AuthStore } from '@store/auth/auth.store'
import { OfficeBranchStore } from '@store/office-branch/office-branch.store'
import { CashApi } from './cash.interface'

function flatten(tree: object, prefix = ''): Record<string, string> {
	return Object.entries(tree).reduce<Record<string, string>>((flat, [key, value]) => {
		const path = prefix ? `${prefix}.${key}` : key
		return typeof value === 'string' ? { ...flat, [path]: value } : { ...flat, ...flatten(value as object, path) }
	}, {})
}

const cashEnglish = flatten(cashEn)

/**
 * Translation stub for cash specs: resolves the cash keys with their English copy, every other key
 * through the shared mock translations.
 */
export const cashTranslation: TranslationStub = {
	instant: (key: string, fallback?: string) => cashEnglish[key] ?? mockTranslation.instant(key, fallback),
}

export const mockBranch: OfficeBranchDto = { id: 2, name: 'Centro', address: 'San Martín 100' }

export interface CashTestApis {
	cashApi: object
	conceptApi: object
	paymentMethodApi: object
}

/**
 * Providers every cash spec needs: the three API tokens, the session plumbing behind `AuthStore`
 * and the translation stub.
 */
export function provideCashTestEnvironment(apis: CashTestApis): Provider[] {
	return [
		{ provide: CashApi, useValue: apis.cashApi },
		{ provide: CashConceptApi, useValue: apis.conceptApi },
		{ provide: PaymentMethodApi, useValue: apis.paymentMethodApi },
		{ provide: AuthApi, useValue: new InMemoryAuthApi() },
		{ provide: IdentityApi, useValue: new InMemoryIdentityApi() },
		{ provide: OfficeBranchApi, useValue: new InMemoryOfficeBranchApi() },
		{ provide: Translation, useValue: cashTranslation },
	]
}

/**
 * Signs a user in and assigns the branch, as the dashboard does before the cash pages are reached.
 * Users default to one that holds every permission.
 */
export function signInAndAssignBranch(user: Partial<IUser> = {}, branch: OfficeBranchDto | null = mockBranch): IUser {
	const currentUser = createMockUser({ hasPermission: () => true, ...user })
	TestBed.inject(AuthStore).updateCurrentUser(currentUser)
	if (branch) TestBed.inject(OfficeBranchStore).assign(branch)
	return currentUser
}

/**
 * A user that may read the cash register but not change it.
 */
export function readOnlyCashUser(): Partial<IUser> {
	return { hasPermission: (identifier: string) => identifier === Permission.CASH_READ }
}

/**
 * Persists a session and a branch assignment the way the running app does, so a component created
 * afterwards finds them already in `AuthStore` and `OfficeBranchStore` (no second load when the
 * branch shows up late). Roles default to a counter clerk, who may read and manage the register.
 */
export function seedSession(
	roles: { id: number; description: string }[] = [{ id: UserRole.COUNTER_CLERK, description: 'Counter clerk' }],
	branch: OfficeBranchDto | null = mockBranch,
): void {
	localStorage.clear()
	localStorage.setItem(
		'currentUser',
		JSON.stringify({
			id: 5,
			userName: 'clerk',
			firstName: 'Ana',
			lastName: 'Gómez',
			email: 'ana@brillante.test',
			avatar: null,
			roles,
			hasFinishedRegistration: true,
			token: 'test-token',
		}),
	)
	if (branch) localStorage.setItem('officeBranch.current', JSON.stringify(branch))
}
