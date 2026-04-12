"use client";
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function PinEntryBox() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin === "0000") {
      router.push("/onboarding");
    } else if (pin === "5555") {
      router.push("/login");
    } else if (pin === "9999") {
      router.push("/dashboard");
    } else {
      setError("Invalid PIN. Try 0000, 5555, or 9999.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 bg-black/60 p-8 rounded-xl shadow-lg w-full max-w-xs">
      <label htmlFor="pin" className="text-lg font-medium text-white/80 mb-2">PIN</label>
      <input
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
        placeholder="Enter PIN"
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-2xl text-white outline-none"
      />
      {error && <div className="text-red-400 text-xs">{error}</div>}
      <button type="submit" className="w-full rounded-full bg-purple-700 px-4 py-3 mt-2 text-white font-semibold">Continue</button>
      <div className="text-xs text-white/60 mt-2 text-center">
        <div>0000 → Sign Up</div>
        <div>5555 → Log In</div>
        <div>9999 → Default User Dashboard</div>
      </div>
    </form>
  );
}
