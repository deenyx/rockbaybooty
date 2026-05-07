import { Suspense } from 'react'
import ResetPageClient from './reset-page-client'

export default function ResetPage() {
  return (
    <Suspense fallback={null}>
      <ResetPageClient />
    </Suspense>
  )
}
