import MemberLayout from '@/app/_layouts/member-layout'

import CameraWatchClient from './watch-client'

export default function CameraWatchPage() {
  return (
    <MemberLayout>
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-8 sm:px-6 lg:px-8">
        <CameraWatchClient />
      </div>
    </MemberLayout>
  )
}
