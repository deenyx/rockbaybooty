import MemberAreaPlaceholder from '@/app/_components/member-area-placeholder'

export const metadata = {
  title: 'Classifieds | RockBayBooty Community',
  description: 'Browse listings, services, and exclusive content from members',
}

export default function ClassifiedsPage() {
  return (
    <MemberAreaPlaceholder
      eyebrow="Community"
      title="Classifieds"
      description="Browse member listings for services, experiences, and exclusive content. From private sessions to unique offerings, discover what members are sharing. All listings are verified and moderated for safety."
      highlights={['Verified listings', 'Direct contact', 'Secure payments']}
    />
  )
}
