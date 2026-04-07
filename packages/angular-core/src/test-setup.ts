import '@analogjs/vitest-angular/setup-snapshots'
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed'
import '@angular/compiler'
import * as matchers from '@testing-library/jest-dom/matchers'
import { expect } from 'vitest'

expect.extend(matchers)

setupTestBed({
	zoneless: true,
	// @ts-expect-error errorOnUnknownElements exists at runtime but is missing from @analogjs/vitest-angular type defs
	errorOnUnknownElements: true,
	errorOnUnknownProperties: true,
})
