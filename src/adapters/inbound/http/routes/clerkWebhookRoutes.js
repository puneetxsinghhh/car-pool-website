import { Router } from "express";
import verifyClerkWebhook from "../middleware/verifyClerkWebhook.js";

export default function createClerkWebhookRoutes(userController) {
    const router = Router();

    // This route is public because Clerk authenticates it with a signed webhook.
    router.post(
        "/clerk",
        verifyClerkWebhook,
        (req, res, next) => userController.syncClerkUserFromWebhook(req, res, next)
    );

    return router;
}
