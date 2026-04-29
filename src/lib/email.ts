import nodemailer from 'nodemailer'

const SMTP_USER = process.env.SMTP_USER || process.env.EMAIL_USER
const SMTP_PASS = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth:
    SMTP_USER && SMTP_PASS
      ? {
          user: SMTP_USER,
          pass: SMTP_PASS,
        }
      : undefined,
})

const FROM = process.env.SMTP_FROM || SMTP_USER || 'noreply@rockbaybooty.com'
const SITE_NAME = 'RockBayBooty'

function getBaseUrl() {
  const rawCandidates = [
    process.env.NEXT_PUBLIC_API_URL,
    process.env.APP_URL,
    process.env.NEXTAUTH_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ]

  for (const candidate of rawCandidates) {
    const value = candidate?.trim()
    if (!value) {
      continue
    }

    if (/^https?:\/\//i.test(value)) {
      return value.replace(/\/$/, '')
    }
  }

  return 'http://localhost:3000'
}

export async function sendVerificationEmail(to: string, firstName: string, token: string) {
  const base = getBaseUrl()
  const link = `${base}/api/auth/verify-email?token=${token}`

  if (!SMTP_USER || !SMTP_PASS) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[sendVerificationEmail] SMTP credentials not configured. Verification link:', link)
      return
    }

    throw new Error('Email service is not configured')
  }

  await transporter.sendMail({
    from: `${SITE_NAME} <${FROM}>`,
    to,
    subject: `Verify your email — ${SITE_NAME}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0d0a0b;color:#f5f5f4;border-radius:12px;">
        <h2 style="color:#f9a8d4;margin-bottom:8px;">Welcome, ${firstName}</h2>
        <p style="color:#a8a29e;font-size:14px;">Click below to verify your email and receive your private login PIN.</p>
        <a href="${link}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:linear-gradient(135deg,#be185d,#9f1239);color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Verify my email</a>
        <p style="color:#57534e;font-size:12px;">This link expires in 24 hours. If you didn't sign up, ignore this email.</p>
        <p style="color:#57534e;font-size:12px;">${link}</p>
      </div>
    `,
  })
}

export async function sendLoginAlertEmail(to: string, firstName: string) {
  const now = new Date().toUTCString()

  if (!SMTP_USER || !SMTP_PASS) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[sendLoginAlertEmail] SMTP credentials not configured. Skipping alert email.')
    }
    return
  }

  // Fire and forget — caller should not await this
  transporter.sendMail({
    from: `${SITE_NAME} <${FROM}>`,
    to,
    subject: `New login detected — ${SITE_NAME}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0d0a0b;color:#f5f5f4;border-radius:12px;">
        <h2 style="color:#f9a8d4;margin-bottom:8px;">Hi ${firstName}</h2>
        <p style="color:#a8a29e;font-size:14px;">A new login was detected on your account.</p>
        <p style="color:#78716c;font-size:13px;">Time: ${now}</p>
        <p style="color:#57534e;font-size:12px;">If this wasn't you, contact us immediately.</p>
      </div>
    `,
  }).catch((err: unknown) => console.error('[sendLoginAlertEmail]', err))
}

export async function sendAssignedPinEmail(to: string, firstName: string, pin: string) {
  if (!SMTP_USER || !SMTP_PASS) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[sendAssignedPinEmail] SMTP credentials not configured. Skipping assigned PIN email.')
    }
    return
  }

  await transporter.sendMail({
    from: `${SITE_NAME} <${FROM}>`,
    to,
    subject: `Your login PIN — ${SITE_NAME}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0d0a0b;color:#f5f5f4;border-radius:12px;">
        <h2 style="color:#f9a8d4;margin-bottom:8px;">Hey ${firstName}!</h2>
        <p style="color:#a8a29e;font-size:14px;">Thanks for signing up.</p>
        <p style="color:#a8a29e;font-size:14px;">You can use this PIN to log in:</p>
        <p style="font-family:monospace;font-size:30px;letter-spacing:0.4em;color:#fda4af;margin:16px 0;">${pin}</p>
        <p style="color:#78716c;font-size:12px;">At login, enter your PIN first, then your name.</p>
      </div>
    `,
  })
}

export function sendOnboardingWelcomeEmail(to: string, displayName: string, personalCode: string) {
  if (!SMTP_USER || !SMTP_PASS) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[sendOnboardingWelcomeEmail] SMTP credentials not configured. Skipping onboarding welcome email.')
    }
    return
  }

  transporter.sendMail({
    from: `${SITE_NAME} <${FROM}>`,
    to,
    subject: `Your account is ready — ${SITE_NAME}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0d0a0b;color:#f5f5f4;border-radius:12px;">
        <h2 style="color:#f9a8d4;margin-bottom:8px;">Welcome, ${displayName}</h2>
        <p style="color:#a8a29e;font-size:14px;">Your account is live and ready to use.</p>
        <p style="color:#a8a29e;font-size:14px;">Keep your personal passcode somewhere safe:</p>
        <p style="font-family:monospace;font-size:26px;letter-spacing:0.24em;color:#fda4af;margin:16px 0;">${personalCode}</p>
        <p style="color:#78716c;font-size:12px;">You can use this passcode anywhere the site asks for your personal code.</p>
      </div>
    `,
  }).catch((err: unknown) => console.error('[sendOnboardingWelcomeEmail]', err))
}

export async function sendCredentialResetEmail(to: string, firstName: string, token: string) {
  const base = getBaseUrl()
  const link = `${base}/reset?token=${token}`

  if (!SMTP_USER || !SMTP_PASS) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[sendCredentialResetEmail] SMTP credentials not configured. Reset link:', link)
      return
    }

    throw new Error('Email service is not configured')
  }

  await transporter.sendMail({
    from: `${SITE_NAME} <${FROM}>`,
    to,
    subject: `Reset your login credentials — ${SITE_NAME}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0d0a0b;color:#f5f5f4;border-radius:12px;">
        <h2 style="color:#f9a8d4;margin-bottom:8px;">Hi ${firstName}</h2>
        <p style="color:#a8a29e;font-size:14px;">Use the link below to reset your password and passcode.</p>
        <a href="${link}" style="display:inline-block;margin:24px 0;padding:12px 28px;background:linear-gradient(135deg,#be185d,#9f1239);color:#fff;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Reset credentials</a>
        <p style="color:#57534e;font-size:12px;">This link expires in 60 minutes. If you did not request this, ignore this email.</p>
        <p style="color:#57534e;font-size:12px;word-break:break-all;">${link}</p>
      </div>
    `,
  })
}
