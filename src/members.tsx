connect what you can yesimport Link from "next/link";

export default function MembersArea({ user }) {
  // user: { userId, displayName, ... }
  return (
    <div
      className="min-h-screen text-white flex flex-col items-center relative"
      style={{
        backgroundImage: [
          "linear-gradient(180deg, rgba(10,3,20,0.72) 0%, rgba(20,6,38,0.55) 40%, rgba(10,3,20,0.80) 100%)",
          "url('/welcomebackground1.jpg')"
        ].join(", "),
        backgroundSize: "cover",
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#0a0314",
      }}
    >
      <header className="w-full py-6 px-8 flex justify-between items-center bg-black/40 shadow-lg">
        <div className="text-2xl font-bold">Welcome, {user?.displayName || "Member"}!</div>
        <nav className="flex gap-6">
          <Link href="/profile" className="hover:underline">Profile</Link>
          <Link href="/logout" className="hover:underline">Logout</Link>
        </nav>
      </header>
      <main className="flex-1 w-full max-w-4xl mx-auto py-12 px-4 flex flex-col gap-8 items-center">
        <h1 className="text-4xl font-extrabold mb-4">Members Area</h1>
        <p className="text-lg text-white/70 mb-8">This is your private space. Here you can access chat rooms, groups, classifieds, and more as features are added.</p>
        {/* Feature links (to be implemented) */}
        <div className="flex flex-wrap gap-8 justify-center">
          <div className="bg-white/10 rounded-xl p-8 min-w-[220px] text-center shadow-lg">
            <h2 className="text-xl font-bold mb-2">Profile</h2>
            <p className="text-white/60 mb-4">Edit your info, avatar, and privacy settings.</p>
            <Link href="/profile" className="text-purple-300 hover:underline">Go to Profile</Link>
          </div>
          <div className="bg-white/10 rounded-xl p-8 min-w-[220px] text-center shadow-lg opacity-50 cursor-not-allowed">
            <h2 className="text-xl font-bold mb-2">Chat Rooms</h2>
            <p className="text-white/60 mb-4">Coming soon!</p>
          </div>
          <div className="bg-white/10 rounded-xl p-8 min-w-[220px] text-center shadow-lg opacity-50 cursor-not-allowed">
            <h2 className="text-xl font-bold mb-2">Groups</h2>
            <p className="text-white/60 mb-4">Coming soon!</p>
          </div>
          <div className="bg-white/10 rounded-xl p-8 min-w-[220px] text-center shadow-lg opacity-50 cursor-not-allowed">
            <h2 className="text-xl font-bold mb-2">Classifieds</h2>
            <p className="text-white/60 mb-4">Coming soon!</p>
          </div>
        </div>
      </main>
    </div>
  );
}
