"use client";

import { createAuthClient } from "better-auth/react"; // make sure to import from better-auth/react
import { magicLinkClient } from "better-auth/client/plugins";
import { API_URL } from "~/lib/constants";

export const authClient = createAuthClient({
    baseURL: `${API_URL}/api/auth`,
    plugins: [magicLinkClient()],
});

export const { signIn, signUp, useSession } = authClient;
