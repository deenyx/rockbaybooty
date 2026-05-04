// Runs once when the Next.js server process starts, before any requests are
// handled. Use this to fail fast on missing or invalid configuration so the
// process crashes with a clear message instead of at the first request.

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const required: string[] = ['DATABASE_URL', 'JWT_SECRET']
    const missing = required.filter((key) => !process.env[key])

    if (missing.length > 0) {
      throw new Error(
        `Server startup failed — missing required environment variables: ${missing.join(', ')}.\n` +
          'Copy .env.example to .env.production and fill in all required values.'
      )
    }

    if ((process.env.JWT_SECRET?.length ?? 0) < 32) {
      throw new Error(
        'Server startup failed — JWT_SECRET must be at least 32 characters long.'
      )
    }
  }
}
