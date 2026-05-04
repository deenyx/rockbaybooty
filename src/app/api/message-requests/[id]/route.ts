import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth'
import { MESSAGES } from '@/lib/constants'

// PATCH /api/message-requests/[id] — accept or decline a request
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getAuthenticatedUserId(request)
  if (!userId) return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { action } = body as { action?: string }

  if (!['accept', 'decline'].includes(action ?? '')) {
    return NextResponse.json({ error: MESSAGES.FIELD_REQUIRED }, { status: 400 })
  }

  const req = await prisma.messageRequest.findUnique({ where: { id: params.id } })
  if (!req || req.recipientId !== userId) {
    return NextResponse.json({ error: 'Request not found.' }, { status: 404 })
  }
  if (req.status !== 'pending') {
    return NextResponse.json({ error: 'Request already actioned.' }, { status: 409 })
  }

  await prisma.messageRequest.update({
    where: { id: params.id },
    data: { status: action === 'accept' ? 'accepted' : 'declined' },
  })

  // If accepted and they sent an intro message, create the first real message
  if (action === 'accept' && req.intro) {
    await prisma.message.create({
      data: {
        senderId: req.senderId,
        recipientId: userId,
        kind: 'text',
        body: req.intro,
      },
    })
  }

  // Notify sender of the decision
  await prisma.notification.create({
    data: {
      userId: req.senderId,
      type: 'message_request',
      title: action === 'accept' ? 'Message request accepted' : 'Message request declined',
      body:
        action === 'accept'
          ? 'Your message request was accepted. You can now chat.'
          : 'Your message request was declined.',
      link: action === 'accept' ? `/messagess/${userId}` : null,
    },
  })

  return NextResponse.json({ status: action === 'accept' ? 'accepted' : 'declined' })
}
