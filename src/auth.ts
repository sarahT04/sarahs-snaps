import { betterAuth } from "better-auth"
import { createAuthMiddleware } from "better-auth/api"

export const auth = betterAuth({
    secret: import.meta.env.BETTER_AUTH_SECRET as string,
    baseURL: import.meta.env.PUBLIC_BETTER_AUTH_BASE_URL || "http://localhost:4321",
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 7 * 24 * 60 * 60, // 7 days cache duration
            strategy: "jwe", // can be "jwt" or "compact"
            refreshCache: true, // Enable stateless refresh
        },
    },
    account: {
        storeStateStrategy: "cookie",
        storeAccountCookie: true, // Store account data after OAuth flow in a cookie (useful for database-less flows)
    },
    socialProviders: {
        github: {
            clientId: import.meta.env.GITHUB_CLIENT_ID as string,
            clientSecret: import.meta.env.GITHUB_CLIENT_SECRET as string,
        },
    },
    hooks: {
        after: createAuthMiddleware(async (context) => {
            const isAuthed = context.context.session;
            if (isAuthed && isAuthed.user.email !== import.meta.env.ADMIN_EMAIL) {
                await auth.api.signOut({ headers: context.request!.headers });
            }
        })
    }
})