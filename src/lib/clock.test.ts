import { describe, expect, it } from 'vitest'
import { formatTelemetryTime } from './clock'

describe('formatTelemetryTime', () => {
  it('formats the T+ telemetry look: hours, no leading zero', () => {
    expect(formatTelemetryTime(new Date(2026, 0, 1, 0, 38, 50, 909))).toBe(
      'T+0:38:50909',
    )
  })

  it('zero-pads minutes, seconds and milliseconds', () => {
    expect(formatTelemetryTime(new Date(2026, 0, 1, 3, 2, 5, 7))).toBe(
      'T+3:02:05007',
    )
  })

  it('never pads hours beyond their natural digit count', () => {
    expect(formatTelemetryTime(new Date(2026, 0, 1, 14, 0, 0, 0))).toBe(
      'T+14:00:00000',
    )
  })

  it('concatenates seconds and milliseconds with no separator', () => {
    const result = formatTelemetryTime(new Date(2026, 0, 1, 1, 1, 9, 42))
    expect(result).toBe('T+1:01:09042')
    // "09042" is seconds "09" immediately followed by milliseconds "042".
    expect(result.slice(-5)).toBe('09042')
  })

  it('is a pure function of the given Date (no Date.now() dependency)', () => {
    const a = new Date(2026, 5, 1, 5, 6, 7, 8)
    const b = new Date(2026, 5, 1, 5, 6, 7, 8)
    expect(formatTelemetryTime(a)).toBe(formatTelemetryTime(b))
  })
})
