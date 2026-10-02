import { createAuthClient } from "better-auth/react";
import { phoneNumberClient } from "better-auth/client/plugins";
import { sentinelClient } from "@better-auth/infra/client";

export const authClient = createAuthClient({
  plugins: [
    phoneNumberClient(),
    sentinelClient({
      identifyUrl: process.env.NEXT_PUBLIC_BETTER_AUTH_KV_URL,
    }),
  ],
});

export const { signIn, signOut, useSession } = authClient;
