import { createAuthClient } from "better-auth/react";
import { phoneNumberClient } from "better-auth/client/plugins";
import { sentinelClient } from "@better-auth/infra/client";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  plugins: [
    phoneNumberClient(),
    sentinelClient({
      identifyUrl: process.env.NEXT_PUBLIC_BETTER_AUTH_KV_URL,
    }),
  ],
});

export const { signIn, signOut, useSession } = authClient;
