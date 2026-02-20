import { auth } from "@/auth";
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
    const isAuthed = await auth.api
        .getSession({
            headers: context.request.headers,
        })
    if (isAuthed) {
        if (isAuthed.user.email !== import.meta.env.ADMIN_EMAIL) {
            await auth.api.signOut({ headers: context.request.headers });
            return next();
        }
        context.locals.user = isAuthed.user;
        context.locals.session = isAuthed.session;
    } else {
        context.locals.user = null;
        context.locals.session = null;
    }

    return next();
});