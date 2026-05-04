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

    // Online status — no lastActiveAt field yet, always false for now
    const isOnline = false

    return NextResponse.json({
      profile: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: profile?.avatarUrl ?? null,
        photoUrls: profile?.photoUrls ?? [],
        bio: profile?.bio ?? null,
        age: profile?.age ?? null,
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
