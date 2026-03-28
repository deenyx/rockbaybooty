import { ROUTES } from '@/lib/constants'

type LoginPageProps = {
  searchParams?: {
    returnTo?: string
    error?: string
  }
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const showPreviewHint = process.env.NODE_ENV !== 'production'

  const safeReturnTo =
    searchParams?.returnTo &&
    searchParams.returnTo.startsWith('/') &&
    !searchParams.returnTo.startsWith('//')
      ? searchParams.returnTo
      : ROUTES.DASHBOARD

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] px-4 py-12 text-stone-100">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/welcome2.jpg')",
          backgroundPosition: 'center center',
          backgroundSize: 'cover',
          filter: 'saturate(1.08) contrast(1.03)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 18% 16%, rgba(56, 189, 248, 0.26), transparent 42%), radial-gradient(circle at 82% 14%, rgba(244, 114, 182, 0.2), transparent 36%), linear-gradient(180deg, rgba(2, 6, 23, 0.56), rgba(2, 6, 23, 0.9))',
          opacity: 0.1,
        }}
      />

      <div className="relative z-10 w-full max-w-md px-2 sm:px-0">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.34em] text-amber-200/70">
            Member Login
          </p>
          <h1 className="mt-3 font-[family:var(--font-display)] text-4xl leading-none text-stone-100">
            Enter your personal passcode
          </h1>
          <p className="mt-4 text-sm leading-6 text-stone-300/80">
            Use your private passcode to access your dashboard.
          </p>
          {showPreviewHint && (
            <p className="mt-1 text-xs text-stone-400/80">
              Quick preview: use 9999 (default member) or 0000 (go to onboarding).
            </p>
          )}

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
                minLength={4}
                maxLength={8}
                pattern="[A-Za-z0-9]{4,8}"
                autoComplete="one-time-code"
                placeholder="9999"
                className="w-full rounded-2xl border border-white/15 bg-black/25 px-4 py-4 text-center text-lg font-semibold tracking-[0.45em] text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-200/55 focus:ring-2 focus:ring-amber-200/15"
                required
              />
            </div>

            {searchParams?.error && (
              <p className="rounded-2xl border border-[#b03d53]/35 bg-[#2b0c14]/65 px-4 py-3 text-sm text-[#ffced5]">
                {searchParams.error}
              </p>
            )}

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-full border border-amber-200/30 bg-[#7a2040] px-5 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-stone-100 transition hover:bg-[#8a2548]"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}