import CommunityHubClient from '@/app/community/_components/community-hub-client'
import MemberLayout from '@/app/_layouts/member-layout'

export const metadata = {
  title: 'Community | RockBayBooty',
  description: 'Discover members, events, and classifieds in the RockBayBooty community',
}

export default function CommunityPage() {
  return (
    <MemberLayout>
      <CommunityHubClient />
    </MemberLayout>
  )
}
