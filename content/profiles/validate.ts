import { validateProfiles } from '@/providers/profile'

const isTTY = process.stdout.isTTY

const green = (s: string) => (isTTY ? `\x1b[32m${s}\x1b[0m` : s)
const red = (s: string) => (isTTY ? `\x1b[31m${s}\x1b[0m` : s)
const bold = (s: string) => (isTTY ? `\x1b[1m${s}\x1b[0m` : s)
const dim = (s: string) => (isTTY ? `\x1b[2m${s}\x1b[0m` : s)

const report = validateProfiles()

console.log(bold('\n  Profile Validation Report'))
console.log(dim(`  ${'─'.repeat(40)}`))

for (const profile of report.profiles) {
  const status = profile.errors.length === 0 ? green('PASS') : red('FAIL')
  const score = `${profile.healthScore}/10`

  console.log(`\n  ${bold(profile.name)} ${dim('·')} ${status} ${dim('·')} Health: ${score}`)

  if (profile.errors.length > 0) {
    for (const error of profile.errors) {
      console.log(`    ${red('✗')} ${error}`)
    }
  }
}

console.log(dim('\n  ─'.repeat(30)))
console.log(
  `  ${bold('Result:')} ${report.valid ? green('All profiles valid') : red(`${report.profiles.filter((p) => p.errors.length > 0).length} profile(s) have errors`)}`,
)
console.log()

if (!report.valid) {
  process.exit(1)
}
