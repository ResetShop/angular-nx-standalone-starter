import '@analogjs/vitest-angular/setup-snapshots';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';
import '@angular/compiler';
import * as matchers from '@testing-library/jest-dom/matchers';
import { expect } from 'vitest';

// Setup environment variables required by API tests
// This is a test-only key - not used in production
process.env['PASETO_SECRET_KEY'] = '0123456789abcdef'.repeat(4); // 32 bytes = 64 hex chars
process.env['EMAIL_PROVIDER'] = 'ethereal';

// Extend Vitest's expect with Testing Library matchers
expect.extend(matchers);

// Setup TestBed with zoneless configuration
setupTestBed({
	zoneless: true,
	// @ts-expect-error errorOnUnknownElements exists at runtime but is missing from @analogjs/vitest-angular type defs
	errorOnUnknownElements: true,
	errorOnUnknownProperties: true,
});
