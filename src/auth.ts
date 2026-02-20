import { betterAuth } from "better-auth"

export const auth = betterAuth({
    socialProviders: {
        github: { 
            clientId: import.meta.env.GITHUB_CLIENT_ID as string, 
            clientSecret: import.meta.env.GITHUB_CLIENT_SECRET as string, 
        }, 
    },
})