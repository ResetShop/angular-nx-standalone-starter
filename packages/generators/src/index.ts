// @resetshop/generators — Nx generators for the angular-nx-standalone-starter monorepo.
//
// Generators are loaded by Nx at runtime via `generators.json` (referenced by
// the package's `generators` field in `package.json`); the `build` target on
// this project produces a nominal compiled output that is not consumed by
// runtime callers. This re-export exists so the build target has a meaningful
// `main` entry and so external scripts can import the generator factories
// directly if they need to.
//
// Note: under Epic 1 the `app` generator is a stub. Its full implementation
// (plus the `slugifyAppName` helper) lands in Epic 2 PR 2.1 (#290), which will
// expand this barrel accordingly.

export { default as appGenerator } from './generators/app/index'
