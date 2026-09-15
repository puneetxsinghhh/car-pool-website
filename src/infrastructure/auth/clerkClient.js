import "dotenv/config";
import { createClerkClient } from "@clerk/express";

// Server-only client. Its secret key remains in .env and is never returned.
const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY
});

export default clerkClient;
