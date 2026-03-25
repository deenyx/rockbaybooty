import type { Metadata } from 'next'

import LandingAccessGate from '@/app/_components/landing-access-gate'

const trustSignals = [
  '18+ only',
  'Verified adults only',
  'Discreet & private',
]

const featureCards = [
  {
    eyebrow: 'Discretion',
    title: 'Invite-led access with zero public browsing.',
    body: 'Profiles stay inside the velvet rope. Members arrive by code, not by algorithmic sprawl.',
  },
  {
    eyebrow: 'Chemistry',
    title: 'Honest intent for dating, desire, and connection.',
    body: 'RockBayBooty is built for adults who want clarity, curiosity, and a more elevated social experience.',
  },
  {
    eyebrow: 'Taste',
    title: 'A body-positive atmosphere without the chaos.',
    body: 'Luxurious design, privacy-first defaults, and a community that values respect as much as heat.',
  },
]

const howItWorks = [
  {
    title: 'Receive a member passcode',
    body: 'Every profile begins with a private invite. No open signups, no public waitlist, and no scraped identities.',
  },
  {
    title: 'Complete your discreet onboarding',
    body: 'Share your basics, set your intentions, and build a profile that reflects what you want without oversharing.',
  },
  {
    title: 'Step into a verified adults-only network',
    body: 'Once inside, members connect around chemistry, consent, and private conversation instead of noisy swiping.',
  },
]

export const metadata: Metadata = {
  title: 'Private. Passionate. Yours.',
  description:
    'Exclusive adult social network — invite-only. RockBayBooty is a private, verified adults-only space for discreet dating, chemistry, and connection.',
  keywords: [
    'invite only adult social network',
    'private adult dating',
    'verified adults only',
    'discreet hookup platform',
    'luxury adult community',
  ],
  openGraph: {
    title: 'Private. Passionate. Yours. | RockBayBooty',
    description:
      'Exclusive adult social network — invite-only. Verified adults, discreet profiles, and private connection.',
    siteName: 'RockBayBooty',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Private. Passionate. Yours. | RockBayBooty',
    description:
      'Exclusive adult social network — invite-only. Verified adults, private access, discreet connection.',
  },
}

