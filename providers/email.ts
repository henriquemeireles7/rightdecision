import { Resend } from 'resend'
import { env } from '@/platform/env'

export const email = new Resend(env.RESEND_API_KEY)

export async function sendEmail(to: string, msg: { subject: string; html: string; text: string }) {
  console.info(`[email] ${msg.subject} -> ${to}`)
  return email.emails.send({
    from: 'Right Decision <hello@rightdecision.com>',
    to,
    subject: msg.subject,
    html: msg.html,
    text: msg.text,
  })
}
