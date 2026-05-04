import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthenticatedUserId } from '@/lib/auth'
import { MESSAGES } from '@/lib/constants'

const MAX_PHOTOS = 9
const MAX_BYTES = 800 * 1024 // 800 KB per photo (base64 stored as data URL)

// POST /api/photos — add a photo URL (or base64 data URL) to the album
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const { url } = body as { url?: string }

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url is required' }, { status: 400 })
    }

    // Basic validation — must be a URL or data URL
    const isDataUrl = url.startsWith('data:image/')
    const isUrl = url.startsWith('http://') || url.startsWith('https://')
    if (!isDataUrl && !isUrl) {
      return NextResponse.json({ error: 'Must be a valid image URL or data URL' }, { status: 400 })
    }

    // Size guard for data URLs
    if (isDataUrl && Buffer.byteLength(url, 'utf8') > MAX_BYTES) {
      return NextResponse.json({ error: 'Image too large. Max 600 KB.' }, { status: 400 })
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { photoUrls: true },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })
    }

    if (profile.photoUrls.length >= MAX_PHOTOS) {
      return NextResponse.json({ error: `Maximum ${MAX_PHOTOS} photos allowed.` }, { status: 400 })
    }

    if (profile.photoUrls.includes(url)) {
      return NextResponse.json({ photoUrls: profile.photoUrls })
    }

    const updated = await prisma.profile.update({
      where: { userId },
      data: { photoUrls: { push: url } },
      select: { photoUrls: true },
    })

    return NextResponse.json({ photoUrls: updated.photoUrls })
  } catch (error) {
    console.error('[POST /api/photos]', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}

// DELETE /api/photos — remove a photo URL from the album
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request)
    if (!userId) return NextResponse.json({ error: MESSAGES.AUTH_REQUIRED }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const { url } = body as { url?: string }

    if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 })

    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { photoUrls: true },
    })

    if (!profile) return NextResponse.json({ error: 'Profile not found.' }, { status: 404 })

    const updated = await prisma.profile.update({
      where: { userId },
      data: { photoUrls: profile.photoUrls.filter((p) => p !== url) },
      select: { photoUrls: true },
    })

    return NextResponse.json({ photoUrls: updated.photoUrls })
  } catch (error) {
    console.error('[DELETE /api/photos]', error)
    return NextResponse.json({ error: MESSAGES.ERROR_GENERAL }, { status: 500 })
  }
}
