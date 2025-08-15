"use client";

import { createAuthClient } from "better-auth/react"; // make sure to import from better-auth/react
import { magicLinkClient } from "better-auth/client/plugins";
import { env } from 'next-runtime-env';

export const authClient = createAuthClient({
    baseURL: `${env('NEXT_PUBLIC_API_URL') ?? 'http://localhost:3000'}/api/auth`,
    plugins: [magicLinkClient()],
});

export const { signIn, signUp, useSession } = authClient;
