import MemberAreaPlaceholder from '@/app/_components/member-area-placeholder'

export default function ProfilePage() {
  return (
    <MemberAreaPlaceholder
      eyebrow="Profile"
      title="Profile tools are next"
      description="Your dashboard edit modal is live now. This dedicated profile space is reserved for deeper controls like public visibility, multiple photos, and profile completion insights."
      highlights={[
        'Expanded profile editing',
        'Photo management',
        'Privacy controls',
      ]}
    />
  )
}