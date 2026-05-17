import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const SKILLS = [
	{
		name: 'angular',
		repo: 'https://github.com/angular/skills.git',
		path: join(process.cwd(), '.claude', 'skills', 'angular'),
	},
]

for (const skill of SKILLS) {
	if (existsSync(skill.path)) {
		continue
	}

	console.log(`Installing Claude Code skill: ${skill.name}...`)
	try {
		execSync(`git clone --depth 1 ${skill.repo} "${skill.path}"`, { stdio: 'inherit' })
		console.log(`Installed: ${skill.name}`)
	} catch {
		console.warn(`Failed to install skill "${skill.name}" — skipping (requires git and network access)`)
	}
}
