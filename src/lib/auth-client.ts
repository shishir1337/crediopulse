"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Always call same-origin so the portal works on any host/port (dev or prod)
  // without CORS issues.
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000"),
});

export const { signIn, signUp, signOut, useSession } = authClient;
