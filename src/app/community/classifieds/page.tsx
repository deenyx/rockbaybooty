import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import MemberAreaPlaceholder from '@/app/_components/member-area-placeholder'
import { ROUTES } from '@/lib/constants'

export const metadata = {
  title: 'Classifieds | RockBayBooty Community',
  description: 'Browse listings, services, and exclusive content from members',
}

export default async function ClassifiedsPage() {
  const session = await getSession()
  if (!session?.user?.id) {
    redirect('/login')
  }

  return (
    <MemberAreaPlaceholder
      eyebrow="Community"
      title="Classifieds"
      description="Browse member listings for services, experiences, and exclusive content. From private sessions to unique offerings, discover what members are sharing. All listings are verified and moderated for safety."
      highlights={['Verified listings', 'Direct contact', 'Secure payments']}
    />
  )
}
