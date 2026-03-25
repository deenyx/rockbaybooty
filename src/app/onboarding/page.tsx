'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'

import { checkUsernameAvailability, onboard, validatePasscode } from '@/lib/api'
import {
  GENDER_OPTIONS,
  INTEREST_TAG_OPTIONS,
  LOOKING_FOR_OPTIONS,
  MESSAGES,
  MIN_AGE,
  ORIENTATION_OPTIONS,
  ROUTES,
} from '@/lib/constants'

type StepConfig = {
  key: string
  title: string
  subtitle: string
}

type OnboardingFormData = {
  dateOfBirth: string
  displayName: string
  username: string
  city: string
  state: string
  country: string
  gender: string
  genderOther: string
  sexualOrientation: string
  orientationOther: string
  lookingFor: string[]
  bio: string
  interests: string[]
  profilePhoto: string
}

const STEPS: StepConfig[] = [
  {
    key: 'welcome',
    title: 'Welcome',
    subtitle: 'Your date of birth helps us keep this space 19+ only.',
  },
  {
    key: 'about-you',
    title: 'About You',
    subtitle: 'Choose a display name and a unique User ID.',
  },
  {
    key: 'location',
    title: 'Location',
    subtitle: 'Tell us where you are so we can tailor your experience.',
  },
  {
    key: 'identity',
    title: 'Identity',
    subtitle: 'Share what feels right. You can keep things private later.',
  },
  {
    key: 'preferences',
    title: 'Preferences',
    subtitle: 'What are you here for right now?',
  },
  {
    key: 'desires',
    title: 'Desires',
    subtitle: 'Write a short vibe check and pick tags if you want.',
  },
  {
    key: 'photo',
    title: 'Photo',
    subtitle: 'Add one profile photo to complete your first impression.',
  },
  {
    key: 'review',
    title: 'Review',
    subtitle: 'Confirm your profile details and create your account.',
  },
]

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/
const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024

const initialFormData: OnboardingFormData = {
  dateOfBirth: '',
  displayName: '',
  username: '',
  city: '',
  state: '',
  country: '',
  gender: '',
  genderOther: '',
  sexualOrientation: '',
  orientationOther: '',
  lookingFor: [],
  bio: '',
  interests: [],
  profilePhoto: '',
}

function getAgeFromDob(value: string): number {
  const dob = new Date(`${value}T00:00:00.000Z`)
  const now = new Date()
  let age = now.getFullYear() - dob.getUTCFullYear()
  const monthDiff = now.getMonth() - dob.getUTCMonth()
  const dayDiff = now.getDate() - dob.getUTCDate()

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1
  }

  return age
}

