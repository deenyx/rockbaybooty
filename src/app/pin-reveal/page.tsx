import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'
import PinConfirmForm from './_components/pin-confirm-form'
import prisma from '@/lib/prisma'

const CP = "Copperplate, 'Copperplate Gothic Light', fantasy"

interface PinRevealPayload {
  userId: string
  pin: string
  type: string
}

export default async function PinRevealPage() {
  const cookieStore = cookies()
  const tokenCookie = cookieStore.get('pin-reveal-token')

  if (!tokenCookie?.value) {
    redirect('/welcome')
  }

  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    redirect('/welcome')
  }

  let payload: PinRevealPayload
  try {
    payload = jwt.verify(tokenCookie.value, jwtSecret) as PinRevealPayload
  } catch {
    redirect('/welcome')
  }

  if (payload.type !== 'pin-reveal') {
    redirect('/welcome')
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { firstName: true },
  })

  if (!user?.firstName) {
    redirect('/welcome')
  }

  return (
    <main className="min-h-screen bg-[#060304] flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Heading */}
        <div className="text-center">
          <h1
            className="text-xl text-stone-200 tracking-[0.18em]"
            style={{ fontFamily: CP }}
          >
            your login pin
          </h1>
          <p
            className="mt-1 text-[9px] uppercase tracking-[0.22em] text-stone-600"
            style={{ fontFamily: CP }}
          >
            save this somewhere safe
          </p>
        </div>

        {/* PIN display */}
        <div className="rounded-2xl border border-white/10 bg-black/55 px-8 py-8 backdrop-blur-md text-center space-y-4">
          <div>
            <p
              className="text-[8px] uppercase tracking-[0.28em] text-stone-600 mb-3"
              style={{ fontFamily: CP }}
            >
              name
            </p>
            <p className="text-lg text-stone-200 tracking-wide" style={{ fontFamily: CP }}>
              {user.firstName}
            </p>
          </div>

          <div className="border-t border-white/5 pt-4">
            <p
              className="text-[8px] uppercase tracking-[0.28em] text-stone-600 mb-3"
              style={{ fontFamily: CP }}
            >
              pin
            </p>
            <p
              className="text-4xl tracking-[0.6em] text-pink-300 font-mono"
            >
              {payload.pin}
            </p>
          </div>

          <p
            className="text-[9px] leading-relaxed text-stone-500 pt-2"
            style={{ fontFamily: CP }}
          >
            to log in: enter your pin + name.<br />
            you will not see this again.
          </p>
        </div>

        {/* Confirm form */}
        <div className="rounded-2xl border border-white/10 bg-black/55 px-8 py-8 backdrop-blur-md">
          <PinConfirmForm
            expectedPin={payload.pin}
            expectedFirstName={user.firstName}
          />
        </div>
      </div>
    </main>
  )
}
