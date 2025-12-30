import '@analogjs/vitest-angular/setup-snapshots';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';
import '@angular/compiler';
import * as matchers from '@testing-library/jest-dom/matchers';
import { expect } from 'vitest';

// Extend Vitest's expect with Testing Library matchers
expect.extend(matchers);

// Setup TestBed with zoneless configuration
setupTestBed({
	zoneless: true,
	errorOnUnknownElements: true,
	errorOnUnknownProperties: true,
});
