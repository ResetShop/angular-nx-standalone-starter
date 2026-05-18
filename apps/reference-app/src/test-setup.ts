import '@analogjs/vitest-angular/setup-snapshots'
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed'
import '@angular/compiler'
import { seedAuthEnv } from '@config/auth.env'
import { seedDbEnv } from '@config/db.env'
import { seedEmailEnv } from '@config/email.env'
import * as matchers from '@testing-library/jest-dom/matchers'
import { expect } from 'vitest'

// Seed the env sub-schema caches with test-safe defaults so any module that
// transitively imports a `*.env` sub-module can be loaded by a unit test
// without triggering FATAL validation against the real `process.env`.
// Each seedXEnv() call uses the test defaults baked into the sub-schema module;
// individual specs can call resetXEnv() + seedXEnv({...overrides}) to vary values.
seedDbEnv()
seedAuthEnv()
seedEmailEnv()

// Extend Vitest's expect with Testing Library matchers
expect.extend(matchers)

// Setup TestBed with zoneless configuration
setupTestBed({
	zoneless: true,
	// @ts-expect-error errorOnUnknownElements exists at runtime but is missing from @analogjs/vitest-angular type defs
	errorOnUnknownElements: true,
	errorOnUnknownProperties: true,
})
