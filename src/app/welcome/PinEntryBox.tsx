"use client";
import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import { loginUser } from '../../lib/api';

export default function PinEntryBox() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [active, setActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin === "0000") {
      router.push("/signup");
    } else if (pin === "5555") {
      router.push("/login");
    } else if (pin === "9999") {
      setError("");
      const email = "test@fuxem.xyz";
      const password = "testuserpass";
      let result = await loginUser({ email, password });
      if (result.error) {
        await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "testuser", email, password }),
        });
        result = await loginUser({ email, password });
      }
      if (result.error) {
        setError("Test user login failed.");
      } else {
        router.push("/dashboard");
      }
    } else {
      setError("Invalid PIN. Try 0000, 5555, or 9999.");
    }
  }

  // Hide input when not active, show lock icon
  return (
    <div className="flex flex-col items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="relative flex flex-col items-center"
        autoComplete="off"
        onMouseLeave={() => setActive(false)}
      >
        {!active && (
          <button
            type="button"
            aria-label="Enter PIN"
            tabIndex={0}
            className="group flex items-center justify-center w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 shadow-lg border border-white/10 transition-all cursor-pointer"
            onMouseEnter={() => setActive(true)}
            onClick={() => {
              setActive(true);
              setTimeout(() => inputRef.current?.focus(), 80);
            }}
          >
            {/* Lock icon (Heroicons outline lock) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 text-white/80 group-hover:text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V7.5a4.5 4.5 0 10-9 0v3m12 0A2.25 2.25 0 0119.5 12.75v6A2.25 2.25 0 0117.25 21h-10.5A2.25 2.25 0 014.5 18.75v-6A2.25 2.25 0 016.75 10.5h10.5z"
              />
            </svg>
          </button>
        )}
        {active && (
          <input
            ref={inputRef}
            id="pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            value={pin}
            onChange={e => {
              setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
              setError("");
            }}
            placeholder="PIN"
            className="w-24 rounded-md border border-white/10 bg-black/60 px-3 py-2 text-center text-lg text-white outline-none shadow-lg backdrop-blur-sm placeholder-white/30 focus:bg-black/80 transition-all"
            style={{letterSpacing: '0.3em'}}
            onBlur={() => setActive(false)}
            autoFocus
          />
        )}
        {/* Error message, very subtle */}
        {error && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 text-xs text-red-400 bg-black/60 rounded px-2 py-1 mt-1 pointer-events-none select-none shadow" style={{fontSize: '10px'}}>
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
