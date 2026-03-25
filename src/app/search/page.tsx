import MemberAreaPlaceholder from '@/app/_components/member-area-placeholder'

export default function SearchPage() {
  return (
    <MemberAreaPlaceholder
      eyebrow="Search"
      title="Member discovery lands here"
      description="The dashboard already shows a nearby-members teaser. This route is now reserved for the full search experience with filters, distance, and intent matching."
      highlights={[
        'Nearby member results',
        'Intent and interest filters',
        'Saved searches',
      ]}
    />
  )
}