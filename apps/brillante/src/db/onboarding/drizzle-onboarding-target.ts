import { and, eq, isNull } from 'drizzle-orm'
import type { DrizzleTransaction } from '../../api/helpers/drizzle-postgres-connector'
import { generateResetToken, hashResetToken } from '../../api/modules/auth/reset-token'
import { authentication } from '../schema/authentication'
import { passwordResetToken } from '../schema/password-reset-token'
import { user } from '../schema/user'
import type { OnboardingTarget } from './onboarding'
import type { OnboardingCandidate } from './onboarding-recipients'

/** The database a transaction or client can run queries on; the CLI passes its connector, tests pass a transaction. */
type Executor = Pick<DrizzleTransaction, 'select' | 'insert' | 'delete' | 'transaction'>

/** `OnboardingTarget` over Drizzle: reads the users and replaces their outstanding reset tokens. */
export class DrizzleOnboardingTarget implements OnboardingTarget {
	constructor(private readonly db: Executor) {}

	public async readCandidates(): Promise<readonly OnboardingCandidate[]> {
		return this.db
			.select({
				userId: user.id,
				firstName: user.firstName,
				email: user.email,
				status: user.status,
				mustChangePassword: authentication.mustChangePassword,
			})
			.from(user)
			.innerJoin(authentication, eq(authentication.userId, user.id))
			.orderBy(user.id)
	}

	/**
	 * In one transaction: deletes the user's unused tokens (only the latest link may work, as in the self-service flow) and stores the hash
	 * of a new one. The raw token is returned to the caller and is never stored.
	 */
	public async issueResetToken(userId: number, expiresAt: Date): Promise<string> {
		const rawToken = generateResetToken()
		await this.db.transaction(async (tx) => {
			await tx
				.delete(passwordResetToken)
				.where(and(eq(passwordResetToken.userId, userId), isNull(passwordResetToken.usedAt)))
			await tx.insert(passwordResetToken).values({ userId, tokenHash: hashResetToken(rawToken), expiresAt })
		})
		return rawToken
	}
}
