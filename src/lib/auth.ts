import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./prisma";

export const auth = betterAuth({
  appName: "Credio Pulse",
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      // Roles are assigned server-side only — never settable from the client,
      // so an affiliate cannot make themselves an admin.
      // New self-service signups are customers. Affiliate accounts are created
      // by an admin (Admin → Affiliates → Create affiliate); admins via script.
      role: {
        type: "string",
        required: false,
        defaultValue: "customer",
        input: false,
      },
      banned: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
      banReason: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh daily
  },
  advanced: {
    cookiePrefix: "cp",
  },
  trustedOrigins: [
    process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    ...(process.env.NODE_ENV !== "production"
      ? [
          "http://localhost:3000",
          "http://localhost:3001",
          "http://localhost:3210",
        ]
      : []),
  ],
  // Affiliate profiles are created lazily by `requireAffiliate()` on first visit
  // to the affiliate dashboard — NOT for every signup. This keeps customer
  // accounts (role "customer") out of the affiliate system.
  // nextCookies() must be the last plugin.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
