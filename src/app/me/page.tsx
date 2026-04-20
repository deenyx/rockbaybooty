import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { AUTH_COOKIE_NAME, ROUTES } from '@/lib/constants'
import prisma from '@/lib/prisma'
import type { AuthTokenPayload } from '@/lib/types'

function getTokenPayload(token: string): AuthTokenPayload | null {
	const jwtSecret = process.env.JWT_SECRET

	if (!jwtSecret) {
		return null
	}

	try {
		return jwt.verify(token, jwtSecret) as AuthTokenPayload
	} catch {
		return null
	}
}

export default async function MePage() {
	const cookieStore = await cookies()
	const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

	if (!token) {
		redirect(`${ROUTES.LOGIN}?returnTo=${encodeURIComponent(ROUTES.ME)}`)
	}

	const payload = getTokenPayload(token)

	if (!payload) {
		redirect(ROUTES.DASHBOARD)
	}

	const userId =
		(typeof payload.userId === 'string' && payload.userId) ||
		(typeof payload.sub === 'string' && payload.sub) ||
		null

	if (!userId) {
		redirect(ROUTES.DASHBOARD)
	}

	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { username: true },
	})

	if (!user?.username) {
		redirect(ROUTES.DASHBOARD)
	}

	redirect(`/u/${user.username}`)
}
