import '@analogjs/vitest-angular/setup-snapshots'
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed'
import '@angular/compiler'
import { seedAppEnv } from '@config/app.env'
import { seedAuthEnv } from '@config/auth.env'
import { seedCronEnv } from '@config/cron.env'
import { seedDbEnv } from '@config/db.env'
import { seedEmailEnv } from '@config/email.env'
import { seedHttpEnv } from '@config/http.env'
import * as matchers from '@testing-library/jest-dom/matchers'
import { expect } from 'vitest'

// Seed all six env sub-schema caches with their test-safe defaults so any
// module that transitively imports a `*.env` sub-module can be loaded by a unit
// test without triggering FATAL validation against the real `process.env`.
// Each seedXEnv() call uses the defaults baked into the sub-schema module;
// individual specs can call resetXEnv() + seedXEnv({...overrides}) to vary values.
// All six are seeded (even those with empty defaults) to guarantee zero
// latent-validation risk when a future spec transitively imports a sub-schema
// not previously touched by the test suite.
seedDbEnv()
seedAuthEnv()
seedEmailEnv()
seedHttpEnv()
seedAppEnv()
seedCronEnv()

// Extend Vitest's expect with Testing Library matchers
expect.extend(matchers)

// Setup TestBed with zoneless configuration
setupTestBed({
	zoneless: true,
	// @ts-expect-error errorOnUnknownElements exists at runtime but is missing from @analogjs/vitest-angular type defs
	errorOnUnknownElements: true,
	errorOnUnknownProperties: true,
})
