import MemberAreaPlaceholder from '@/app/_components/member-area-placeholder'

export default function ChatPage() {
  return (
    <MemberAreaPlaceholder
      eyebrow="Messages"
      title="Private conversations will appear here"
      description="This protected route now resolves correctly from the dashboard. The full messaging experience can be layered in without changing navigation again."
      highlights={[
        'Inbox and unread counts',
        'Conversation threads',
        'Real-time message delivery',
      ]}
    />
  )
}