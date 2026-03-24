// Utility functions for API calls

export async function apiCall(
  endpoint: string,
  options: RequestInit = {}
) {
  const url = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'API call failed')
  }

  return response.json()
}

export async function onboard(data: {
  passcode: string
  email: string
  firstName: string
  lastName: string
  age: string
  gender: string
  location: string
  lookingFor: string
  bio?: string
  interests?: string
}) {
  return apiCall('/api/auth/onboard', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
