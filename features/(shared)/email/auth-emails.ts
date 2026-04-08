import { ctaButton, emailLayout, escapeHtml } from './layout'

export function verificationEmail(vars: { name: string; url: string }) {
	const name = escapeHtml(vars.name)
	const content = `
<p>Hi ${name},</p>
<p>Click below to verify your email and access your account.</p>
${ctaButton('Verify Email', vars.url)}
<p style="color:#A69D91;font-size:14px;">This link expires in 24 hours.<br>
If you didn't create an account, ignore this email.</p>`

	return { subject: 'Verify your email — Right Decision', ...emailLayout(content) }
}

export function welcomeEmail(vars: {
	name: string
	hasSubscription: boolean
	dashboardUrl: string
	pricingUrl: string
}) {
	const name = escapeHtml(vars.name)
	const courseBlock = vars.hasSubscription
		? `<p>Your course is waiting.</p>${ctaButton('Go to Course', vars.dashboardUrl)}`
		: `<p>See what's available.</p>${ctaButton('View Pricing', vars.pricingUrl)}`

	const content = `
<p>Hi ${name},</p>
<p>Your account is verified and ready.</p>
${courseBlock}`

	return { subject: 'Welcome to Right Decision', ...emailLayout(content) }
}

export function passwordResetEmail(vars: { name: string; url: string }) {
	const name = escapeHtml(vars.name)
	const content = `
<p>Hi ${name},</p>
<p>Someone requested a password reset for your account.</p>
${ctaButton('Reset Password', vars.url)}
<p style="color:#A69D91;font-size:14px;">This link expires in 30 minutes.<br>
If you didn't request this, your password hasn't changed. You can safely ignore this email.</p>`

	return { subject: 'Reset your password — Right Decision', ...emailLayout(content) }
}

export function passwordChangedEmail(vars: {
	name: string
	date: string
	forgotPasswordUrl: string
}) {
	const name = escapeHtml(vars.name)
	const dateStr = vars.date.split('T')[0]
	const content = `
<p>Hi ${name},</p>
<p>Your password was successfully changed on ${dateStr}.</p>
<p>All other sessions have been signed out for your security.</p>
<p>If you didn't make this change, reset your password immediately:</p>
${ctaButton('Reset Password', vars.forgotPasswordUrl)}`

	return {
		subject: 'Your password was changed — Right Decision',
		...emailLayout(content),
	}
}

export function inactivityReminderEmail(vars: { name: string }) {
	const name = escapeHtml(vars.name)
	const content = `
<p>Hi ${name},</p>
<p>You started something important. Your throughline decision doesn't go away just because life got busy.</p>
<p>Pick up where you left off. It takes 15 minutes.</p>`

	return { subject: 'Your decision is waiting', ...emailLayout(content) }
}

export function moduleCompletionEmail(vars: { name: string; moduleName: string }) {
	const name = escapeHtml(vars.name)
	const moduleName = escapeHtml(vars.moduleName)
	const content = `
<p>Hi ${name},</p>
<p>You just finished <strong>${moduleName}</strong>. That's real progress on your decision.</p>
<p>Keep going. The next module builds directly on what you just learned.</p>`

	return { subject: `You completed: ${vars.moduleName}`, ...emailLayout(content) }
}

export function abandonedOnboardingEmail() {
	const content = `
<p>You started naming your decision yesterday but didn't finish.</p>
<p>The hardest part is starting. You already did that.</p>
<p>Come back and finish. It takes 3 more minutes.</p>`

	return { subject: 'You were so close', ...emailLayout(content) }
}
