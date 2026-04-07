import type { Tree } from '@nx/devkit'

interface AppGeneratorSchema {
	name: string
	directory?: string
}

/**
 * Stub for the `app` generator. The full implementation lands in Epic 2 PR 2.1
 * (issue #290), where it becomes a schematic that clones `apps/reference-app`
 * into `apps/<slug>` for fork app creation.
 *
 * At Epic 1 time this is a stub so that `generators.json` can register the
 * generator name without breaking other generators' tooling. Attempting to run
 * it will throw.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- stub; parameters are part of the contract Epic 2 PR 2.1 will implement
export default async function appGenerator(_tree: Tree, _schema: AppGeneratorSchema): Promise<void> {
	throw new Error(
		'The @resetshop/generators:app generator is not implemented yet. Full implementation arrives in Epic 2 PR 2.1 (#290).',
	)
}
