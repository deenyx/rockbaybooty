import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import MemberAreaPlaceholder from '@/app/_components/member-area-placeholder'
import { ROUTES } from '@/lib/constants'

export const metadata = {
  title: 'Events | RockBayBooty Community',
  description: 'Find and join community events and meetups',
}

export default async function EventsPage() {
  const session = await getSession()
  if (!session?.user?.id) {
    redirect('/login')
  }

  return (
    <MemberAreaPlaceholder
      eyebrow="Community"
      title="Events"
      description="Discover and join events hosted by community members. From social gatherings to special experiences, find what interests you. Browse upcoming events with full details, attendee info, and easy registration."
      highlights={['Upcoming events', 'Member-hosted', 'Direct messaging']}
    />
  )
}
