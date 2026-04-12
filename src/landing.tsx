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
  import { useState } from "react";
  import { useRouter } from "next/navigation";

  export default function Landing() {
    const [pin, setPin] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      const code = pin.trim();
      if (code === "0000") {
        router.push("/onboarding");
      } else if (code === "5555") {
        router.push("/login");
      } else if (code === "9999") {
        router.push("/dashboard");
      } else {
        setError("Invalid PIN. Try 0000, 5555, or 9999.");
    }
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
        <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-5 p-6">
          <label className="block mb-2 text-lg font-semibold">PIN</label>
          <input
            type="password"
            autoFocus
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
              setError("");
            }}
            placeholder="Enter PIN (0000, 5555, 9999)"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-center text-2xl text-white outline-none"
          />
          {error && <div className="text-red-400 text-xs">{error}</div>}
          <button type="submit" className="w-full rounded-full bg-purple-700 px-4 py-3 mt-2">
            Continue
          </button>
        </form>
      </div>
    );
  }
        <p className="text-white/80 text-2xl mt-8 mb-2 text-center">
          Where desire meets discretion.<br />
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
