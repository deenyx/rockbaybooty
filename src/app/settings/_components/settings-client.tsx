'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { deleteMyAccount, disableMyAccount, fetchMemberSettings, updateMemberSettings } from '@/lib/api'
import { ROUTES } from '@/lib/constants'
import type { MemberSettings } from '@/lib/types'

type SettingsState = MemberSettings

type ToggleConfig = {
  key: keyof SettingsState
  title: string
  description: string
}

const TOGGLES: ToggleConfig[] = [
  {
    key: 'isPublic',
    title: 'Profile visibility',
    description: 'Allow your profile to appear in member discovery.',
  },
  {
    key: 'allowDirectMessages',
    title: 'Allow direct messages',
    description: 'Let members start direct messages with you.',
  },
  {
    key: 'allowFriendRequests',
    title: 'Allow friend requests',
    description: 'Let members send you friend requests.',
  },
  {
    key: 'showOnlineStatus',
    title: 'Show online status',
    description: 'Show when you are currently online to other members.',
  },
  {
    key: 'emailLoginAlerts',
    title: 'Email login alerts',
    description: 'Send an email alert when your account logs in.',
  },
]

const DEFAULT_SETTINGS: SettingsState = {
  isPublic: false,
  allowDirectMessages: true,
  allowFriendRequests: true,
  showOnlineStatus: true,
  emailLoginAlerts: true,
}

export default function SettingsClient() {
  const router = useRouter()

  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS)
  const [initialSettings, setInitialSettings] = useState<SettingsState>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDisabling, setIsDisabling] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadSettings() {
      try {
        const response = await fetchMemberSettings()

        if (!mounted) {
          return
        }

        setSettings(response.settings)
        setInitialSettings(response.settings)
      } catch (fetchError) {
        if (!mounted) {
          return
        }

        const nextError = fetchError instanceof Error ? fetchError.message : 'Unable to load settings.'
        setError(nextError)
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    void loadSettings()

    return () => {
      mounted = false
    }
  }, [])

  const hasChanges = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(initialSettings)
  }, [settings, initialSettings])

  const handleToggle = (key: keyof SettingsState) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))

    setError('')
    setMessage('')
  }

  const handleSave = async () => {
    if (!hasChanges || isSaving) {
      return
    }

    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      const response = await updateMemberSettings(settings)
      setSettings(response.settings)
      setInitialSettings(response.settings)
      setMessage('Settings saved.')
    } catch (saveError) {
      const nextError = saveError instanceof Error ? saveError.message : 'Unable to save settings.'
      setError(nextError)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDisableAccount = async () => {
    const approved = window.confirm('Disable your account now? You can contact support later to reactivate it.')

    if (!approved || isDisabling || isDeleting) {
      return
    }

    setIsDisabling(true)
    setError('')
    setMessage('')

    try {
      const response = await disableMyAccount()
      setMessage(response.message)
      router.replace(ROUTES.WELCOME)
      router.refresh()
    } catch (disableError) {
      const nextError = disableError instanceof Error ? disableError.message : 'Unable to disable account.'
      setError(nextError)
    } finally {
      setIsDisabling(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt("Type DELETE to permanently mark this account as deleted.")

    if (confirmation !== 'DELETE' || isDisabling || isDeleting) {
      return
    }

    setIsDeleting(true)
    setError('')
    setMessage('')

    try {
      const response = await deleteMyAccount()
      setMessage(response.message)
      router.replace(ROUTES.WELCOME)
      router.refresh()
    } catch (deleteError) {
      const nextError = deleteError instanceof Error ? deleteError.message : 'Unable to delete account.'
      setError(nextError)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#090b10] px-4 py-8 text-stone-100 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat opacity-38"
        style={{ backgroundImage: "url('/3.jpg')" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,11,18,0.7)_0%,rgba(6,8,12,0.84)_100%)]" />

      <div className="relative z-10 mx-auto max-w-4xl space-y-6">
        <section className="rounded-3xl border border-white/10 bg-black/35 p-6 backdrop-blur-xl sm:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-stone-300/80">Settings</p>
          <h1 className="mt-3 font-[family:var(--font-display)] text-4xl text-stone-100 sm:text-5xl">
            Account controls
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-300 sm:text-base">
            Choose how members can interact with your account and what account signals are visible.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={ROUTES.DASHBOARD}
              className="rounded-xl border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-white/35 hover:bg-white/[0.1]"
            >
              Back to dashboard
            </Link>
            <Link
              href={ROUTES.PROFILE}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm text-stone-200 transition hover:border-white/35 hover:bg-white/[0.04] hover:text-white"
            >
              Edit profile
            </Link>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-black/30 p-5 backdrop-blur-xl sm:p-6">
          {isLoading ? (
            <p className="text-sm text-stone-300">Loading your settings...</p>
          ) : (
            <div className="space-y-3">
              {TOGGLES.map((toggle) => (
                <div
                  key={toggle.key}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-stone-100">{toggle.title}</p>
                    <p className="mt-1 text-xs text-stone-400">{toggle.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle(toggle.key)}
                    className={`relative h-7 w-14 rounded-full border transition ${settings[toggle.key]
                      ? 'border-emerald-300/40 bg-emerald-500/35'
                      : 'border-white/20 bg-black/30'
                      }`}
                    aria-pressed={settings[toggle.key]}
                    aria-label={toggle.title}
                  >
                    <span
                      className={`absolute top-1 h-5 w-5 rounded-full bg-stone-100 transition ${settings[toggle.key] ? 'left-8' : 'left-1'
                        }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-xl border border-rose-500/30 bg-rose-900/40 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          )}

          {message && (
            <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-900/30 px-3 py-2 text-sm text-emerald-200">
              {message}
            </p>
          )}

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading || isSaving || !hasChanges}
              className="rounded-xl border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-white/35 hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save settings'}
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-rose-400/20 bg-rose-900/20 p-5 backdrop-blur-xl sm:p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-rose-200/80">Danger zone</p>
          <h2 className="mt-2 text-xl font-semibold text-rose-100">Account status controls</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-rose-100/80">
            Disable account temporarily to lock access, or delete account to mark it as removed from member-facing experiences.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDisableAccount}
              disabled={isDisabling || isDeleting}
              className="rounded-xl border border-rose-300/40 bg-rose-700/25 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:border-rose-200/50 hover:bg-rose-700/35 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDisabling ? 'Disabling...' : 'Disable account'}
            </button>

            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={isDisabling || isDeleting}
              className="rounded-xl border border-rose-300/45 bg-rose-950/45 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:border-rose-200/60 hover:bg-rose-950/60 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete account'}
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
