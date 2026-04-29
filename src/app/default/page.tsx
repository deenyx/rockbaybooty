import Link from 'next/link'

export default function DefaultLandingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050814] px-4 text-stone-100">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-black/35 p-8 text-center shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur-sm">
        <p className="text-[11px] uppercase tracking-[0.2em] text-stone-400">Default Access</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[0.08em]">Welcome</h1>
        <p className="mt-3 text-sm text-stone-300">You entered with default access. Continue to explore the site.</p>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.14em] text-stone-100 transition hover:bg-white/20"
          >
            Open Dashboard
          </Link>
          <Link
            href="/welcome"
            className="inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2 text-xs uppercase tracking-[0.14em] text-stone-300 transition hover:text-stone-100"
          >
            Back To Welcome
          </Link>
        </div>
      </div>
    </main>
  )
}
