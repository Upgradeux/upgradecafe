import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { phoneNumber } from "better-auth/plugins";
import { dash } from "@better-auth/infra";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { sendMsg91Otp } from "@/lib/sms/msg91-service";

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
    phoneNumber({
      sendOTP: async ({ phoneNumber: phoneNum, code }) => {
        await sendMsg91Otp({
          phoneNumber: phoneNum,
          code,
        });
      },
      otpLength: 6,
      expiresIn: 300, // 5 minutes
    }),
    dash(),
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
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
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
