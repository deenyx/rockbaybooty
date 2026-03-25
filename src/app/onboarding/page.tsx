'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

const ONBOARDING_QUESTIONS = [
  {
    id: 'email',
    label: 'Email Address',
    type: 'email',
    placeholder: 'your@email.com',
    required: true,
  },
  {
    id: 'firstName',
    label: 'First Name',
    type: 'text',
    placeholder: 'John',
    required: true,
  },
  {
    id: 'lastName',
    label: 'Last Name',
    type: 'text',
    placeholder: 'Doe',
    required: true,
  },
  {
    id: 'age',
    label: 'Age',
    type: 'number',
    placeholder: '25',
    required: true,
  },
  {
    id: 'gender',
    label: 'Gender',
    type: 'select',
    options: ['Male', 'Female', 'Non-binary', 'Prefer not to say'],
    required: true,
  },
  {
    id: 'location',
    label: 'Location (City, State/Country)',
    type: 'text',
    placeholder: 'New York, NY',
    required: true,
  },
  {
    id: 'lookingFor',
    label: 'What are you looking for?',
    type: 'select',
    options: ['Dating', 'Hookups', 'Friends', 'Networking', 'Not Sure'],
    required: true,
  },
  {
    id: 'bio',
    label: 'Tell us about yourself (optional bio)',
    type: 'textarea',
    placeholder: 'Share a bit about who you are...',
    required: false,
  },
  {
    id: 'interests',
    label: 'Interests (comma-separated)',
    type: 'text',
    placeholder: 'travel, music, fitness, photography',
    required: false,
  },
]

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const passcode = searchParams.get('passcode')

  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const currentQuestion = ONBOARDING_QUESTIONS[currentStep]
  const progress = ((currentStep + 1) / ONBOARDING_QUESTIONS.length) * 100

  const handleInputChange = (value: string) => {
    setFormData({
      ...formData,
      [currentQuestion.id]: value,
    })
    // Clear error when user starts typing
    if (errors[currentQuestion.id]) {
      setErrors({
        ...errors,
        [currentQuestion.id]: '',
      })
    }
  }

  const validateCurrentStep = () => {
    if (
      currentQuestion.required &&
      !formData[currentQuestion.id]?.trim()
    ) {
      setErrors({
        [currentQuestion.id]: 'This field is required',
      })
      return false
    }

    if (currentQuestion.id === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData[currentQuestion.id])) {
        setErrors({
          [currentQuestion.id]: 'Please enter a valid email',
        })
        return false
      }
    }

    return true
  }

  const handleNext = () => {
    if (!validateCurrentStep()) return

    if (currentStep < ONBOARDING_QUESTIONS.length - 1) {
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
    setIsLoading(true)
    try {
      // TODO: Submit to API
      const response = await fetch('/api/auth/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passcode,
          ...formData,
        }),
      })

      if (response.ok) {
        router.push('/dashboard')
      } else {
        setErrors({ submit: 'Failed to create account. Please try again.' })
      }
    } catch (error) {
      setErrors({ submit: 'An error occurred. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(61, 10, 79, 0.85) 50%, rgba(26, 10, 46, 0.85) 100%), url('/onboard1.png')`,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-md mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-white mb-4">Create Your Profile</h1>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-white/70 text-sm mt-2">
            Step {currentStep + 1} of {ONBOARDING_QUESTIONS.length}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-900 mb-3">
              {currentQuestion.label}
            </label>

            {currentQuestion.type === 'text' || currentQuestion.type === 'email' || currentQuestion.type === 'number' ? (
              <input
                type={currentQuestion.type}
                placeholder={currentQuestion.placeholder}
                value={formData[currentQuestion.id] || ''}
                onChange={(e) => handleInputChange(e.target.value)}
                className={`input-field ${
                  errors[currentQuestion.id] ? 'border-red-500' : ''
                }`}
              />
            ) : currentQuestion.type === 'textarea' ? (
              <textarea
                placeholder={currentQuestion.placeholder}
                value={formData[currentQuestion.id] || ''}
                onChange={(e) => handleInputChange(e.target.value)}
                className={`input-field min-h-24 resize-none ${
                  errors[currentQuestion.id] ? 'border-red-500' : ''
                }`}
              />
            ) : currentQuestion.type === 'select' ? (
              <select
                value={formData[currentQuestion.id] || ''}
                onChange={(e) => handleInputChange(e.target.value)}
                className={`input-field ${
                  errors[currentQuestion.id] ? 'border-red-500' : ''
                }`}
              >
                <option value="">Select an option...</option>
                {currentQuestion.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : null}

            {errors[currentQuestion.id] && (
              <p className="text-red-500 text-sm mt-2">{errors[currentQuestion.id]}</p>
            )}
          </div>

          {errors.submit && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              {errors.submit}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex-1 btn btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={isLoading}
              className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Account...' : currentStep === ONBOARDING_QUESTIONS.length - 1 ? 'Complete' : 'Next'}
            </button>
          </div>
        </div>

        <p className="text-white text-center text-sm mt-6">
          Step {currentStep + 1} of {ONBOARDING_QUESTIONS.length}
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
