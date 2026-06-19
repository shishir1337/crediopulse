"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { signOut } from "@/lib/auth-client";

export default function SignOutButton() {
  const [loading, setLoading] = useState(false);

  async function onClick() {
    setLoading(true);
    await signOut();
    window.location.href = "/";
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="press inline-flex items-center gap-1.5 rounded-xl border border-ink/15 bg-white px-3.5 py-2 text-sm font-semibold text-ink hover:bg-brand-50 disabled:opacity-60"
    >
      <LogOut className="h-4 w-4" />
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
