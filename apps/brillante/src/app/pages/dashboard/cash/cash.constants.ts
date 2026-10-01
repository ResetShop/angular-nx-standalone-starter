import type { DurationString } from '@contracts/common/duration.schemas'

/**
 * Delay between a successful save and the drawer closing, long enough for the confirmation to
 * register before the closing animation starts. Resolved at the setTimeout call site.
 */
export const DRAWER_CLOSE_AFTER_SUCCESS_DELAY: DurationString = '1s'
