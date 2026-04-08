/**
 * Real-time hardening guard — PostToolUse hook on Write|Edit.
 * Catches security and UI violations as the agent writes code.
 * Same patterns as platform/scripts/harden-check.ts but per-edit.
 *
 * Security violations BLOCK (exit 2). Style warnings inform (exit 0).
 */

const input = await Bun.stdin.json()

const filePath: string = input.tool_input?.file_path ?? ''
const content: string = input.tool_input?.content ?? input.tool_input?.new_string ?? ''

// Only check project source files
if (
  !filePath ||
  filePath.includes('node_modules') ||
  filePath.includes('.claude/') ||
  filePath.includes('mcp_agent_mail') ||
  filePath.includes('.context/')
) {
  process.exit(0)
}

const errors: string[] = []
const warnings: string[] = []

// Skip checks for non-code files
const isCode = /\.(ts|tsx|js|jsx)$/.test(filePath)
const isUI = /\.(tsx|jsx|html)$/.test(filePath)

if (isCode) {
  // SECURITY ERRORS (block the edit)

  // process.env outside env.ts
  if (!filePath.endsWith('platform/env.ts') && /process\.env\b/.test(content)) {
    errors.push('Use `env` from platform/env.ts instead of process.env')
  }

  // Raw c.json() in route files
  if (filePath.includes('features/') && /\bc\.json\s*\(/.test(content)) {
    errors.push('Use success()/created()/throwError() instead of raw c.json()')
  }

  // SQL injection via template literals
  if (/`[^`]*(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER)\b[^`]*\$\{/i.test(content)) {
    errors.push('SQL with template literal interpolation detected — use Drizzle query builder')
  }

  // Hardcoded secrets
  if (/['"`](sk_live_|sk-ant-api|whsec_|rk_live_)[a-zA-Z0-9]{10,}['"`]/.test(content)) {
    errors.push('Hardcoded secret detected — use platform/env.ts')
  }

  // eval() or new Function()
  if (/\beval\s*\(/.test(content)) {
    errors.push('eval() is a security risk')
  }
  if (/new\s+Function\s*\(/.test(content)) {
    errors.push('new Function() is equivalent to eval')
  }

  // console.log of sensitive data
  if (
    /console\.(log|info|debug)\s*\([^)]*\b(password|secret|token|apiKey|api_key|private_key)\b/i.test(
      content,
    )
  ) {
    errors.push('Logging sensitive variable — remove or redact')
  }
}

if (isUI) {
  // STYLE WARNINGS (inform only)

  // dangerouslySetInnerHTML
  if (/dangerouslySetInnerHTML/.test(content)) {
    warnings.push('dangerouslySetInnerHTML — ensure content is sanitized')
  }

  // Arbitrary Tailwind values
  if (/\b(text|w|h|p|m|gap)-\[\d+px\]/.test(content)) {
    warnings.push('Arbitrary Tailwind value — use design system scale')
  }
}

// Security errors block the edit
if (errors.length > 0) {
  console.log(
    `\n  Harden Gate: ${errors.length} ERROR(s) in ${filePath.split('/').pop()} — BLOCKED`,
  )
  for (const e of errors) {
    console.log(`  \x1b[31mERROR\x1b[0m  ${e}`)
  }
  console.log('')
  process.exit(2)
}

// Style warnings inform but don't block
if (warnings.length > 0) {
  console.log(`\n  Harden Gate: ${warnings.length} warning(s) in ${filePath.split('/').pop()}`)
  for (const w of warnings) {
    console.log(`  \x1b[33mWARN\x1b[0m  ${w}`)
  }
  console.log('')
}

process.exit(0)
