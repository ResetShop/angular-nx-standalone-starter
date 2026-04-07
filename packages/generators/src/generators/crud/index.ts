import { Tree, joinPathFragments, names } from '@nx/devkit'
import apiProviderGenerator from '../api-provider/index'
import backendModuleGenerator from '../backend-module/index'
import drizzleSchemaGenerator from '../drizzle-schema/index'
import pageGenerator from '../page/index'
import storeGenerator from '../store/index'

interface CrudGeneratorSchema {
	name: string
	module: string
	appRoot: string
}

export default async function crudGenerator(tree: Tree, schema: CrudGeneratorSchema) {
	const n = names(schema.name)
	const appRoot = schema.appRoot || 'apps/reference-app'

	console.log(`[crud] Orchestrating full CRUD slice for "${n.className}" in ${appRoot}...`)

	await drizzleSchemaGenerator(tree, {
		name: schema.name,
		directory: 'libs/backend/src/lib/db/schema',
	})

	await backendModuleGenerator(tree, {
		name: schema.name,
		module: schema.module,
		directory: 'libs/backend/src/lib/modules',
	})

	await apiProviderGenerator(tree, {
		name: schema.name,
		directory: joinPathFragments(appRoot, 'src/app/providers'),
	})

	await storeGenerator(tree, {
		name: schema.name,
		directory: joinPathFragments(appRoot, 'src/app/store'),
	})

	await pageGenerator(tree, {
		name: schema.name,
		withStore: false,
		withApiProvider: false,
		directory: joinPathFragments(appRoot, 'src/app/pages/dashboard'),
	})

	console.log(`[crud] Done. Remember to:`)
	console.log(`  1. Add the route to ${appRoot}/src/app/pages/dashboard/dashboard.routes.ts`)
	console.log(`  2. Add navigation entry to the NavigationConfig`)
	console.log(`  3. Register the Drizzle schema in the connector`)
}
