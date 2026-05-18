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

// The legacy monolithic `@config/env` singleton still exists at this point
// in the PR series and is still imported by ~12 production files. Until that
// module is deleted (in the env.ts-removal commit later in this PR), it needs
// these `process.env` values to satisfy its own validation on first access.
// These writes become redundant — and the no-process-env exemption for this
// file is removed — once `env.ts` is gone.
process.env['PASETO_SECRET_KEY'] = '0123456789abcdef'.repeat(4)
process.env['PASETO_ISSUER'] = 'test-issuer'
process.env['EMAIL_PROVIDER'] = 'ethereal'
process.env['PG_CONNECTION_STRING'] ??= 'postgresql://test:test@localhost:5432/test'

// Extend Vitest's expect with Testing Library matchers
expect.extend(matchers)

// Setup TestBed with zoneless configuration
setupTestBed({
	zoneless: true,
	// @ts-expect-error errorOnUnknownElements exists at runtime but is missing from @analogjs/vitest-angular type defs
	errorOnUnknownElements: true,
	errorOnUnknownProperties: true,
})
