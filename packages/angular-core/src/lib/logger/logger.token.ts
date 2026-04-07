import { InjectionToken } from '@angular/core'
import { type Logger as LoggerInterface, logger } from '@resetshop/util'

/**
 * Angular DI token for the shared Logger.
 * Resolves to the default `logger` from `@utils/logger` via factory.
 * Can be overridden in tests via `TestBed.overrideProvider`.
 */
export const Logger = new InjectionToken<LoggerInterface>('Logger', {
	providedIn: 'root',
	factory: () => logger,
})
