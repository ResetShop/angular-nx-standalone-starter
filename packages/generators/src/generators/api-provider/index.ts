import { Tree, generateFiles, joinPathFragments, names } from '@nx/devkit'

interface ApiProviderGeneratorSchema {
	name: string
	directory: string
}

export default async function apiProviderGenerator(tree: Tree, schema: ApiProviderGeneratorSchema) {
	const n = names(schema.name)
	const targetDir = joinPathFragments(schema.directory, n.fileName)

	const templateVars = {
		name: n.fileName,
		className: n.className,
		propertyName: n.propertyName,
		fileName: n.fileName,
	}

	generateFiles(tree, joinPathFragments(__dirname, 'files'), targetDir, templateVars)
}
