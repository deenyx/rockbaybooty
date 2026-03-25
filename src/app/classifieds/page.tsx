import MemberAreaPlaceholder from '@/app/_components/member-area-placeholder'

export default function ClassifiedsPage() {
  return (
    <MemberAreaPlaceholder
      eyebrow="Classifieds"
      title="Classified listings will live here"
      description="The navigation now reaches a protected destination instead of a 404. This area is reserved for discreet listings, categories, and moderation workflows."
      highlights={[
        'Category browsing',
        'Member-created listings',
        'Safety and moderation review',
      ]}
    />
  )
}