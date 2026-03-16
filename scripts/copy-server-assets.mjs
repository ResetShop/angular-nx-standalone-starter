/**
 * Copies server-side assets to the production build output.
 *
 * These files are needed at runtime by the Node.js server but must not
 * be included in the browser bundle. Each entry maps a source directory
 * to its destination inside the build output.
 *
 * Run via the `copy-server-assets` Nx target (triggered by `postbuild`).
 */

import { cpSync } from 'fs'

// dest paths are relative to workspace root and must match the outputPath in project.json (build target)
const SERVER_ASSETS = [{ src: 'src/api/utils/wordlists', dest: 'dist/app/server/wordlists' }]

for (const { src, dest } of SERVER_ASSETS) {
	try {
		cpSync(src, dest, { recursive: true })
	} catch (error) {
		throw new Error(`Failed to copy server asset "${src}" → "${dest}": ${error.message}`)
	}
}
