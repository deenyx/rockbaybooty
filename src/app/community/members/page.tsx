import MemberAreaPlaceholder from '@/app/_components/member-area-placeholder'

export const metadata = {
  title: 'Member Search | RockBayBooty Community',
  description: 'Discover and connect with verified members in the community',
}

export default function MembersPage() {
  return (
    <MemberAreaPlaceholder
      eyebrow="Community"
      title="Member Search"
      description="Discover verified members in the community. Browse profiles, connect with like-minded individuals, and explore interests together. All interactions happen within our secure, private network."
      highlights={['Advanced filters', 'Verified profiles', 'Safe messaging']}
    />
  )
}
