import { verifyWebhook } from "@clerk/express/webhooks";

export default async function verifyClerkWebhook(req, res, next) {
    console.log("\n========== CLERK WEBHOOK RECEIVED ==========");

    try {
        console.log("Content-Type:", req.headers["content-type"]);
        console.log("Webhook body type:", typeof req.body);

        const event = await verifyWebhook(req);

        console.log("✅ WEBHOOK SIGNATURE VERIFIED");
        console.log("Event type:", event.type);
        console.log("Clerk User ID:", event.data?.id);

        req.clerkWebhookEvent = event;

        next();

    } catch (error) {

        console.error("\n❌ WEBHOOK VERIFICATION FAILED");
        console.error("Error:", error.message);
        console.error("Stack:", error.stack);

        return res.status(400).json({
            success: false,
            message: "Invalid Clerk webhook signature.",
            debug: error.message
        });
    }
}
