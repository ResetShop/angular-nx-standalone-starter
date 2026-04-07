import { Tree, generateFiles, joinPathFragments, names } from '@nx/devkit'

interface StoreGeneratorSchema {
	name: string
	directory: string
	project?: string
}

export default async function storeGenerator(tree: Tree, schema: StoreGeneratorSchema) {
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
