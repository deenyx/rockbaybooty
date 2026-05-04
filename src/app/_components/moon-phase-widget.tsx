'use client'

// Southern hemisphere countries — moon appears visually flipped
const SOUTHERN_COUNTRIES = new Set([
  'Australia', 'New Zealand', 'South Africa', 'Argentina', 'Brazil', 'Chile',
  'Peru', 'Bolivia', 'Uruguay', 'Paraguay', 'Ecuador', 'Colombia', 'Venezuela',
  'Indonesia', 'Papua New Guinea', 'Madagascar', 'Mozambique', 'Tanzania',
  'Kenya', 'Zimbabwe', 'Zambia', 'Angola', 'Namibia', 'Botswana', 'Lesotho',
  'Eswatini', 'Malawi', 'Rwanda', 'Burundi', 'Uganda',
])

function getMoonPhase(date: Date): { phase: number; name: string; illumination: number } {
  // Known new moon: Jan 6, 2000 18:14 UTC — Julian date 2451550.1
  const KNOWN_NEW_MOON_JD = 2451550.1
  const SYNODIC_PERIOD = 29.53059

  const jd =
    367 * date.getFullYear() -
    Math.floor((7 * (date.getFullYear() + Math.floor((date.getMonth() + 10) / 12))) / 4) +
    Math.floor((275 * (date.getMonth() + 1)) / 9) +
    date.getDate() +
    1721013.5 +
    date.getUTCHours() / 24

  const daysSinceNew = (jd - KNOWN_NEW_MOON_JD) % SYNODIC_PERIOD
  const phase = ((daysSinceNew % SYNODIC_PERIOD) + SYNODIC_PERIOD) % SYNODIC_PERIOD
  const normalized = phase / SYNODIC_PERIOD // 0–1

  // Illumination percentage (0 at new, 100 at full)
  const illumination = Math.round(50 * (1 - Math.cos(normalized * 2 * Math.PI)))

  let name: string
  if (normalized < 0.025 || normalized >= 0.975) name = 'New Moon'
  else if (normalized < 0.25) name = 'Waxing Crescent'
  else if (normalized < 0.275) name = 'First Quarter'
  else if (normalized < 0.5) name = 'Waxing Gibbous'
  else if (normalized < 0.525) name = 'Full Moon'
  else if (normalized < 0.75) name = 'Waning Gibbous'
  else if (normalized < 0.775) name = 'Last Quarter'
  else name = 'Waning Crescent'

  return { phase: normalized, name, illumination }
}

/** SVG moon disc using two overlapping ellipses */
function MoonSVG({ phase, flipped }: { phase: number; flipped: boolean }) {
  const SIZE = 64
  const R = SIZE / 2
  // phase 0 = new, 0.5 = full, 1 = new
  // Shadow side rx: at new moon shadow covers all, at full it's gone
  // We render the lit crescent by clipping

  // Determine waxing (0–0.5) or waning (0.5–1)
  const waxing = phase <= 0.5
  // How far through the half-cycle are we? 0=new, 1=full or 0=full, 1=new
  const halfPhase = waxing ? phase * 2 : (phase - 0.5) * 2

  // Inner ellipse x-radius: 0 = full illumination edge (full moon), R = new moon
  const innerRx = R * Math.abs(Math.cos(halfPhase * Math.PI))

  // At waxing: right side lit, shadow ellipse on left facing inward
  // At waning: left side lit, shadow ellipse on right facing inward
  // Inner ellipse is the shadow terminator
  const shadowFacing = waxing ? 1 : -1 // +1 = shadow on left, -1 = shadow on right
  const flip = flipped ? -1 : 1

  const translateX = R
  const translateY = R

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width={SIZE}
      height={SIZE}
      aria-hidden="true"
      style={{ filter: 'drop-shadow(0 0 8px rgba(255,240,180,0.25))' }}
    >
      <defs>
        {/* Clip to outer circle */}
        <clipPath id="moon-clip">
          <circle cx={R} cy={R} r={R - 1} />
        </clipPath>
      </defs>

      {/* Dark side */}
      <circle cx={R} cy={R} r={R - 1} fill="#1c1c2e" />

      {/* Lit crescent/gibbous using clipped shapes */}
      <g clipPath="url(#moon-clip)">
        {/* Full light disc */}
        <circle cx={R} cy={R} r={R - 1} fill="#f5e9c8" />

        {/* Shadow overlay: ellipse covering the dark portion */}
        <ellipse
          cx={R + shadowFacing * flip * innerRx}
          cy={R}
          rx={innerRx}
          ry={R - 1}
          fill="#1c1c2e"
        />
      </g>

      {/* Rim */}
      <circle cx={R} cy={R} r={R - 1} fill="none" stroke="rgba(255,240,180,0.12)" strokeWidth="1" />
    </svg>
  )
}

export default function MoonPhaseWidget({ country }: { country: string | null }) {
  const now = new Date()
  const { phase, name, illumination } = getMoonPhase(now)
  const flipped = country ? SOUTHERN_COUNTRIES.has(country) : false

  const dayOfCycle = Math.round(phase * 29.53)

  const nextFull = phase < 0.5
    ? Math.round((0.5 - phase) * 29.53)
    : Math.round((1.5 - phase) * 29.53)

  const nextNew = phase < 1
    ? Math.round((1 - phase) * 29.53)
    : 0

  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5 backdrop-blur-xl">
      <p className="mb-4 text-[10px] uppercase tracking-[0.22em] text-stone-500">Moon phase</p>

      <div className="flex items-center gap-5">
        <MoonSVG phase={phase} flipped={flipped} />

        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-base font-medium text-stone-100">{name}</p>
          <p className="text-xs text-stone-400">{illumination}% illuminated · day {dayOfCycle} of 29</p>
          <div className="mt-2 flex gap-4 text-[11px] text-stone-500">
            {phase < 0.5 ? (
              <span>Full moon in <span className="text-stone-300">{nextFull}d</span></span>
            ) : (
              <span>New moon in <span className="text-stone-300">{nextNew}d</span></span>
            )}
            {flipped && <span className="text-stone-600">· southern hemisphere</span>}
          </div>

          {/* Phase progress bar */}
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-amber-200/60 transition-all"
              style={{ width: `${Math.round(phase * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
