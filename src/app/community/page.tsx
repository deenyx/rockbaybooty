import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import CommunityHubClient from '@/app/community/_components/community-hub-client'

export const metadata = {
  title: 'Community | RockBayBooty',
  description: 'Discover members, events, and classifieds in the RockBayBooty community',
}

export default async function CommunityPage() {
  const session = await getSession()
  if (!session?.user?.id) {
    redirect('/login')
  }

  return <CommunityHubClient />
}
