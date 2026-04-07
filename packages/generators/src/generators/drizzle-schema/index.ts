import { Tree, generateFiles, joinPathFragments, names } from '@nx/devkit'

interface DrizzleSchemaGeneratorSchema {
	name: string
	directory: string
}

export default async function drizzleSchemaGenerator(tree: Tree, schema: DrizzleSchemaGeneratorSchema) {
	const n = names(schema.name)
	const targetDir = schema.directory

	generateFiles(tree, joinPathFragments(__dirname, 'files'), targetDir, {
		name: n.propertyName,
		className: n.className,
		fileName: n.fileName,
	})
}
