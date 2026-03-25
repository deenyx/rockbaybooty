import MemberAreaPlaceholder from '@/app/_components/member-area-placeholder'

export default function GroupsPage() {
  return (
    <MemberAreaPlaceholder
      eyebrow="Groups"
      title="Community spaces are coming"
      description="This route is ready for public and private circles, event threads, and moderated group discovery once that part of the member experience is built."
      highlights={[
        'Joinable interest groups',
        'Private discussion rooms',
        'Group moderation tools',
      ]}
    />
  )
}