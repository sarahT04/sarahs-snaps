import { auth } from "@/auth";
import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
    const isAuthed = await auth.api.getSession({
        headers: context.request.headers,
    });

    context.locals.user = isAuthed?.user ?? null;
    context.locals.session = isAuthed?.session ?? null;

    return next();
});