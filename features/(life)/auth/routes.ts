import { Hono } from 'hono'
import { renderPage } from '@/platform/server/render'
import { env } from '@/platform/env'
import { payments } from '@/providers/payments'
import { ForgotPasswordPage } from './forgot-password'
import { PurchaseSuccessPage } from './purchase-success'
import { ResetPasswordPage } from './reset-password'
import { VerifyEmailPage } from './verify-email'

export const authPageRoutes = new Hono()

authPageRoutes.get('/forgot-password', (c) => {
	return c.html(
		renderPage(<ForgotPasswordPage />, {
			title: 'Reset Password — Right Decision',
			description: 'Reset your Right Decision account password.',
		}),
	)
})

authPageRoutes.get('/reset-password', (c) => {
	return c.html(
		renderPage(<ResetPasswordPage />, {
			title: 'New Password — Right Decision',
			description: 'Set a new password for your Right Decision account.',
		}),
	)
})

authPageRoutes.get('/purchase/success', async (c) => {
	const sessionId = c.req.query('session_id')
	let email: string | undefined
	if (sessionId) {
		try {
			const session = await payments.checkout.sessions.retrieve(sessionId)
			email = session.customer_details?.email ?? undefined
		} catch {
			// Session lookup failed — render without pre-fill
		}
	}
	return c.html(
		renderPage(<PurchaseSuccessPage email={email} />, {
			title: 'Create Your Account — Right Decision',
			description: 'Your payment is confirmed. Create your account to access the course.',
		}),
	)
})

authPageRoutes.get('/verify-email', (c) => {
	const verified = c.req.query('verified') === 'true'
	return c.html(
		renderPage(<VerifyEmailPage success={verified} />, {
			title: 'Email Verification — Right Decision',
			description: 'Verify your email address.',
		}),
	)
})
