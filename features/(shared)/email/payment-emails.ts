import { ctaButton, emailLayout, escapeHtml } from './layout'

export function paymentConfirmationEmail(vars: {
	name: string
	amount: string
	renewalDate: string
	firstLessonUrl: string
}) {
	const name = escapeHtml(vars.name)
	const content = `
<p>Hi ${name},</p>
<p><strong>${escapeHtml(vars.amount)} — Right Decision: The Course (Annual)</strong></p>
<p>Your access is active until ${escapeHtml(vars.renewalDate)}.</p>
<p>The course starts with Act 1: See Clearly. Your first class is ready:</p>
${ctaButton('Start the Course', vars.firstLessonUrl)}
<p style="color:#A69D91;font-size:14px;">If you have questions, reply to this email.</p>`

	return {
		subject: "You're in — here's your first step",
		...emailLayout(content, { preheader: 'Your course access is ready.' }),
	}
}

export function renewalReceiptEmail(vars: {
	name: string
	amount: string
	cardLast4: string
	nextRenewalDate: string
	portalUrl: string
}) {
	const name = escapeHtml(vars.name)
	const content = `
<p>Hi ${name},</p>
<p>${escapeHtml(vars.amount)} charged to card ending in ${escapeHtml(vars.cardLast4)}.</p>
<p>Your access continues through ${escapeHtml(vars.nextRenewalDate)}.</p>
${ctaButton('View Billing History', vars.portalUrl)}`

	return {
		subject: 'Your Right Decision subscription renewed',
		...emailLayout(content),
	}
}

export function paymentFailedEmail(vars: {
	name: string
	amount: string
	portalUrl: string
}) {
	const name = escapeHtml(vars.name)
	const content = `
<p>Hi ${name},</p>
<p>Your payment of ${escapeHtml(vars.amount)} for Right Decision couldn't be processed.</p>
<p>This happens — usually it's an expired card or a temporary bank hold.</p>
${ctaButton('Update Payment Method', vars.portalUrl)}
<p>Your course access stays active while we retry. If the payment isn't resolved within 14 days, your access will be paused.</p>
<p style="color:#A69D91;font-size:14px;">Questions? Reply to this email.</p>`

	return {
		subject: "Your payment didn't go through",
		...emailLayout(content),
	}
}

export function renewalReminderEmail(vars: {
	name: string
	amount: string
	renewalDate: string
	cardBrand: string
	cardLast4: string
	portalUrl: string
}) {
	const name = escapeHtml(vars.name)
	const content = `
<p>Hi ${name},</p>
<p>Your Right Decision subscription (${escapeHtml(vars.amount)}/year) renews on ${escapeHtml(vars.renewalDate)}.</p>
<p>Payment method: ${escapeHtml(vars.cardBrand)} ending in ${escapeHtml(vars.cardLast4)}</p>
${ctaButton('Manage Billing', vars.portalUrl)}`

	return {
		subject: 'Your subscription renews in 7 days',
		...emailLayout(content),
	}
}

export function subscriptionCancelledEmail(vars: {
	name: string
	periodEndDate: string
	pricingUrl: string
}) {
	const name = escapeHtml(vars.name)
	const content = `
<p>Hi ${name},</p>
<p>Your Right Decision subscription has been cancelled.</p>
<p>You'll continue to have access until ${escapeHtml(vars.periodEndDate)}.</p>
${ctaButton('Resubscribe', vars.pricingUrl)}
<p style="color:#A69D91;font-size:14px;">We'd love to know what we could have done better. Reply to this email.</p>`

	return {
		subject: 'Your subscription has been cancelled',
		...emailLayout(content),
	}
}

export function accessRevokedEmail(vars: { name: string; reactivateUrl: string }) {
	const name = escapeHtml(vars.name)
	const content = `
<p>Hi ${name},</p>
<p>We weren't able to process your payment after multiple attempts.</p>
<p>Your access to the course has been paused.</p>
${ctaButton('Reactivate Your Subscription', vars.reactivateUrl)}
<p style="color:#A69D91;font-size:14px;">If there's anything we can help with, reply to this email.</p>`

	return {
		subject: 'Your course access has been paused',
		...emailLayout(content),
	}
}
