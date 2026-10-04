import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { phoneNumber } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { dash } from "@better-auth/infra";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

const isProductionHttps =
  process.env.NODE_ENV === "production" &&
  !process.env.BETTER_AUTH_URL?.startsWith("http://localhost");

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },
  plugins: [
    nextCookies(),
    phoneNumber({
      sendOTP: async ({ phoneNumber: phoneNum, code }) => {
        console.log(`[BetterAuth Phone OTP] Verification code for ${phoneNum}: ${code}`);
      },
      otpLength: 6,
      expiresIn: 300, // 5 minutes
    }),
    ...(process.env.BETTER_AUTH_API_KEY &&
    process.env.BETTER_AUTH_API_URL &&
    process.env.BETTER_AUTH_KV_URL
      ? [
          dash({
            apiKey: process.env.BETTER_AUTH_API_KEY,
            apiUrl: process.env.BETTER_AUTH_API_URL,
            kvUrl: process.env.BETTER_AUTH_KV_URL,
          }),
        ]
      : []),
  ],
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "USER",
        input: false, // Prevent client-side manipulation of user roles
      },
      mustChangePassword: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days persistent session
    updateAge: 60 * 60 * 24, // 1 day update window
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 30, // 30 days cache alignment
    },
  },
  advanced: {
    useSecureCookies: isProductionHttps,
    defaultCookieAttributes: {
      sameSite: "lax",
      secure: isProductionHttps,
      httpOnly: true,
      path: "/",
    },
    cookies: {
      session_token: {
        attributes: {
          sameSite: "lax",
          secure: isProductionHttps,
          httpOnly: true,
          path: "/",
          maxAge: 60 * 60 * 24 * 30, // 30 days explicit cookie lifetime
        },
      },
    },
  },
  secret:
    process.env.BETTER_AUTH_SECRET ||
    (process.env.NODE_ENV === "production"
      ? (() => {
          throw new Error("BETTER_AUTH_SECRET must be configured in production.");
        })()
      : "development-secret-key-at-least-32-chars-long"),
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user & { role?: string };
