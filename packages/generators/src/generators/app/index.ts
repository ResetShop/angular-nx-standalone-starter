import type { Tree } from '@nx/devkit'
import { formatFiles, joinPathFragments, visitNotIgnoredFiles } from '@nx/devkit'

interface AppGeneratorSchema {
	name: string
	directory?: string
}

// SOURCE_APP is module-level because it is used by `validateNames`,
// `copyTreeWithRewrites`, and `appGenerator` itself.
const SOURCE_APP = 'reference-app'

/**
 * Slugifies a human-readable display name into a kebab-case identifier.
 *
 * Examples:
 *   "Shine"        → "shine"
 *   "My Cool App"  → "my-cool-app"
 *   "  Foo--Bar  " → "foo-bar"
 */
export function slugifyAppName(displayName: string): string {
	return displayName
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
}

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
}

function validateNames(displayName: string, slug: string): void {
	// Slug values that would collide with bundler/tooling resolution and are
	// therefore rejected even though they are valid kebab-case identifiers.
	// If you change this list, also update `docs/forking.md` §4 where it is
	// documented for fork users.
	const RESERVED_SLUGS = new Set(['app', 'apps', 'dist', 'node', 'node_modules', 'packages', 'src', 'tmp'])
	if (!displayName) {
		throw new Error('--name is required (the human-readable display name of the new app)')
	}
	if (!slug) {
		throw new Error(
			`Cannot derive a slug from "${displayName}". Provide a name with at least one alphanumeric character.`,
		)
	}
	if (slug === SOURCE_APP) {
		throw new Error(`Cannot use "${SOURCE_APP}" as the new app name — it is the canonical template.`)
	}
	if (RESERVED_SLUGS.has(slug)) {
		throw new Error(
			`"${slug}" is a reserved slug and cannot be used as an app name. Reserved slugs collide with tooling or bundler resolution.`,
		)
	}
}

function isTextFile(path: string): boolean {
	const TEXT_FILE_EXTENSIONS = new Set([
		'.cjs',
		'.css',
		'.html',
		'.js',
		'.json',
		'.md',
		'.mjs',
		'.scss',
		'.ts',
		'.tsx',
		'.txt',
		'.yaml',
		'.yml',
	])
	const dot = path.lastIndexOf('.')
	if (dot < 0) return false
	return TEXT_FILE_EXTENSIONS.has(path.slice(dot).toLowerCase())
}

/**
 * Walks the source app and writes every file (text or binary) into the target
 * directory. Text files have every literal occurrence of `reference-app`
 * replaced with the slug — this is intentional and global, applying inside
 * comments and string literals as well as identifiers, because all such
 * occurrences in the canonical template are project-name references.
 */
function copyTreeWithRewrites(tree: Tree, sourceRoot: string, targetRoot: string, slug: string): void {
	// Files inside `apps/reference-app` that are starter-owned (relevant only
	// to upstream contributors) and must NOT be propagated to generated fork
	// apps. Paths are relative to the source app root.
	const EXCLUDED_FROM_COPY = new Set(['IMPORT_MIGRATION.md'])
	visitNotIgnoredFiles(tree, sourceRoot, (filePath) => {
		const relative = filePath.substring(sourceRoot.length + 1)
		if (EXCLUDED_FROM_COPY.has(relative)) return
		const content = tree.read(filePath)
		if (!content) return
		const targetPath = joinPathFragments(targetRoot, relative)
		if (isTextFile(filePath)) {
			tree.write(targetPath, content.toString('utf-8').split(SOURCE_APP).join(slug))
		} else {
			tree.write(targetPath, content)
		}
	})
}

/**
 * Replaces the `scope:starter` tag with `scope:app` in the generated
 * project.json. Tags are structured data, so this rewrite is targeted rather
 * than relying on the global string-substitution pass (which only matches the
 * literal `reference-app`, not `scope:starter`).
 */
function rewriteProjectTags(tree: Tree, targetRoot: string): void {
	const SOURCE_SCOPE_TAG = 'scope:starter'
	const TARGET_SCOPE_TAG = 'scope:app'
	const projectJsonPath = joinPathFragments(targetRoot, 'project.json')
	if (!tree.exists(projectJsonPath)) return
	const raw = tree.read(projectJsonPath)?.toString('utf-8') ?? ''
	const parsed = JSON.parse(raw) as { tags?: string[] }
	if (!Array.isArray(parsed.tags)) return
	parsed.tags = parsed.tags.map((tag) => (tag === SOURCE_SCOPE_TAG ? TARGET_SCOPE_TAG : tag))
	tree.write(projectJsonPath, JSON.stringify(parsed, null, 2))
}

function rewriteIndexHtmlTitle(tree: Tree, targetRoot: string, displayName: string): void {
	const indexHtmlPath = joinPathFragments(targetRoot, 'src/index.html')
	if (!tree.exists(indexHtmlPath)) return
	const html = tree.read(indexHtmlPath)?.toString('utf-8') ?? ''
	tree.write(indexHtmlPath, html.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(displayName)}</title>`))
}

/**
 * Generates a new application by cloning `apps/reference-app` into `apps/<slug>`.
 *
 * The developer provides a human-readable display name (e.g. "Shine"). The generator
 * derives a kebab-case slug from it and uses that slug for every code-level reference
 * (project name, paths, build targets, output directories). The display name itself
 * is used for the `<title>` tag in `index.html`.
 *
 * `reference-app` remains untouched — it is the canonical template and the only
 * source from which the schematic clones. Forks must never modify it directly;
 * always create new apps via this generator.
 */
export default async function appGenerator(tree: Tree, schema: AppGeneratorSchema): Promise<void> {
	const DEFAULT_APPS_DIR = 'apps'
	const displayName = (schema.name ?? '').trim()
	const slug = slugifyAppName(displayName)
	validateNames(displayName, slug)

	const directory = schema.directory ?? DEFAULT_APPS_DIR
	const sourceRoot = joinPathFragments(directory, SOURCE_APP)
	const targetRoot = joinPathFragments(directory, slug)

	if (!tree.exists(sourceRoot)) {
		throw new Error(
			`Source app "${sourceRoot}" does not exist. The "${SOURCE_APP}" template is required to generate a new app.`,
		)
	}
	if (tree.exists(targetRoot)) {
		throw new Error(`Target directory "${targetRoot}" already exists. Choose a different name or remove it first.`)
	}

	copyTreeWithRewrites(tree, sourceRoot, targetRoot, slug)
	rewriteProjectTags(tree, targetRoot)
	rewriteIndexHtmlTitle(tree, targetRoot, displayName)

	await formatFiles(tree)
}
