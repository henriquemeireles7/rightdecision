#!/usr/bin/env bun

/**
 * check-existing-rules.ts — Search harness layers for existing prevention rules.
 *
 * Usage: bun .claude/skills/d-harness/scripts/check-existing-rules.ts "<keyword>"
 *
 * Searches: CLAUDE.md files, hooks, configs, universal files, harden-check patterns
 */

import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const keyword = process.argv[2] || ''

if (!keyword) {
	console.error('Usage: bun check-existing-rules.ts "<error keyword>"')
	process.exit(1)
}

const cwd = resolve(import.meta.dir, '../../..')

interface Match {
	layer: string
	file: string
	line: number
	content: string
}

const matches: Match[] = []

// Search using ripgrep
function search(pattern: string, globs: string[], layer: string) {
	const result = spawnSync('rg', ['-n', '-i', '--glob', ...globs.flatMap(g => ['--glob', g]), pattern, '.'], {
		cwd,
		stdio: ['ignore', 'pipe', 'pipe'],
	})
	const output = result.stdout?.toString().trim() || ''
	if (!output) return

	for (const line of output.split('\n')) {
		const match = line.match(/^\.\/(.+?):(\d+):(.+)$/)
		if (match) {
			matches.push({
				layer,
				file: match[1],
				line: Number.parseInt(match[2]),
				content: match[3].trim().slice(0, 120),
			})
		}
	}
}

// Search each layer
search(keyword, ['**/CLAUDE.md'], 'claude-md')
search(keyword, ['.claude/hooks/*.ts'], 'hook')
search(keyword, ['biome.json', 'tsconfig.json', 'railway.toml', 'Dockerfile'], 'config')
search(keyword, ['decisions/*.md'], 'universal-file')
search(keyword, ['platform/scripts/harden-check.ts'], 'script')

if (matches.length === 0) {
	console.log(JSON.stringify({
		status: 'no_existing_rule',
		keyword,
		message: `No existing rules found for "${keyword}". A new rule should be created.`,
	}, null, 2))
} else {
	console.log(JSON.stringify({
		status: 'rules_found',
		keyword,
		count: matches.length,
		matches: matches.slice(0, 20),
		message: matches.length === 1
			? 'One existing rule found. Check if it covers this case or needs extension.'
			: `${matches.length} existing rules found. Check if they cover this case or need updates.`,
	}, null, 2))
}
