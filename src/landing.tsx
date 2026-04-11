import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import fs from "fs";
import path from "path";
import type { CSSProperties } from "react";

const playfulScript = {
  fontFamily:
    "'SignPainter', 'SignPainter-HouseScript', 'Snell Roundhand', 'Bradley Hand', 'Brush Script MT', cursive",
  letterSpacing: "0.01em",
} as CSSProperties;

export default function Landing() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loginMode, setLoginMode] = useState(false);
  const [loginUserId, setLoginUserId] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const router = useRouter();

  // Passcode for onboarding
  const INVITE_PASSCODE = "0000";

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === INVITE_PASSCODE) {
      setError("");
      router.push("/onboarding");
    } else {
      setError("Invalid passcode. Please try again.");
    }
  };

  // Login handler: check profiles.json for user
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!loginUserId || !loginPass) {
      setLoginError("Please enter both User ID and Passcode/Words.");
      return;
    }
    try {
      const filePath = path.join(process.cwd(), "src", "profiles.json");
      let profiles = [];
      if (fs.existsSync(filePath)) {
        profiles = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      }
      const found = profiles.find(
        (p) => p.userId === loginUserId && p.passcode === loginPass
      );
      if (found) {
        setLoginError("");
        // router.push("/members/feed");
        alert("Login successful! (Redirect to members area here.)");
      } else {
        setLoginError("Invalid User ID or Passcode.");
      }
    } catch (err) {
      setLoginError("Login failed. Please try again.");
    }
  };

  return (
    <div
      className="relative flex min-h-[calc(100vh-64px)] flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundImage: [
          "linear-gradient(180deg, rgba(10,3,20,0.72) 0%, rgba(20,6,38,0.55) 40%, rgba(10,3,20,0.80) 100%)",
          "url('/welcomebackground1.jpg')",
        ].join(", "),
        backgroundSize: "113% 113%",
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#0a0314",
      }}
    >
      {/* Glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-700/20 blur-[120px]" />
        <div className="absolute right-1/4 bottom-1/4 h-[300px] w-[300px] rounded-full bg-pink-600/15 blur-[100px]" />
      </div>

      {/* Hero content */}
      <main className="relative z-10 flex flex-col items-center gap-8 px-8 text-center">
        {/* Logo mark */}
        {/* Tagline */}
        <p className="max-w-2xl text-3xl text-white/60 leading-tight sm:text-4xl" style={playfulScript}>
          Where desire meets discretion.
          <br />
          <span className="text-white/40 text-xl sm:text-2xl">No judgment. No limits. Just your kind of people.</span>
        </p>

        {/* Passcode form for onboarding */}
        {!loginMode && (
          <form onSubmit={handlePasscodeSubmit} className="flex flex-col items-center gap-4 mt-6">
            <input
              type="password"
              placeholder="Enter 4-digit passcode to create account"
              value={passcode}
              onChange={e => setPasscode(e.target.value)}
              maxLength={4}
              pattern="\\d{4}"
              className="rounded-full px-6 py-3 text-lg text-center bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400"
              style={playfulScript}
              required
            />
            <button
              type="submit"
              className="rounded-full bg-purple-700/80 px-8 py-3 text-xl text-white font-medium hover:bg-purple-600/90 transition"
              style={playfulScript}
            >
              Start Onboarding
            </button>
            <button
              type="button"
              className="underline text-white/60 mt-2"
              onClick={() => setLoginMode(true)}
            >
              Already have an account? Sign In
            </button>
            {error && <span className="text-red-400 text-sm mt-2">{error}</span>}
          </form>
        )}

        {/* Login form */}
        {loginMode && (
          <form onSubmit={handleLoginSubmit} className="flex flex-col items-center gap-4 mt-6">
            <input
              type="text"
              placeholder="User ID"
              value={loginUserId}
              onChange={e => setLoginUserId(e.target.value)}
              className="rounded-full px-6 py-3 text-lg text-center bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400"
              style={playfulScript}
              required
            />
            <input
              type="password"
              placeholder="Passcode or set of words"
              value={loginPass}
              onChange={e => setLoginPass(e.target.value)}
              className="rounded-full px-6 py-3 text-lg text-center bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-purple-400"
              style={playfulScript}
              required
            />
            <button
              type="submit"
              className="rounded-full bg-purple-700/80 px-8 py-3 text-xl text-white font-medium hover:bg-purple-600/90 transition"
              style={playfulScript}
            >
              Sign In
            </button>
            <button
              type="button"
              className="underline text-white/60 mt-2"
              onClick={() => setLoginMode(false)}
            >
              Back to Passcode
            </button>
            {loginError && <span className="text-red-400 text-sm mt-2">{loginError}</span>}
          </form>
        )}

        {/* Subtle disclaimer */}
        <p className="mt-8 text-xs text-white/25">
          18+ only &nbsp;·&nbsp; Adults only &nbsp;·&nbsp; Members agree to our community guidelines
        </p>
      </main>
    </div>
  );
}
