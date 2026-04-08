import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { mockSchema } from '@/platform/test/mocks'

mock.module('@/platform/env', () => ({
  env: { DATABASE_URL: 'postgres://test' },
}))

const mockFindFirst = mock(() => Promise.resolve(null))
const mockFindMany = mock(() => Promise.resolve([]))
const mockSelectFrom = mock(() => ({
  where: mock(() => Promise.resolve([])),
  groupBy: mock(() => ({ having: mock(() => Promise.resolve([])) })),
}))
const mockSelect = mock(() => ({ from: mockSelectFrom }))

mock.module('@/platform/db/client', () => ({
  db: {
    query: {
      users: { findFirst: mockFindFirst },
      onboardingSessions: { findMany: mockFindMany },
    },
    select: mockSelect,
  },
}))

mock.module('@/platform/db/schema', () => mockSchema())

const mockSendEmail = mock(() => Promise.resolve())
mock.module('@/providers/email', () => ({
  sendEmail: mockSendEmail,
}))

const { sendInactivityReminders, sendModuleCompletionEmail, sendAbandonedOnboardingReminders } =
  await import('./reminders')

describe('reminders', () => {
  beforeEach(() => {
    mockFindFirst.mockReset()
    mockFindMany.mockReset()
    mockSendEmail.mockReset()
    mockSelect.mockReset()
    mockSelectFrom.mockReset()

    mockSelect.mockReturnValue({ from: mockSelectFrom } as never)
    mockSelectFrom.mockReturnValue({
      where: mock(() => Promise.resolve([])),
      groupBy: mock(() => ({ having: mock(() => Promise.resolve([])) })),
    } as never)
  })

  describe('sendInactivityReminders', () => {
    it('returns sent count 0 when no inactive users', async () => {
      mockSelectFrom.mockReturnValue({
        groupBy: mock(() => ({ having: mock(() => Promise.resolve([])) })),
      } as never)

      const result = await sendInactivityReminders()
      expect(result).toEqual({ sent: 0 })
    })

    it('sends email to inactive users', async () => {
      mockSelectFrom.mockReturnValue({
        groupBy: mock(() => ({
          having: mock(() => Promise.resolve([{ userId: 'u1' }])),
        })),
      } as never)
      mockFindFirst.mockResolvedValueOnce({
        id: 'u1',
        email: 'test@example.com',
        name: 'Test',
      } as never)

      const result = await sendInactivityReminders()
      expect(result).toEqual({ sent: 1 })
      expect(mockSendEmail).toHaveBeenCalledTimes(1)
    })

    it('skips users not found in db', async () => {
      mockSelectFrom.mockReturnValue({
        groupBy: mock(() => ({
          having: mock(() => Promise.resolve([{ userId: 'u1' }])),
        })),
      } as never)
      mockFindFirst.mockResolvedValueOnce(null as never)

      const result = await sendInactivityReminders()
      expect(result).toEqual({ sent: 0 })
      expect(mockSendEmail).not.toHaveBeenCalled()
    })
  })

  describe('sendModuleCompletionEmail', () => {
    it('sends email with module name', async () => {
      mockFindFirst.mockResolvedValueOnce({
        id: 'u1',
        email: 'test@example.com',
        name: 'Test',
      } as never)

      await sendModuleCompletionEmail('u1', 1)
      expect(mockSendEmail).toHaveBeenCalledTimes(1)
      expect((mockSendEmail.mock.calls[0] as unknown[])?.[1] as { subject: string }).toBeTruthy()
      expect(
        ((mockSendEmail.mock.calls[0] as unknown[])[1] as { subject: string }).subject,
      ).toContain('The Wake-Up Call')
    })

    it('does not send email when user not found', async () => {
      mockFindFirst.mockResolvedValueOnce(null as never)

      await sendModuleCompletionEmail('missing', 1)
      expect(mockSendEmail).not.toHaveBeenCalled()
    })

    it('falls back to generic module name for unknown module', async () => {
      mockFindFirst.mockResolvedValueOnce({
        id: 'u1',
        email: 'test@example.com',
        name: 'Test',
      } as never)

      await sendModuleCompletionEmail('u1', 99)
      expect(mockSendEmail).toHaveBeenCalledTimes(1)
      expect((mockSendEmail.mock.calls[0] as unknown[])?.[1] as { subject: string }).toBeTruthy()
      expect(
        ((mockSendEmail.mock.calls[0] as unknown[])[1] as { subject: string }).subject,
      ).toContain('Module 99')
    })
  })

  describe('sendAbandonedOnboardingReminders', () => {
    it('returns sent count 0 when no abandoned sessions', async () => {
      mockFindMany.mockResolvedValueOnce([] as never)

      const result = await sendAbandonedOnboardingReminders()
      expect(result).toEqual({ sent: 0 })
    })

    it('sends email to abandoned sessions with email', async () => {
      mockFindMany.mockResolvedValueOnce([
        { id: 's1', sessionData: { email: 'test@example.com' }, createdAt: new Date() },
      ] as never)

      const result = await sendAbandonedOnboardingReminders()
      expect(result).toEqual({ sent: 1 })
      expect(mockSendEmail).toHaveBeenCalledTimes(1)
    })

    it('skips sessions without email', async () => {
      mockFindMany.mockResolvedValueOnce([
        { id: 's1', sessionData: { name: 'test' }, createdAt: new Date() },
      ] as never)

      const result = await sendAbandonedOnboardingReminders()
      expect(result).toEqual({ sent: 0 })
    })
  })
})