export default function Home() {
  return (
    <div className="relative isolate overflow-hidden bg-obsidian text-stone-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(173,90,40,0.14),transparent_26%),radial-gradient(circle_at_20%_20%,rgba(122,18,49,0.24),transparent_30%),radial-gradient(circle_at_85%_18%,rgba(212,177,106,0.1),transparent_24%),linear-gradient(180deg,#060304_0%,#120609_46%,#060304_100%)]" />
      <div className="absolute inset-y-0 right-[-14rem] hidden w-[34rem] rounded-full bg-[#6f1536]/20 blur-3xl lg:block" />
      <div className="absolute left-[-10rem] top-32 h-72 w-72 rounded-full bg-[#b7793d]/10 blur-3xl" />

      <main className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 pb-16 pt-8 sm:px-8 lg:px-12 lg:pb-20 lg:pt-10">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-amber-200/70">
              RockBayBooty
            </p>
            <p className="mt-2 text-sm text-stone-400/80">Invite-only adult social network</p>
          </div>

          <div className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.28em] text-stone-300/80 md:block">
            Verified access only
          </div>
        </header>

        <section className="grid flex-1 items-center gap-14 pb-12 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pt-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center rounded-full border border-amber-200/15 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.35em] text-amber-100/75">
              Private memberships for adults who prefer discretion
            </div>

            <h1 className="mt-7 font-[family:var(--font-display)] text-5xl leading-[0.95] text-stone-50 sm:text-6xl lg:text-7xl">
              Private. Passionate. Yours.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-stone-300/82 sm:text-xl">
              Exclusive adult social network — invite-only. Designed for verified adults who want chemistry, candor, and a quieter kind of luxury.
            </p>

            <div className="mt-10">
              <LandingAccessGate />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.24em] text-stone-300/90">
              {trustSignals.map((signal) => (
                <span
                  key={signal}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2"
                >
                  {signal}
                </span>
              ))}
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-3xl font-semibold text-amber-100">Invite</p>
                <p className="mt-2 text-sm leading-6 text-stone-400/80">
                  Access begins with a code from someone already inside.
                </p>
              </div>
              <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-3xl font-semibold text-amber-100">Verify</p>
                <p className="mt-2 text-sm leading-6 text-stone-400/80">
                  Adult-only onboarding keeps the network quieter and more intentional.
                </p>
              </div>
              <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-3xl font-semibold text-amber-100">Connect</p>
                <p className="mt-2 text-sm leading-6 text-stone-400/80">
                  Meet people who value chemistry, privacy, and directness.
                </p>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[32rem]">
            <div className="absolute inset-0 rounded-[2.25rem] bg-gradient-to-br from-[#7e1b3d]/28 via-transparent to-[#d4b16a]/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#160b0e]/85 p-5 shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur-sm sm:p-7">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-[0.22]"
                style={{
                  backgroundImage:
                    "linear-gradient(180deg, rgba(10, 5, 6, 0.2), rgba(10, 5, 6, 0.72)), url('/welcome.png')",
                }}
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_28%),radial-gradient(circle_at_bottom,rgba(126,27,61,0.34),transparent_42%)]" />
              <div className="absolute -left-10 bottom-6 h-56 w-56 rounded-full bg-[#7e1b3d]/30 blur-3xl" />
              <div className="absolute right-0 top-10 h-40 w-40 rounded-full border border-amber-100/10 bg-white/[0.04] blur-[1px]" />
              <div className="absolute left-1/2 top-20 h-20 w-16 -translate-x-1/2 rounded-full border border-amber-100/20 bg-white/[0.05]" />
              <div className="absolute left-1/2 top-36 h-[52%] w-[42%] -translate-x-1/2 rounded-[44%] border border-white/10 bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-transparent shadow-[0_0_60px_rgba(126,27,61,0.3)]" />
              <div className="absolute left-[18%] top-[38%] h-36 w-16 -rotate-[18deg] rounded-full border border-white/10 bg-white/[0.03]" />
              <div className="absolute right-[18%] top-[38%] h-36 w-16 rotate-[18deg] rounded-full border border-white/10 bg-white/[0.03]" />

              <div className="relative z-10 flex min-h-[34rem] flex-col justify-between">
                <div className="flex items-start justify-between gap-4">
                  <div className="rounded-full border border-white/10 bg-black/25 px-4 py-2 text-xs uppercase tracking-[0.3em] text-stone-200/75 backdrop-blur-sm">
                    Body-positive by design
                  </div>
                  <div className="rounded-full border border-amber-200/20 bg-amber-100/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-amber-100/80 backdrop-blur-sm animate-float-slow">
                    Tasteful & SFW
                  </div>
                </div>

                <div className="self-end max-w-xs rounded-[1.75rem] border border-white/10 bg-black/35 p-5 backdrop-blur-md">
                  <p className="text-xs uppercase tracking-[0.32em] text-amber-200/70">Inside the room</p>
                  <p className="mt-3 font-[family:var(--font-display)] text-3xl leading-tight text-stone-50">
                    Velvet-rope privacy with an after-hours pulse.
                  </p>
                  <p className="mt-4 text-sm leading-6 text-stone-300/78">
                    Curated introductions, private profiles, and a grown-up atmosphere for desire, conversation, and chemistry.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          {featureCards.map((card) => (
            <article
              key={card.title}
              className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-200/70">
                {card.eyebrow}
              </p>
              <h2 className="mt-4 font-[family:var(--font-display)] text-3xl leading-tight text-stone-100">
                {card.title}
              </h2>
              <p className="mt-4 text-sm leading-7 text-stone-300/78">{card.body}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.36em] text-amber-200/70">Members expect</p>
            <p className="mt-5 font-[family:var(--font-display)] text-4xl leading-tight text-stone-100 sm:text-5xl">
              Consent-minded, direct, and discreet.
            </p>
            <p className="mt-5 max-w-xl text-base leading-8 text-stone-300/80">
              The tone is intimate without being tacky. Privacy comes first, invitations stay private, and the first impression is built for adults who know what they want.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#12080a]/80 p-6 shadow-[0_24px_90px_rgba(0,0,0,0.35)] sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.36em] text-amber-200/70">How it works</p>
                <h2 className="mt-3 font-[family:var(--font-display)] text-4xl leading-tight text-stone-100">
                  Private entry, then intentional onboarding.
                </h2>
              </div>
            </div>

            <div className="mt-8 divide-y divide-white/10">
              {howItWorks.map((item, index) => (
                <details key={item.title} className="group py-5" open={index === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-left text-lg font-medium text-stone-100 marker:content-none">
                    <span>{item.title}</span>
                    <span className="text-2xl text-amber-200/70 transition duration-300 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-4 max-w-2xl pr-6 text-sm leading-7 text-stone-300/78">{item.body}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
