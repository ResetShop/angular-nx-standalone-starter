import type { ProfileChanges, ProfileField } from '@domain/user/user-profile-diff'
import type { TranslationKey } from '@resetshop/angular-core/i18n/translations.schema'
import type { ConfirmChangesEntry } from '@resetshop/ui/confirm-changes-dialog/confirm-changes-dialog'

type Translate = (key: TranslationKey) => string

const FIELD_LABEL_KEYS = {
	firstName: 'ACCOUNT.PROFILE.FIRST_NAME',
	lastName: 'ACCOUNT.PROFILE.LAST_NAME',
} as const satisfies Record<ProfileField, TranslationKey>

/**
 * Turns the raw profile changes into translated before → after rows for `ConfirmChangesDialog`,
 * preserving the display order of the changes record.
 */
export function toAccountChangesEntries(changes: ProfileChanges, translate: Translate): ConfirmChangesEntry[] {
	return (Object.keys(changes) as ProfileField[]).flatMap((field) => {
		const change = changes[field]
		return change ? [{ label: translate(FIELD_LABEL_KEYS[field]), before: change.before, after: change.after }] : []
	})
}
