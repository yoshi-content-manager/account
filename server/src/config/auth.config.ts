import { Pool } from "pg";
import { betterAuth } from "better-auth";
import { oidcProvider, magicLink, jwt, bearer } from "better-auth/plugins";
//
import { BETTER_AUTH_URL, APP_URL, sendEmail } from "~/libs";

const databaseUrl = process.env.BETTER_AUTH_DATABASE_URL;

if (!databaseUrl) {
    throw new Error(
        "Missing BETTER_AUTH_DATABASE_URL in environment variables"
    );
}
if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error("Missing BETTER_AUTH_SECRET in environment variables");
}

export const auth = betterAuth({
    appName: "Yoshi Account",
    database: new Pool({ connectionString: databaseUrl }),
    baseURL: BETTER_AUTH_URL,
    trustedOrigins: [APP_URL],
    secret: process.env.BETTER_AUTH_SECRET,
    advanced: {
        database: {
            generateId: false,
        },
    },
    user: {
        modelName: "users",
        changeEmail: {
            enabled: true,
            sendChangeEmailVerification: async ({
                // user,
                newEmail,
                url,
                // token,
            }) => {
                // Send change email verification
                sendEmail({
                    to: newEmail,
                    subject: "Verify your new email",
                    text: `Click the link to verify your new email: ${url}`,
                });
            },
        },
    },
    session: {
        modelName: "sessions",
        expiresIn: 60 * 60 * 24 * 7 * 4 * 3, // 3 months
    },
    account: {
        modelName: "loginMethods",
        accountLinking: {
            enabled: true,
            trustedProviders: ["github", "google", "email-password"],
            allowDifferentEmails: false,
            sendAccountLinkingEmail: async ({ user, url }) => {
                // Send account linking email
                sendEmail({
                    to: user.email,
                    subject: "Link your account",
                    text: `Click the link to confirm linking your account: ${url}`,
                });
            },
        },
    },
    emailAndPassword: {
        enabled: true,
        disableSignUp: false, // Enable/Disable sign up
        minPasswordLength: 8,
        maxPasswordLength: 128,
        autoSignIn: true,
        // Password hashing configuration
        password: {
            hash: async (password) => {
                return await Bun.password.hash(password, {
                    algorithm: "bcrypt",
                    cost: 10,
                });
            },
            verify: async ({ password, hash }) => {
                return await Bun.password.verify(password, hash);
            },
        },
        // Email verification configuration
        requireEmailVerification: false,
        emailVerification: {
            sendVerificationEmail: async ({ user, url }) => {
                await sendEmail({
                    to: user.email,
                    subject: "Verify your email",
                    text: `Click the link to verify your email: ${url}`,
                });
            },
            sendOnSignUp: true,
            autoSignInAfterVerification: true,
            expiresIn: 3600, // 1 hour
        },
        // Password reset configuration
        sendResetPassword: async ({ user, url }) => {
            await sendEmail({
                to: user.email,
                subject: "Reset your password",
                text: `Click the link to reset your password: ${url}`,
            });
        },
    },
    plugins: [
        magicLink({
            sendMagicLink: async ({ email, url }) => {
                await sendEmail({
                    to: email,
                    subject: "Sign in to your account",
                    text: `Click the link to sign in to your account: ${url}`,
                });
            },
        }),
        oidcProvider({
            loginPage: "/auth/login",
            consentPage: "/auth/consent",
            allowDynamicClientRegistration: false,
            requirePKCE: true,
        }),
        jwt({
            jwt: {
                issuer:
                    process.env.BETTER_AUTH_JWT_ISSUER ||
                    "https://yoshi.unstaticlabs.com",
                audience: "authenticated",
                definePayload: ({ user }) => {
                    return {
                        ...user,
                        role: "authenticated",
                    };
                },
            },
        }),
        bearer({}),
    ],
});
