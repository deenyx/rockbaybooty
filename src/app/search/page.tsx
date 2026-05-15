'use client'

import MemberLayout from '@/app/_layouts/member-layout'
import SearchPageClient from './_components/search-client'

export default function SearchPage() {
  return (
    <MemberLayout>
      <SearchPageClient initialResults={[]} />
    </MemberLayout>
  )
}
