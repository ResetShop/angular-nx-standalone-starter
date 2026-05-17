import '@analogjs/vitest-angular/setup-snapshots'
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed'
import '@angular/compiler'
import * as matchers from '@testing-library/jest-dom/matchers'
import { expect } from 'vitest'

// Setup environment variables required by API tests.
// These satisfy the env contract's required fields so that any module which
// transitively imports `@config/env` can be loaded by a unit test.
// Test-only values — not used in production.
process.env['PASETO_SECRET_KEY'] = '0123456789abcdef'.repeat(4) // 32 bytes = 64 hex chars
process.env['PASETO_ISSUER'] = 'test-issuer'
process.env['EMAIL_PROVIDER'] = 'ethereal'
// Placeholder — unit tests never actually connect; integration tests overwrite
// this with the real test database connection string before any module import.
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
