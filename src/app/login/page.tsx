import { ROUTES } from '@/lib/constants'

type LoginPageProps = {
  searchParams?: {
    returnTo?: string
    error?: string
  }
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const safeReturnTo =
    searchParams?.returnTo &&
    searchParams.returnTo.startsWith('/') &&
    !searchParams.returnTo.startsWith('//')
      ? searchParams.returnTo
      : ROUTES.DASHBOARD

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#060304] px-4 py-12 text-stone-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(197,126,61,0.2),transparent_30%),radial-gradient(circle_at_bottom,rgba(128,25,52,0.26),transparent_45%),linear-gradient(180deg,#060304_0%,#14080c_55%,#060304_100%)]" />

      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-[#140b0e]/95 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.65)] sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(197,126,61,0.24),transparent_32%),radial-gradient(circle_at_bottom,rgba(128,25,52,0.24),transparent_40%)]" />

        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-amber-200/70">
            Member Login
          </p>
          <h1 className="mt-3 font-[family:var(--font-display)] text-4xl leading-none text-stone-100">
            Enter your personal passcode
          </h1>
          <p className="mt-4 text-sm leading-6 text-stone-300/80">
            Use your private passcode to access your dashboard.
          </p>

          <form action="/api/auth/login" method="POST" className="mt-8 space-y-4">
            <input type="hidden" name="returnTo" value={safeReturnTo} />

            <div>
              <label
                htmlFor="passcode"
                className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-stone-400"
              >
                Passcode
              </label>
              <input
                id="passcode"
                name="passcode"
                type="text"
                minLength={6}
                maxLength={8}
                pattern="[A-Za-z0-9]{6,8}"
                autoComplete="one-time-code"
                placeholder="AB12CD"
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-center text-lg font-semibold tracking-[0.45em] text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-200/60 focus:ring-2 focus:ring-amber-200/20"
                required
              />
            </div>

            {searchParams?.error && (
              <p className="rounded-2xl border border-[#b03d53]/35 bg-[#4d1421]/45 px-4 py-3 text-sm text-[#ffced5]">
                {searchParams.error}
              </p>
            )}

            <button
              type="submit"
              className="relative inline-flex w-full items-center justify-center rounded-full border border-amber-200/20 bg-gradient-to-r from-[#8c1f43] via-[#a0354f] to-[#6d102e] px-5 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-stone-100 transition hover:brightness-110"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}