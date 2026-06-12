import { describe, expect, it, mock } from 'bun:test'
import type { SchedulerJob } from './tick'
import { jobs, tick } from './tick'

const NOW = new Date('2026-06-12T15:00:00Z')

describe('tick', () => {
  it('runs all injected jobs sequentially with the same now', async () => {
    const order: string[] = []
    const seen: Date[] = []
    const job = (name: string): SchedulerJob => ({
      name,
      run: async (now) => {
        order.push(name)
        seen.push(now)
        return 0
      },
    })

    await tick(NOW, [job('a'), job('b'), job('c')])

    expect(order).toEqual(['a', 'b', 'c'])
    expect(seen).toEqual([NOW, NOW, NOW])
  })

  it('continues past a throwing job and logs the failure', async () => {
    const ran: string[] = []
    const failing: SchedulerJob = {
      name: 'failing',
      run: async () => {
        throw new Error('boom')
      },
    }
    const next: SchedulerJob = {
      name: 'next',
      run: async () => {
        ran.push('next')
        return 0
      },
    }
    const errorSpy = mock(() => {})
    const original = console.error
    console.error = errorSpy
    try {
      await tick(NOW, [failing, next])
    } finally {
      console.error = original
    }

    expect(ran).toEqual(['next'])
    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(String((errorSpy.mock.calls[0] as unknown[])[0])).toContain('failing')
  })

  it('exports the three scheduler jobs in order', () => {
    expect(jobs.map((job) => job.name)).toEqual([
      'processPendingDrips',
      'cohortAutoCreation',
      'enrollmentExpirySweep',
    ])
  })
})
