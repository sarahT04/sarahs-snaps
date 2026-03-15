import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
    baseURL: import.meta.env.PUBLIC_BETTER_AUTH_BASE_URL || "http://localhost:4321"
})

export const signIn = async () => {
    await authClient.signIn.social({
        provider: "github",
        callbackURL: "/admin"
    });
}

export const { signOut, useSession } = authClient
