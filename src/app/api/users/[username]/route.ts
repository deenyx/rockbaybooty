import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth'
import { MESSAGES } from '@/lib/constants'

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const viewerId = await getAuthenticatedUserId(request)
    if (!viewerId) {
      return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })
    }

    const { username } = params

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        profile: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Member not found.' }, { status: 404 })
    }

    // Check if viewer has blocked or been blocked
    const block = await prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: viewerId, blockedId: user.id },
          { blockerId: user.id, blockedId: viewerId },
        ],
      },
    })
    if (block) {
      return NextResponse.json({ error: 'Member not found.' }, { status: 404 })
    }

    // Determine friendship status
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: viewerId, recipientId: user.id },
          { requesterId: user.id, recipientId: viewerId },
        ],
      },
    })

    let friendshipStatus: 'none' | 'outgoing_pending' | 'incoming_pending' | 'friends' = 'none'
    let friendshipId: string | null = null
    if (friendship) {
      friendshipId = friendship.id
      if (friendship.status === 'accepted') {
        friendshipStatus = 'friends'
      } else if (friendship.status === 'pending') {
        friendshipStatus =
          friendship.requesterId === viewerId ? 'outgoing_pending' : 'incoming_pending'
      }
    }

    const isSelf = viewerId === user.id
    const isFriend = friendshipStatus === 'friends'
    const profile = user.profile

    // Social links visibility
    const slVis = profile?.socialLinksVisibility ?? 'members'
    const showSocialLinks =
      slVis === 'public' ||
      slVis === 'members' ||
      (slVis === 'friends' && isFriend) ||
      isSelf

    // Online status (15-minute window)
    const showOnline = profile?.showOnlineStatus !== false
    const isOnline = showOnline && user.lastActiveAt
      ? Date.now() - new Date(user.lastActiveAt).getTime() < 15 * 60 * 1000
      : false

    // Compute age from dateOfBirth, fall back to stored age
    let age: number | null = profile?.age ?? null
    if (profile?.dateOfBirth) {
      const dob = new Date(profile.dateOfBirth)
      const now = new Date()
      let computed = now.getFullYear() - dob.getFullYear()
      const m = now.getMonth() - dob.getMonth()
      if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) computed--
      age = computed
    }

    return NextResponse.json({
      profile: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: profile?.avatarUrl ?? null,
        photoUrls: profile?.photoUrls ?? [],
        bio: profile?.bio ?? null,
        age,
        gender: profile?.gender ?? null,
        genderOther: profile?.genderOther ?? null,
        pronouns: profile?.pronouns ?? null,
        sexualOrientation: profile?.sexualOrientation ?? null,
        orientationOther: profile?.orientationOther ?? null,
        city: profile?.city ?? null,
        state: profile?.state ?? null,
        country: profile?.country ?? null,
        interests: profile?.interests ?? [],
        lookingFor: profile?.lookingFor ?? [],
        isOnline,
        isVerified: user.isVerified,
        isSelf,
        friendshipStatus,
        allowDirectMessages: profile?.allowDirectMessages ?? true,
        allowFriendRequests: profile?.allowFriendRequests ?? true,
        friendshipId,
        socialLinks: showSocialLinks
          ? {
              twitter: profile?.twitterUrl ?? null,
              fetlife: profile?.fetlifeUrl ?? null,
              onlyfans: profile?.onlyfansUrl ?? null,
              pornhub: profile?.pornhubUrl ?? null,
              tumblr: profile?.tumblrUrl ?? null,
              instagram: profile?.instagramUrl ?? null,
            }
          : null,
        memberSince: user.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('[GET /api/users/[username]]', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
