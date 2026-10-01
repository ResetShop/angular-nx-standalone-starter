import type { DurationString } from '@contracts/common/duration.schemas'

/**
 * Delay between a successful mutation and the settings drawer closing, long enough for the
 * success toast to register before the drawer animation starts. Resolved at the setTimeout call
 * site via `parseDurationToMs(DRAWER_CLOSE_AFTER_SUCCESS_DELAY)`.
 */
export const DRAWER_CLOSE_AFTER_SUCCESS_DELAY: DurationString = '1s'
