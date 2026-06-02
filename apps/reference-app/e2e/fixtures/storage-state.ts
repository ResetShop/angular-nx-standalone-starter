import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const statesDir = join(here, 'states')

/**
 * Absolute paths to the authenticated `storageState` files produced by the `setup` project
 * (`e2e/setup/auth-setup.ts`). Specs reference these via `test.use({ storageState: STORAGE_STATE.x })`.
 * Resolved from this file's location so they are independent of the process working directory.
 */
export const STORAGE_STATE = {
	admin: join(statesDir, 'admin.json'),
} as const
