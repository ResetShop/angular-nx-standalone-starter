import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const SKILLS = [
	{
		name: 'angular',
		description: 'Official Angular developer skill (Google) — architectural guidance and code generation',
		type: 'clone',
		repo: 'https://github.com/angular/skills.git',
		path: join(process.cwd(), '.claude', 'skills', 'angular'),
		defaultSelected: true,
	},
]

const pending = SKILLS.filter((skill) => {
	if (skill.type === 'command') return !skill.check()
	return !existsSync(skill.path)
})

if (pending.length === 0) {
	console.log('\n  All Claude Code skills are already installed.\n')
	process.exit(0)
}

const isInteractive = !process.env.CI && process.stdin.isTTY

async function multiSelect(items) {
	const selected = items.map((item) => item.defaultSelected ?? true)
	let cursor = 0
	const cols = process.stdout.columns || 80

	process.stdin.setRawMode(true)
	process.stdin.resume()
	process.stdin.setEncoding('utf8')

	function truncate(str, max) {
		let visible = 0
		let out = ''
		for (let i = 0; i < str.length; i++) {
			if (str[i] === '\x1B') {
				const end = str.indexOf('m', i)
				if (end !== -1) {
					out += str.slice(i, end + 1)
					i = end
					continue
				}
			}
			if (visible >= max) break
			out += str[i]
			visible++
		}
		return out
	}

	function render() {
		process.stdout.write('\x1B[?25l\x1B[H\x1B[J')

		process.stdout.write('\n\x1B[1m┌─────────────────────────────────────────────┐\x1B[0m\n')
		process.stdout.write('\x1B[1m│  Claude Code Skills Setup                   │\x1B[0m\n')
		process.stdout.write('\x1B[1m└─────────────────────────────────────────────┘\x1B[0m\n')
		process.stdout.write('\nSelect which Claude Code skills to install:\n\n')

		for (let i = 0; i < items.length; i++) {
			const icon = selected[i] ? '\x1B[36m◉\x1B[0m' : '○'
			const pointer = i === cursor ? '\x1B[36m❯\x1B[0m' : ' '
			const label = i === cursor ? `\x1B[1m${items[i].name}\x1B[0m` : items[i].name
			const desc = `\x1B[2m${items[i].description}\x1B[0m`
			const line = `${pointer} ${icon} ${label} — ${desc}`
			process.stdout.write(truncate(line, cols - 1) + '\n')
		}
		process.stdout.write('\n')
		process.stdout.write(`\x1B[2m  ↑/↓ navigate · space toggle · enter confirm\x1B[0m`)
	}

	render()

	return new Promise((resolve) => {
		function onKey(key) {
			if (key === '\x1B[A' && cursor > 0) {
				cursor--
				render()
			} else if (key === '\x1B[B' && cursor < items.length - 1) {
				cursor++
				render()
			} else if (key === ' ') {
				selected[cursor] = !selected[cursor]
				render()
			} else if (key === '\r' || key === '\n') {
				process.stdin.setRawMode(false)
				process.stdin.pause()
				process.stdin.removeListener('data', onKey)
				process.stdout.write('\x1B[?25h\n\n')
				resolve(items.filter((_, i) => selected[i]))
			} else if (key === '\x03') {
				process.stdout.write('\x1B[?25h\n')
				process.exit(130)
			}
		}
		process.stdin.on('data', onKey)
	})
}

let toInstall = pending

if (isInteractive) {
	toInstall = await multiSelect(pending)
} else {
	console.log('\n\x1B[1m┌─────────────────────────────────────────────┐\x1B[0m')
	console.log('\x1B[1m│  Claude Code Skills Setup                   │\x1B[0m')
	console.log('\x1B[1m└─────────────────────────────────────────────┘\x1B[0m')
	console.log('\nSelect which Claude Code skills to install:\n')
	for (const skill of pending) {
		console.log(`  ◉ ${skill.name} — ${skill.description}`)
	}
	console.log('')
}

for (const skill of toInstall) {
	process.stdout.write(`  Installing ${skill.name}...`)
	try {
		if (skill.type === 'clone') {
			execSync(`git clone --depth 1 ${skill.repo} "${skill.path}"`, { stdio: 'pipe' })
		} else if (skill.type === 'command') {
			execSync(skill.command, { stdio: 'pipe' })
		}
		console.log(' \x1B[32m✓\x1B[0m')
	} catch {
		console.log(' \x1B[31m✗\x1B[0m (requires git and network access)')
	}
}

const skipped = pending.filter((s) => !toInstall.includes(s))
for (const skill of skipped) {
	console.log(`  \x1B[2mSkipped: ${skill.name}\x1B[0m`)
}

console.log('')
