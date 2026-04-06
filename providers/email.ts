import { Resend } from 'resend'
import { env } from '@/platform/env'

export const email = new Resend(env.RESEND_API_KEY)

export async function sendEmail(to: string, subject: string, html: string) {
  return email.emails.send({
    from: 'Right Decision <hello@rightdecision.com>',
    to,
    subject,
    html,
  })
}
