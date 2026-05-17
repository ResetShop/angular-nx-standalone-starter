import type { Tree } from '@nx/devkit'
import { generateFiles, joinPathFragments, logger, names } from '@nx/devkit'

interface UiComponentGeneratorSchema {
	name: string
	directory: string
	exportFromIndex: boolean
}

const UI_INDEX_PATH = 'packages/ui/src/index.ts'

export default async function uiComponentGenerator(tree: Tree, schema: UiComponentGeneratorSchema) {
	const n = names(schema.name)
	const targetDir = joinPathFragments(schema.directory, n.fileName)

	generateFiles(tree, joinPathFragments(__dirname, 'files'), targetDir, {
		name: n.fileName,
		className: n.className,
		fileName: n.fileName,
	})

	if (schema.exportFromIndex) {
		appendExportToIndex(tree, n.className, n.fileName)
	}

	logger.info(`[ui-component] Generated component at ${targetDir}`)
	if (schema.exportFromIndex) {
		logger.info(`[ui-component] Appended export to ${UI_INDEX_PATH}`)
	}
}

function appendExportToIndex(tree: Tree, className: string, fileName: string) {
	const exportLine = `export { ${className} } from './lib/${fileName}/${fileName}'`
	const existing = tree.read(UI_INDEX_PATH)?.toString('utf-8') ?? ''
	if (existing.includes(exportLine)) return

	const separator = existing.length === 0 || existing.endsWith('\n') ? '' : '\n'
	tree.write(UI_INDEX_PATH, `${existing}${separator}${exportLine}\n`)
}
