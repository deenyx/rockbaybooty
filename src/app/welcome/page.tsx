"use client";
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { MESSAGES, ROUTES } from '@/lib/constants';

type LoginResponse = {
  error?: string;
  returnTo?: string;
  requiresCredentials?: boolean;
};

export default function Welcome() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading'>('idle');
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (pin.length !== 4) {
      setError(MESSAGES.ENTRY_PIN_REQUIRED);
      return;
    }

    setStatus('loading');
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passcode: pin,
          returnTo: ROUTES.DASHBOARD,
        }),
      });

      const data = (await response.json()) as LoginResponse;

      if (!response.ok) {
        setError(data.error || MESSAGES.LOGIN_INVALID);
        setStatus('idle');
        return;
      }

      if (data.requiresCredentials || pin === '5555') {
        router.push(ROUTES.LOGIN);
        return;
      }

      router.push(data.returnTo || ROUTES.DASHBOARD);
    } catch {
      setError(MESSAGES.ERROR_GENERAL);
      setStatus('idle');
    }
  };

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Background Image */}
      <img 
        src="/welcome2.jpg" 
        alt="background" 
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center gap-12 px-4">
    {/* Keypad Icon */}
    <div 
      onClick={() => setShowInput(!showInput)}
      className="cursor-pointer text-9xl hover:scale-110 active:scale-95 transition-all duration-300"
    >
      ⌨️
    </div>

    {/* PIN Input Box */}
        {showInput && (
          <form onSubmit={handleSubmit} className="w-full max-w-xs">
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
                setError('');
              }}
              placeholder="PIN"
              className="w-full bg-black/80 border border-white/30 text-white text-5xl text-center tracking-widest py-6 rounded-3xl outline-none"
              disabled={status === 'loading'}
              autoFocus
            />

            {error && (
              <p className="mt-4 rounded-xl border border-rose-500/25 bg-rose-950/50 px-3 py-2 text-center text-xs text-rose-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="mt-4 w-full rounded-full border border-red-300/30 bg-red-500/10 px-4 py-2 text-sm tracking-[0.2em] text-red-100 transition hover:bg-red-500/20 disabled:cursor-wait disabled:opacity-70"
            >
              {status === 'loading' ? 'CHECKING...' : 'ENTER'}
            </button>
          </form>
        )}

        {/* Minimal Text Below */}
        <p className="text-red-400 text-2xl font-serif tracking-widest">
          No pin = 0000
        </p>
      </div>
    </div>
  );
}
