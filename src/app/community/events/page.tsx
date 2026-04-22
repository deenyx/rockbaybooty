import MemberAreaPlaceholder from '@/app/_components/member-area-placeholder'

export const metadata = {
  title: 'Events | RockBayBooty Community',
  description: 'Find and join community events and meetups',
}

export default function EventsPage() {
  return (
    <MemberAreaPlaceholder
      eyebrow="Community"
      title="Events"
      description="Discover and join events hosted by community members. From social gatherings to special experiences, find what interests you. Browse upcoming events with full details, attendee info, and easy registration."
      highlights={['Upcoming events', 'Member-hosted', 'Direct messaging']}
    />
  )
}
