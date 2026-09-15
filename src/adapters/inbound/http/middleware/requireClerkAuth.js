import { getAuth } from "@clerk/express";
/**
 * Return JSON (rather than redirecting) when an API route has no valid Clerk
 * session token. `clerkMiddleware()` must run before this middleware.
 */
export default function requireClerkAuth(req, res, next) {
    const auth = getAuth(req);

    if (!auth.isAuthenticated || !auth.userId) {
        return res.status(401).json({
            success: false,
            error: "Unauthorized. Send a valid Clerk Bearer token."
        });
    }

    req.clerkAuth = auth;
    next();
}
