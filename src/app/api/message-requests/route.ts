import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth'
import { MESSAGES } from '@/lib/constants'

const PAGE_SIZE = 20

// GET /api/message-requests — list incoming pending requests for current user
export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })

  const requests = await prisma.messageRequest.findMany({
    where: { recipientId: userId, status: 'pending' },
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE,
    include: {
      sender: {
        select: {
          id: true,
          username: true,
          displayName: true,
          profile: { select: { avatarUrl: true } },
        },
      },
    },
  })

  return NextResponse.json({
    requests: requests.map((r) => ({
      id: r.id,
      intro: r.intro,
      createdAt: r.createdAt.toISOString(),
      sender: {
        id: r.sender.id,
        username: r.sender.username,
        displayName: r.sender.displayName,
        avatarUrl: r.sender.profile?.avatarUrl ?? null,
      },
    })),
  })
}

// POST /api/message-requests — send a message request to a user (non-friend)
export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const recipientId = typeof body.recipientId === 'string' ? body.recipientId.trim() : ''
  const intro = typeof body.intro === 'string' ? body.intro.trim().slice(0, 300) : null

  if (!recipientId) return NextResponse.json({ error: MESSAGES.FIELD_REQUIRED }, { status: 400 })
  if (recipientId === userId) return NextResponse.json({ error: 'Cannot message yourself.' }, { status: 400 })

  // Check recipient exists and allows DMs
  const recipient = await prisma.user.findUnique({
    where: { id: recipientId },
    select: { id: true, status: true, profile: { select: { allowDirectMessages: true } } },
  })
  if (!recipient || recipient.status !== 'active') {
    return NextResponse.json({ error: 'User not found.' }, { status: 404 })
  }
  if (recipient.profile?.allowDirectMessages === false) {
    return NextResponse.json({ error: MESSAGES.DIRECT_MESSAGES_DISABLED }, { status: 403 })
  }

  // Check block in either direction
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userId, blockedId: recipientId },
        { blockerId: recipientId, blockedId: userId },
      ],
    },
  })
  if (block) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

  // Check if already friends — if so, don't need a request, caller should use regular messages
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: userId, recipientId, status: 'accepted' },
        { requesterId: recipientId, recipientId: userId, status: 'accepted' },
      ],
    },
  })
  if (friendship) {
    return NextResponse.json({ error: 'You are already friends. Send a message directly.' }, { status: 409 })
  }

  // Upsert the request (idempotent if already pending)
  const req = await prisma.messageRequest.upsert({
    where: { senderId_recipientId: { senderId: userId, recipientId } },
    create: { senderId: userId, recipientId, intro: intro || null, status: 'pending' },
    update: { intro: intro || null, status: 'pending', updatedAt: new Date() },
  })

  // Create notification for recipient
  await prisma.notification.create({
    data: {
      userId: recipientId,
      type: 'message_request',
      title: 'New message request',
      body: intro ?? 'Someone wants to message you.',
      link: '/messagess?tab=requests',
    },
  })

  return NextResponse.json({ request: { id: req.id, status: req.status } }, { status: 201 })
}