function isAtLeastMinimumAge(dateOfBirth: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    return false
  }

  const age = getAgeFromDob(dateOfBirth)
  return Number.isFinite(age) && age >= MIN_AGE
}

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const passcode = searchParams.get('passcode')
  const prefilledDob = searchParams.get('dob')

  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<OnboardingFormData>(initialFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  const [generatedPasscode, setGeneratedPasscode] = useState('')
  const [customInterestInput, setCustomInterestInput] = useState('')
  const [usernameState, setUsernameState] = useState<
    'idle' | 'checking' | 'available' | 'taken' | 'invalid'
  >('idle')
  const [inviteState, setInviteState] = useState<'checking' | 'valid' | 'invalid'>('checking')
  const [inviteMessage, setInviteMessage] = useState('Verifying your invite passcode...')

  const currentStepConfig = STEPS[currentStep]
  const progress = ((currentStep + 1) / STEPS.length) * 100

  const canGoBack = currentStep > 0 && !isLoading && !generatedPasscode
  const nextButtonLabel = currentStep === STEPS.length - 1 ? 'Create My Profile' : 'Continue'

  const reviewLocation = useMemo(
    () => [formData.city, formData.state, formData.country].filter(Boolean).join(', '),
    [formData.city, formData.state, formData.country]
  )

  useEffect(() => {
    let isMounted = true

    const verifyInvite = async () => {
      if (!passcode) {
        if (isMounted) {
          setInviteState('invalid')
          setInviteMessage(MESSAGES.PASSCODE_GATE_INVALID)
        }
        return
      }

      try {
        await validatePasscode(passcode)

        if (isMounted) {
          setInviteState('valid')
          setInviteMessage('Invite verified. Continue your profile setup below.')
        }
      } catch (error) {
        if (isMounted) {
          setInviteState('invalid')
          setInviteMessage(
            error instanceof Error && error.message
              ? error.message
              : MESSAGES.PASSCODE_GATE_INVALID
          )
        }
      }
    }

    verifyInvite()

    return () => {
      isMounted = false
    }
  }, [passcode])

  useEffect(() => {
    if (!prefilledDob || !/^\d{4}-\d{2}-\d{2}$/.test(prefilledDob)) {
      return
    }

    setFormData((previousData) => {
      if (previousData.dateOfBirth) {
        return previousData
      }

      return {
        ...previousData,
        dateOfBirth: prefilledDob,
      }
    })
  }, [prefilledDob])

  useEffect(() => {
    const username = formData.username.trim().toLowerCase()
    if (currentStep !== 1) {
      return
    }

    if (!username) {
      setUsernameState('idle')
      return
    }

    if (!USERNAME_REGEX.test(username)) {
      setUsernameState('invalid')
      return
    }

    setUsernameState('checking')
    const timeout = setTimeout(async () => {
      try {
        const response = await checkUsernameAvailability(username)
        setUsernameState(response.available ? 'available' : 'taken')
      } catch {
        setUsernameState('invalid')
      }
    }, 400)

    return () => clearTimeout(timeout)
  }, [currentStep, formData.username])

  const setFieldValue = <K extends keyof OnboardingFormData>(
    key: K,
    value: OnboardingFormData[K]
  ) => {
    setFormData((previous) => ({
      ...previous,
      [key]: value,
    }))

    if (errors[key]) {
      setErrors((previous) => ({
        ...previous,
        [key]: '',
      }))
    }

    if (errors.submit) {
      setErrors((previous) => ({
        ...previous,
        submit: '',
      }))
    }
  }

  const validateStep = (stepIndex: number): boolean => {
    const nextErrors: Record<string, string> = {}

    if (stepIndex === 0) {
      if (!formData.dateOfBirth) {
        nextErrors.dateOfBirth = 'Date of birth is required'
      } else if (!isAtLeastMinimumAge(formData.dateOfBirth)) {
        nextErrors.dateOfBirth = `You must be at least ${MIN_AGE} years old`
      }
    }

    if (stepIndex === 1) {
      if (!formData.displayName.trim()) {
        nextErrors.displayName = 'Display name is required'
      }

      if (!formData.username.trim()) {
        nextErrors.username = 'User ID is required'
      } else if (!USERNAME_REGEX.test(formData.username.trim())) {
        nextErrors.username = MESSAGES.INVALID_USER_ID
      } else if (usernameState === 'taken') {
        nextErrors.username = MESSAGES.USERNAME_EXISTS
      } else if (usernameState === 'checking') {
        nextErrors.username = 'Checking User ID availability...'
      }
    }

    if (stepIndex === 2) {
      if (!formData.city.trim()) {
        nextErrors.city = 'City is required'
      }
    }

    if (stepIndex === 3) {
      if (!formData.gender) {
        nextErrors.gender = 'Please select your gender'
      }
      if (formData.gender === 'Other' && !formData.genderOther.trim()) {
        nextErrors.genderOther = 'Please tell us how you identify'
      }

      if (!formData.sexualOrientation) {
        nextErrors.sexualOrientation = 'Please select your sexual orientation'
      }
      if (
        formData.sexualOrientation === 'Other' &&
        !formData.orientationOther.trim()
      ) {
        nextErrors.orientationOther = 'Please provide your orientation'
      }
    }

    if (stepIndex === 4 && formData.lookingFor.length === 0) {
      nextErrors.lookingFor = 'Select at least one option'
    }

    if (stepIndex === 6 && !formData.profilePhoto) {
      nextErrors.profilePhoto = 'Please upload a profile photo'
    }

    setErrors((previous) => ({
      ...previous,
      ...nextErrors,
    }))

    return Object.keys(nextErrors).length === 0
  }

  const handleAddCustomInterest = () => {
    const tag = customInterestInput.trim()
    if (!tag) {
      return
    }

    if (!formData.interests.includes(tag)) {
      setFieldValue('interests', [...formData.interests, tag])
    }

    setCustomInterestInput('')
  }

  const toggleLookingFor = (option: string) => {
    const isSelected = formData.lookingFor.includes(option)
    const nextValues = isSelected
      ? formData.lookingFor.filter((item) => item !== option)
      : [...formData.lookingFor, option]
    setFieldValue('lookingFor', nextValues)
  }

  const toggleInterest = (tag: string) => {
    const isSelected = formData.interests.includes(tag)
    const nextValues = isSelected
      ? formData.interests.filter((item) => item !== tag)
      : [...formData.interests, tag]
    setFieldValue('interests', nextValues)
  }

  const handlePhotoUpload = async (file: File | undefined) => {
    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      setErrors((previous) => ({
        ...previous,
        profilePhoto: 'Please upload an image file',
      }))
      return
    }

    if (file.size > MAX_PROFILE_PHOTO_BYTES) {
      setErrors((previous) => ({
        ...previous,
        profilePhoto: 'Profile photo must be 5MB or smaller',
      }))
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFieldValue('profilePhoto', reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      return
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!passcode) {
      setErrors({ submit: MESSAGES.PASSCODE_REQUIRED })
      return
    }

    setIsLoading(true)
    try {
      const response = await onboard({
        passcode,
        dateOfBirth: formData.dateOfBirth,
        displayName: formData.displayName.trim(),
        username: formData.username.trim().toLowerCase(),
        city: formData.city.trim(),
        state: formData.state.trim() || undefined,
        country: formData.country.trim() || undefined,
        gender: formData.gender,
        genderOther: formData.genderOther.trim() || undefined,
        sexualOrientation: formData.sexualOrientation,
        orientationOther: formData.orientationOther.trim() || undefined,
        lookingFor: formData.lookingFor,
        bio: formData.bio.trim() || undefined,
        interests: formData.interests,
        profilePhoto: formData.profilePhoto || undefined,
      })

      setGeneratedPasscode(response.personalCode)
      setTimeout(() => {
        router.push('/dashboard')
      }, 6000)
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : MESSAGES.ERROR_CREATING_ACCOUNT,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyPasscode = async () => {
    if (!generatedPasscode) {
      return
    }

    setIsCopying(true)
    await navigator.clipboard.writeText(generatedPasscode)
    setTimeout(() => setIsCopying(false), 1200)
  }

  const renderStep = () => {
    if (currentStep === 0) {
      return (
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-slate-700">Date of birth</label>
          <input
            type="date"
            max={new Date().toISOString().split('T')[0]}
            value={formData.dateOfBirth}
            onChange={(event) => setFieldValue('dateOfBirth', event.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-[#8c1f43] focus:ring-2 focus:ring-[#d4b16a]/35"
          />
          <p className="text-xs text-slate-500">You must be at least {MIN_AGE} years old.</p>
          {errors.dateOfBirth && <p className="text-sm text-red-500">{errors.dateOfBirth}</p>}
        </div>
      )
    }

    if (currentStep === 1) {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700">Display name</label>
            <input
              type="text"
              placeholder="How should people see you?"
              value={formData.displayName}
              onChange={(event) => setFieldValue('displayName', event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-[#8c1f43] focus:ring-2 focus:ring-[#d4b16a]/35"
            />
            {errors.displayName && <p className="mt-2 text-sm text-red-500">{errors.displayName}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">User ID</label>
            <input
              type="text"
              placeholder="unique_id"
              value={formData.username}
              onChange={(event) => setFieldValue('username', event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-[#8c1f43] focus:ring-2 focus:ring-[#d4b16a]/35"
            />
            <p className="mt-2 text-xs text-slate-500">3-20 chars, letters, numbers, underscores.</p>
            {usernameState === 'checking' && <p className="mt-2 text-sm text-amber-600">Checking availability...</p>}
            {usernameState === 'available' && <p className="mt-2 text-sm text-emerald-600">Looks good. User ID is available.</p>}
            {usernameState === 'taken' && <p className="mt-2 text-sm text-red-500">{MESSAGES.USERNAME_EXISTS}</p>}
            {errors.username && <p className="mt-2 text-sm text-red-500">{errors.username}</p>}
          </div>
        </div>
      )
    }

    if (currentStep === 2) {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700">City</label>
            <input
              type="text"
              placeholder="Start typing your city..."
              value={formData.city}
              onChange={(event) => setFieldValue('city', event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-[#8c1f43] focus:ring-2 focus:ring-[#d4b16a]/35"
            />
            {errors.city && <p className="mt-2 text-sm text-red-500">{errors.city}</p>}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="text"
              placeholder="State / Region (optional)"
              value={formData.state}
              onChange={(event) => setFieldValue('state', event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-[#8c1f43] focus:ring-2 focus:ring-[#d4b16a]/35"
            />
            <input
              type="text"
              placeholder="Country (optional)"
              value={formData.country}
              onChange={(event) => setFieldValue('country', event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-[#8c1f43] focus:ring-2 focus:ring-[#d4b16a]/35"
            />
          </div>
        </div>
      )
    }

    if (currentStep === 3) {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700">Gender</label>
            <select
              value={formData.gender}
              onChange={(event) => setFieldValue('gender', event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-[#8c1f43] focus:ring-2 focus:ring-[#d4b16a]/35"
            >
              <option value="">Select your gender</option>
              {GENDER_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.gender && <p className="mt-2 text-sm text-red-500">{errors.gender}</p>}
          </div>

          {formData.gender === 'Other' && (
            <div>
              <input
                type="text"
                placeholder="How do you identify?"
                value={formData.genderOther}
                onChange={(event) => setFieldValue('genderOther', event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-[#8c1f43] focus:ring-2 focus:ring-[#d4b16a]/35"
              />
              {errors.genderOther && <p className="mt-2 text-sm text-red-500">{errors.genderOther}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700">Sexual orientation</label>
            <select
              value={formData.sexualOrientation}
              onChange={(event) => setFieldValue('sexualOrientation', event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-[#8c1f43] focus:ring-2 focus:ring-[#d4b16a]/35"
            >
              <option value="">Select your orientation</option>
              {ORIENTATION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.sexualOrientation && <p className="mt-2 text-sm text-red-500">{errors.sexualOrientation}</p>}
          </div>

          {formData.sexualOrientation === 'Other' && (
            <div>
              <input
                type="text"
                placeholder="How would you describe it?"
                value={formData.orientationOther}
                onChange={(event) => setFieldValue('orientationOther', event.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-[#8c1f43] focus:ring-2 focus:ring-[#d4b16a]/35"
              />
              {errors.orientationOther && <p className="mt-2 text-sm text-red-500">{errors.orientationOther}</p>}
            </div>
          )}
        </div>
      )
    }

    if (currentStep === 4) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Choose as many as you want.</p>
          <div className="flex flex-wrap gap-2">
            {LOOKING_FOR_OPTIONS.map((option) => {
              const isSelected = formData.lookingFor.includes(option)
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggleLookingFor(option)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                    isSelected
                      ? 'border-[#8c1f43] bg-[#f9e6d6] text-[#6d102e]'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-[#b7793d] hover:text-[#8c1f43]'
                  }`}
                >
                  {option}
                </button>
              )
            })}
          </div>
          {errors.lookingFor && <p className="text-sm text-red-500">{errors.lookingFor}</p>}
        </div>
      )
    }

    if (currentStep === 5) {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700">About me / Desires</label>
            <textarea
              value={formData.bio}
              onChange={(event) => setFieldValue('bio', event.target.value)}
              placeholder="Share your vibe, boundaries, and what you want to discover..."
              className="mt-2 min-h-32 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-[#8c1f43] focus:ring-2 focus:ring-[#d4b16a]/35"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700">Interest tags (optional)</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {INTEREST_TAG_OPTIONS.map((tag) => {
                const isSelected = formData.interests.includes(tag)
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleInterest(tag)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      isSelected
                        ? 'border-[#6d102e] bg-[#6d102e] text-amber-50'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-[#8c1f43]'
                    }`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={customInterestInput}
              onChange={(event) => setCustomInterestInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  handleAddCustomInterest()
                }
              }}
              placeholder="Add custom tag"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#8c1f43] focus:ring-2 focus:ring-[#d4b16a]/35"
            />
            <button
              type="button"
              onClick={handleAddCustomInterest}
              className="rounded-xl bg-gradient-to-r from-[#8c1f43] via-[#a0354f] to-[#6d102e] px-4 py-2.5 text-sm font-semibold text-amber-50"
            >
              Add
            </button>
          </div>
        </div>
      )
    }

    if (currentStep === 6) {
      return (
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-slate-700">Upload profile photo</label>
          <div className="rounded-2xl border border-dashed border-slate-300 p-4">
            <input
              type="file"
              accept="image/*"
              onChange={(event) => handlePhotoUpload(event.target.files?.[0])}
              className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-amber-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-amber-800 hover:file:bg-amber-200"
            />
            <p className="mt-2 text-xs text-slate-500">One image only, maximum 5MB.</p>
          </div>

          {formData.profilePhoto && (
            <img
              src={formData.profilePhoto}
              alt="Profile preview"
              className="h-52 w-full rounded-2xl object-cover shadow"
            />
          )}
          {errors.profilePhoto && <p className="text-sm text-red-500">{errors.profilePhoto}</p>}
        </div>
      )
    }

    return (
      <div className="space-y-5 text-sm text-slate-700">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="font-semibold text-slate-900">{formData.displayName}</p>
          <p>@{formData.username.trim().toLowerCase()}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Age</p>
            <p className="mt-1 font-medium text-slate-900">{getAgeFromDob(formData.dateOfBirth)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Location</p>
            <p className="mt-1 font-medium text-slate-900">{reviewLocation || 'Not provided'}</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Looking for</p>
          <p className="mt-1 font-medium text-slate-900">{formData.lookingFor.join(', ')}</p>
        </div>

        <div className="rounded-xl border border-slate-200 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">About me / Desires</p>
          <p className="mt-1 whitespace-pre-wrap text-slate-900">{formData.bio || 'No description added'}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: `linear-gradient(130deg, rgba(6, 3, 4, 0.9) 0%, rgba(26, 8, 13, 0.88) 46%, rgba(58, 14, 29, 0.82) 100%), url('/onboard1.png')`,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Header */}
      <div className="border-b border-white/10 bg-black/25 backdrop-blur-md">
        <div className="max-w-md mx-auto px-4 py-6">
          <h1 className="mb-3 text-2xl font-semibold text-white">Your Private Interview</h1>
          <p className="mb-4 text-sm text-stone-200/80">A few intentional steps and your profile is live.</p>

          <div
            className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
              inviteState === 'valid'
                ? 'border-amber-200/35 bg-amber-200/12 text-amber-100'
                : inviteState === 'invalid'
                  ? 'border-[#b86a7b]/40 bg-[#5f1e30]/45 text-rose-100'
                  : 'border-amber-100/30 bg-white/10 text-amber-50'
            }`}
          >
            <p className="flex items-center gap-2">
              {inviteState === 'checking' && (
                <span className="h-3.5 w-3.5 rounded-full border-2 border-amber-200/40 border-t-amber-100 animate-spin" />
              )}
              <span>{inviteMessage}</span>
            </p>
          </div>

          <div className="h-2 w-full rounded-full bg-white/15">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-[#b7793d] via-[#d8bc7a] to-[#b7793d] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-1 text-[10px] text-white/70 sm:grid-cols-8">
            {STEPS.map((step, index) => (
              <span
                key={step.key}
                className={`truncate rounded px-1.5 py-1 ${
                  index === currentStep
                    ? 'bg-amber-100/25 text-amber-50'
                    : index < currentStep
                      ? 'bg-amber-200/20 text-amber-100'
                      : 'bg-white/10 text-stone-300/80'
                }`}
              >
                {step.title}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-md mx-auto px-4 py-12">
        {inviteState === 'invalid' ? (
          <div className="rounded-2xl border border-[#a85f72]/35 bg-[#160c0f]/90 p-8 text-center shadow-2xl">
            <h2 className="text-xl font-semibold text-rose-100">Invite required</h2>
            <p className="mt-3 text-sm text-rose-100/80">{inviteMessage}</p>
            <button
              onClick={() => router.push(ROUTES.HOME)}
              className="mt-6 inline-flex items-center justify-center rounded-xl border border-amber-200/25 bg-gradient-to-r from-[#8c1f43] via-[#a0354f] to-[#6d102e] px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.18em] text-amber-50 transition hover:brightness-110"
            >
              Return to landing page
            </button>
          </div>
        ) : inviteState === 'checking' ? (
          <div className="rounded-2xl border border-white/15 bg-[#130b0e]/85 p-8 text-center shadow-2xl">
            <div className="mx-auto h-7 w-7 rounded-full border-2 border-amber-100/35 border-t-amber-100 animate-spin" />
            <p className="mt-4 text-stone-200/85">Checking your invite access...</p>
          </div>
        ) : generatedPasscode ? (
          <div className="rounded-2xl border border-amber-100/20 bg-[#130c0e]/92 p-8 text-center shadow-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-200/80">Profile Created</p>
            <h2 className="mt-2 text-2xl font-bold text-stone-100">Your Personal Passcode</h2>
            <p className="mt-2 text-sm text-stone-300/80">Save this - it's your login key forever.</p>

            <div className="mt-6 rounded-2xl border border-dashed border-amber-200/35 bg-amber-100/10 p-5">
              <p className="text-4xl font-black tracking-[0.15em] text-amber-100">{generatedPasscode}</p>
            </div>

            <button
              type="button"
              onClick={handleCopyPasscode}
              className="mt-5 rounded-xl border border-white/15 bg-black/35 px-5 py-3 text-sm font-semibold text-stone-100 transition hover:bg-black/50"
            >
              {isCopying ? 'Copied' : 'Copy Passcode'}
            </button>

            <p className="mt-4 text-xs text-stone-400">Redirecting to dashboard in a few seconds...</p>
          </div>
        ) : (
        <div className="rounded-2xl bg-white p-8 shadow-2xl">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-700">{currentStepConfig.title}</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">{currentStepConfig.subtitle}</h2>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {errors.submit && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              {errors.submit}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleBack}
              disabled={!canGoBack}
              className="flex-1 rounded-xl border border-[#8c1f43]/30 px-4 py-2.5 text-sm font-semibold text-[#6d102e] transition hover:bg-[#f9e6d6] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={isLoading || inviteState !== 'valid'}
              className="flex-1 rounded-xl bg-gradient-to-r from-[#8c1f43] via-[#a0354f] to-[#6d102e] px-4 py-2.5 text-sm font-semibold text-amber-50 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? 'Creating profile...' : nextButtonLabel}
            </button>
          </div>
        </div>
        )}

        <p className="text-white text-center text-sm mt-6">
          Step {currentStep + 1} of {STEPS.length}
        </p>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-primary to-secondary"></div>}>
      <OnboardingContent />
    </Suspense>
  )
}
