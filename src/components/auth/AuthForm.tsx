"use client";

import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import Logo from "@/components/landing/Logo";
import { signIn, signUp } from "@/lib/auth-client";

type Mode = "login" | "join";

export default function AuthForm({ mode }: { mode: Mode }) {
  const isJoin = mode === "join";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function nextUrl() {
    if (typeof window === "undefined") return "/postlogin";
    // Honor an explicit ?next=, otherwise route by role via /postlogin.
    return (
      new URLSearchParams(window.location.search).get("next") ?? "/postlogin"
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isJoin) {
        const res = await signUp.email({ name, email, password });
        if (res.error) throw new Error(res.error.message ?? "Sign up failed");
      } else {
        const res = await signIn.email({ email, password });
        if (res.error)
          throw new Error(res.error.message ?? "Invalid credentials");
      }
      window.location.href = nextUrl();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-navy-950 px-4 py-12 text-white">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-brand-600/25 blur-[140px]" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <a href="/">
            <Logo tone="light" />
          </a>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-xl sm:p-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-brand-200">
            {isJoin ? "Affiliate Portal" : "Account Login"}
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold">
            {isJoin ? "Join the affiliate program" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-white/60">
            {isJoin
              ? "Create your account to generate links and start earning."
              : "Log in to your Credio Pulse account."}
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            {isJoin && (
              <Field
                label="Full name"
                value={name}
                onChange={setName}
                type="text"
                autoComplete="name"
              />
            )}
            <Field
              label="Email"
              value={email}
              onChange={setEmail}
              type="email"
              autoComplete="email"
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/80">
                Password
              </label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isJoin ? "new-password" : "current-password"}
                  className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 pr-11 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute inset-y-0 right-0 grid w-11 place-items-center text-white/50 hover:text-white"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? (
                    <EyeOff className="h-4.5 w-4.5" />
                  ) : (
                    <Eye className="h-4.5 w-4.5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-lg border border-meter-poor/30 bg-meter-poor/10 px-3 py-2 text-sm text-meter-poor">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="press inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-400 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
              ) : (
                <>
                  {isJoin ? "Create account" : "Log in"}
                  <ArrowRight className="h-4.5 w-4.5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/55">
            {isJoin ? (
              <>
                Already have an account?{" "}
                <a
                  href="/login"
                  className="font-semibold text-brand-300 hover:underline"
                >
                  Log in
                </a>
              </>
            ) : (
              <>
                Want credit &amp; identity protection?{" "}
                <a
                  href="/signup"
                  className="font-semibold text-brand-300 hover:underline"
                >
                  Get started
                </a>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-white/80">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30"
      />
    </div>
  );
}
