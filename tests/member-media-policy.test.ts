import { describe, expect, it } from 'vitest'

import { getMemberMediaPolicy } from '../src/lib/member-media-policy'

describe('getMemberMediaPolicy', () => {
  it('returns unlimited media for premium members', () => {
    const policy = getMemberMediaPolicy({ role: 'MEMBER', isPremium: true })

    expect(policy.tier).toBe('premium')
    expect(policy.maxPhotos).toBeNull()
    expect(policy.maxVideos).toBeNull()
    expect(policy.allowVideos).toBe(true)
    expect(policy.requireWatermark).toBe(false)
  })

  it('returns unlimited media for admins even without premium flag', () => {
    const adminPolicy = getMemberMediaPolicy({ role: 'ADMIN', isPremium: false })
    const supremePolicy = getMemberMediaPolicy({ role: 'SUPREME_ADMIN', isPremium: false })

    expect(adminPolicy.tier).toBe('premium')
    expect(adminPolicy.maxPhotos).toBeNull()
    expect(adminPolicy.maxVideos).toBeNull()
    expect(supremePolicy.tier).toBe('premium')
    expect(supremePolicy.maxPhotos).toBeNull()
    expect(supremePolicy.maxVideos).toBeNull()
  })

  it('enforces free member limits', () => {
    const policy = getMemberMediaPolicy({ role: 'MEMBER', isPremium: false })

    expect(policy.tier).toBe('free')
    expect(policy.maxPhotos).toBe(10)
    expect(policy.maxVideos).toBe(3)
    expect(policy.allowVideos).toBe(true)
    expect(policy.requireWatermark).toBe(false)
  })

  it('enforces burner limits and watermark requirement', () => {
    const policy = getMemberMediaPolicy({ role: 'BURNER', isPremium: false })

    expect(policy.tier).toBe('burner')
    expect(policy.maxPhotos).toBe(5)
    expect(policy.maxVideos).toBe(0)
    expect(policy.allowVideos).toBe(false)
    expect(policy.requireWatermark).toBe(true)
  })

  it('keeps model-verified users on free limits unless premium is enabled', () => {
    const policy = getMemberMediaPolicy({ role: 'MODEL_VERIFIED', isPremium: false })

    expect(policy.tier).toBe('free')
    expect(policy.maxPhotos).toBe(10)
    expect(policy.maxVideos).toBe(3)
    expect(policy.allowVideos).toBe(true)
  })
})
