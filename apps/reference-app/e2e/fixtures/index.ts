// Single indirection so future fixtures (page-object fixtures, test-data fixtures) can be layered in
// here without touching every spec's import. Specs import `{ test, expect }` from this module.
export { expect, test } from '@playwright/test'
