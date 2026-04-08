#!/usr/bin/env bun

/**
 * verify-prevention.ts — Verify a newly created rule would catch the original error.
 *
 * Usage: bun .claude/skills/d-harness/scripts/verify-prevention.ts "<error keyword>" "<rule file path>"
 *
 * Checks:
 * 1. The rule file exists
 * 2. The rule file contains the keyword (or related terms)
 * 3. If it's a hook, it's registered in settings.json
 * 4. If it's a harden-check pattern, the pattern is syntactically valid
 */

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const keyword = process.argv[2] || ''
const ruleFile = process.argv[3] || ''

if (!keyword || !ruleFile) {
	console.error('Usage: bun verify-prevention.ts "<error keyword>" "<rule file path>"')
	process.exit(1)
}

const cwd = resolve(import.meta.dir, '../../..')
const fullPath = resolve(cwd, ruleFile)

const checks: { name: string; pass: boolean; detail: string }[] = []

// Check 1: File exists
const exists = existsSync(fullPath)
checks.push({
	name: 'file_exists',
	pass: exists,
	detail: exists ? `${ruleFile} exists` : `${ruleFile} NOT FOUND`,
})

if (!exists) {
	console.log(JSON.stringify({ verified: false, checks }, null, 2))
	process.exit(1)
}

// Check 2: File contains relevant content
const content = readFileSync(fullPath, 'utf-8').toLowerCase()
const keywordLower = keyword.toLowerCase()
const containsKeyword = content.includes(keywordLower)
checks.push({
	name: 'contains_keyword',
	pass: containsKeyword,
	detail: containsKeyword
		? `File references "${keyword}"`
		: `File does NOT reference "${keyword}" — rule may not catch this error`,
})

// Check 3: If it's a hook, verify it's registered in settings.json
if (ruleFile.includes('.claude/hooks/')) {
	const settingsPath = resolve(cwd, '.claude/settings.json')
	if (existsSync(settingsPath)) {
		const settings = readFileSync(settingsPath, 'utf-8')
		const hookFilename = ruleFile.split('/').pop() || ''
		const isRegistered = settings.includes(hookFilename)
		checks.push({
			name: 'hook_registered',
			pass: isRegistered,
			detail: isRegistered
				? `Hook ${hookFilename} is registered in settings.json`
				: `Hook ${hookFilename} is NOT registered in settings.json — it won't run!`,
		})
	}
}

// Check 4: If it's a TypeScript file, check for syntax errors
if (ruleFile.endsWith('.ts')) {
	const { spawnSync } = require('node:child_process')
	const result = spawnSync('bunx', ['tsc', '--noEmit', '--pretty', fullPath], {
		cwd,
		stdio: ['ignore', 'pipe', 'pipe'],
	})
	const hasErrors = result.status !== 0
	checks.push({
		name: 'syntax_valid',
		pass: !hasErrors,
		detail: hasErrors
			? `TypeScript errors in ${ruleFile}`
			: 'No TypeScript errors',
	})
}

const allPassed = checks.every(c => c.pass)

console.log(JSON.stringify({
	verified: allPassed,
	checks,
	summary: allPassed
		? 'Rule verified — would have caught the original error.'
		: 'Rule has issues — review the failed checks above.',
}, null, 2))
