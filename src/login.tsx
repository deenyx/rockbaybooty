import { useState } from "react";
import { useRouter } from "next/router";
import { loginUser } from "./lib/api";

export default function Login() {
  const router = useRouter();
  const [entryPin, setEntryPin] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [secret, setSecret] = useState("");
  const [secretType, setSecretType] = useState<'password' | 'passcode'>("password");
  const [stage, setStage] = useState<'pin' | 'credentials'>("pin");
  const [error, setError] = useState("");
  const [status, setStatus] = useState<'idle' | 'loading'>("idle");

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = entryPin.trim();
    if (!code) {
      setError("Entry PIN required");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const res = await loginUser({ passcode: code });
      if (res.requiresCredentials || code === "5555") {
        setStage("credentials");
        setStatus("idle");
        setError("");
        return;
      }
      if (res.error) {
        setError(res.error);
        setStatus("idle");
        return;
      }
      router.push(res.returnTo || "/");
    } catch {
      setError("Network error. Please try again.");
      setStatus("idle");
    }
  }

  async function handleCredentialSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier.trim() || !secret.trim()) {
      setError("User ID/email and password/passcode required");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const res = await loginUser({
        passcode: "5555",
        identifier: identifier.trim().toLowerCase(),
        secret: secret.trim(),
        secretType,
      });
      if (res.error) {
        setError(res.error);
        setStatus("idle");
        return;
      }
      router.push(res.returnTo || "/");
    } catch {
      setError("Network error. Please try again.");
      setStatus("idle");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      {stage === "pin" ? (
        <form onSubmit={handlePinSubmit} className="w-full max-w-xs space-y-5 p-6">
          <label className="block mb-2">Entry PIN</label>
          <input
            type="password"
            autoFocus
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            value={entryPin}
            onChange={(e) => {
              setEntryPin(e.target.value.replace(/\D/g, "").slice(0, 4));
              setError("");
            }}
            placeholder="0000"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-center text-2xl text-white outline-none"
          />
          {error && <div className="text-red-400 text-xs">{error}</div>}
          <button type="submit" disabled={status === "loading"} className="w-full rounded-full bg-purple-700 px-4 py-3 mt-2">
            {status === "loading" ? "checking…" : "continue"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleCredentialSubmit} className="w-full max-w-xs space-y-5 p-6">
          <label className="block mb-2">User ID or Email</label>
          <input
            type="text"
            autoComplete="username"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              setError("");
            }}
            placeholder="username or you@example.com"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
          />
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => {
                setSecretType("password");
                setError("");
              }}
              className={`rounded-full px-3 py-1 text-xs ${secretType === "password" ? "bg-white/10 border border-white/30" : "border border-white/10"}`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => {
                setSecretType("passcode");
                setError("");
              }}
              className={`rounded-full px-3 py-1 text-xs ${secretType === "passcode" ? "bg-white/10 border border-white/30" : "border border-white/10"}`}
            >
              Passcode
            </button>
          </div>
          <input
            type={secretType === "password" ? "password" : "text"}
            autoComplete={secretType === "password" ? "current-password" : "off"}
            value={secret}
            onChange={(e) => {
              setSecret(secretType === "passcode" ? e.target.value.toUpperCase() : e.target.value);
              setError("");
            }}
            placeholder={secretType === "password" ? "your password" : "your passcode"}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
          />
          {error && <div className="text-red-400 text-xs">{error}</div>}
          <button type="submit" disabled={status === "loading"} className="w-full rounded-full bg-purple-700 px-4 py-3 mt-2">
            {status === "loading" ? "entering…" : "log in"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStage("pin");
              setSecret("");
              setIdentifier("");
              setError("");
            }}
            className="text-xs text-gray-400 mt-2 hover:text-white"
          >
            ← change pin
          </button>
        </form>
      )}
    </div>
  );
}
