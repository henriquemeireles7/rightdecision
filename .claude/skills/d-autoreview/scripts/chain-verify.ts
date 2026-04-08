#!/usr/bin/env bun

/**
 * chain-verify.ts — Verifies that all 6 steps in the d-autoreview chain produced output.
 *
 * Takes a JSON log file as input. The log file should contain an array of step entries.
 * Each entry must have: { step: number, name: string, status: "pass" | "fail" | "fixed", ... }
 *
 * Usage: bun chain-verify.ts <log-file-path>
 * Output: JSON with pass/fail and details per step
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const EXPECTED_STEPS = [
  { step: 1, name: 'd-harden' },
  { step: 2, name: '/review' },
  { step: 3, name: '/simplify' },
  { step: 4, name: 'd-review' },
  { step: 5, name: '/qa' },
  { step: 6, name: '/ship' },
]

// --- Main ---
const logFilePath = process.argv[2]

if (!logFilePath) {
  console.log(
    JSON.stringify({
      pass: false,
      message: 'Usage: bun chain-verify.ts <log-file-path>',
    }),
  )
  process.exit(1)
}

const absPath = resolve(logFilePath)

let logEntries: Array<{ step: number; name: string; status: string }>

try {
  const raw = readFileSync(absPath, 'utf-8')
  logEntries = JSON.parse(raw)
} catch (err) {
  console.log(
    JSON.stringify({
      pass: false,
      message: `Failed to read or parse log file: ${absPath}`,
      error: String(err),
    }),
  )
  process.exit(1)
}

if (!Array.isArray(logEntries)) {
  console.log(
    JSON.stringify({
      pass: false,
      message: 'Log file must contain a JSON array of step entries.',
    }),
  )
  process.exit(1)
}

const missingSteps: Array<{ step: number; name: string }> = []
const stepResults: Array<{ step: number; name: string; found: boolean; status: string | null }> = []

for (const expected of EXPECTED_STEPS) {
  const entry = logEntries.find((e) => e.step === expected.step || e.name === expected.name)

  if (!entry) {
    missingSteps.push(expected)
    stepResults.push({
      step: expected.step,
      name: expected.name,
      found: false,
      status: null,
    })
  } else {
    stepResults.push({
      step: expected.step,
      name: expected.name,
      found: true,
      status: entry.status || 'unknown',
    })
  }
}

const pass = missingSteps.length === 0

const result = {
  pass,
  totalExpected: EXPECTED_STEPS.length,
  totalFound: EXPECTED_STEPS.length - missingSteps.length,
  missingSteps,
  stepResults,
}

console.log(JSON.stringify(result, null, 2))
process.exit(pass ? 0 : 1)
