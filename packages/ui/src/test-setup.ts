import '@analogjs/vitest-angular/setup-snapshots'
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed'
import '@angular/compiler'
import * as matchers from '@testing-library/jest-dom/matchers'
import { expect } from 'vitest'

expect.extend(matchers)

// Polyfill `Element.getAnimations()` — happy-dom omits the Web Animations API. `ng-primitives`
// calls it when tearing down overlay portals (menus, dialogs) to wait for exit animations to
// finish; without the polyfill the cleanup throws `TypeError: element.getAnimations is not a
// function` and vitest reports an unhandled error even though every test assertion passes.
if (typeof Element !== 'undefined' && typeof Element.prototype.getAnimations !== 'function') {
	Element.prototype.getAnimations = () => []
}

setupTestBed({
	zoneless: true,
	// @ts-expect-error errorOnUnknownElements exists at runtime but is missing from @analogjs/vitest-angular type defs
	errorOnUnknownElements: true,
	errorOnUnknownProperties: true,
})
