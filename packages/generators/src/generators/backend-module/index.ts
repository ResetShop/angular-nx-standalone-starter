import { Tree, generateFiles, joinPathFragments, names } from '@nx/devkit'

interface BackendModuleGeneratorSchema {
	name: string
	module: string
	directory: string
}

export default async function backendModuleGenerator(tree: Tree, schema: BackendModuleGeneratorSchema) {
	const n = names(schema.name)
	const targetDir = schema.module
		? joinPathFragments(schema.directory, schema.module, n.fileName)
		: joinPathFragments(schema.directory, n.fileName)

	const templateVars = {
		name: n.fileName,
		className: n.className,
		propertyName: n.propertyName,
		fileName: n.fileName,
	}

	generateFiles(tree, joinPathFragments(__dirname, 'files'), targetDir, templateVars)
}
