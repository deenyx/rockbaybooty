import dynamic from 'next/dynamic'

// Loaded client-only: the LiveKit SDK uses WebRTC browser APIs that must not
// run during SSR. The loading fallback mirrors the in-room spinner so there
// is no layout shift once the script bundle appears.
const LiveRoomClient = dynamic(
  () => import('./_components/live-room-client'),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#0b0608_18%,#1a0b10_60%,#341113_100%)]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400" />
          <p className="text-sm text-stone-400">Loading live room&hellip;</p>
        </div>
      </div>
    ),
  }
)

export default function ChatPage() {
  return <LiveRoomClient />
}