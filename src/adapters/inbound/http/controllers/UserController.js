import clerkClient from "../../../../infrastructure/auth/clerkClient.js";

export default class UserController {

    constructor(
        createUser,
        getUserRides,
        getDriverSummary,
        getUserByClerkUserId,
        getUserByEmail,
        linkClerkUserId
    ) {
        this.createUser = createUser;
        this.getUserRides = getUserRides;
        this.getDriverSummaryUseCase = getDriverSummary;
        this.getUserByClerkUserId = getUserByClerkUserId;
        this.getUserByEmail = getUserByEmail;
        this.linkClerkUserId = linkClerkUserId;
    }

    async create(req, res, next) {
        try {
            const user = await this.createUser.execute(req.body);

            res.status(201).json(user);
        } catch (error) {
            next(error);
        }
    }

    // Clerk has already authenticated this request. This endpoint creates the
    // matching application profile in MySQL; it does not create a Clerk user.
    async registerAuthenticatedUser(req, res, next) {
        console.log("registerAuthenticatedUser called with req.body:", req.body);
        try {
            const clerkUserId = req.clerkAuth.userId;

            const existingUser = await this.getUserByClerkUserId.execute(
                clerkUserId
            );

            if (existingUser) {
                return res.status(200).json(existingUser);
            }

            // The email comes from Clerk's Backend API, not from the client.
            const clerkUser = await clerkClient.users.getUser(clerkUserId);
            const clerkEmail = clerkUser.primaryEmailAddress?.emailAddress;

            if (!clerkEmail) {
                return res.status(400).json({
                    success: false,
                    message: "The Clerk account has no primary email address."
                });
            }

            // This supports existing users created before Clerk was added.
            const localUser = await this.getUserByEmail.execute(clerkEmail);

            if (localUser) {
                if (localUser.clerkUserId) {
                    return res.status(409).json({
                        success: false,
                        message: "This local user is already linked to another Clerk account."
                    });
                }

                const linkedUser = await this.linkClerkUserId.execute(
                    localUser.id,
                    clerkUserId
                );

                return res.status(200).json(linkedUser);
            }

            if (req.body.email.toLowerCase() !== clerkEmail.toLowerCase()) {
                return res.status(400).json({
                    success: false,
                    message: "Request email must match the authenticated Clerk email."
                });
            }

            const user = await this.createUser.execute({
                ...req.body,
                email: clerkEmail,
                clerkUserId
            });

            res.status(201).json(user);
        } catch (error) {
            next(error);
        }
    }

    async getMe(req, res, next) {
        try {
            const user = await this.getUserByClerkUserId.execute(
                req.clerkAuth.userId
            );

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "No local user profile is linked to this Clerk account."
                });
            }

            res.status(200).json(user);
        } catch (error) {
            next(error);
        }
    }

    // Creates or links the local profile after Clerk has verified a user.created webhook.
    async syncClerkUserFromWebhook(req, res, next) {
        console.log("🔥 CLERK WEBHOOK RECEIVED");
        try {
            const event = req.clerkWebhookEvent;

            if (event.type !== "user.created") {
                return res.status(200).json({ success: true, ignored: true });
            }

            const clerkUser = event.data;
            const primaryEmail = clerkUser.email_addresses.find(
                (email) => email.id === clerkUser.primary_email_address_id
            )?.email_address;
            const role = clerkUser.public_metadata?.carPoolRole;

            if (!primaryEmail) {
                return res.status(422).json({
                    success: false,
                    message: "Clerk user has no primary email address."
                });
            }

            if (!['DRIVER', 'PASSENGER'].includes(role)) {
                return res.status(422).json({
                    success: false,
                    message: "Clerk publicMetadata.carPoolRole must be DRIVER or PASSENGER."
                });
            }

            const existingByClerkId = await this.getUserByClerkUserId.execute(
                clerkUser.id
            );

            // Webhooks can be retried, so an existing link is a successful no-op.
            if (existingByClerkId) {
                return res.status(200).json({
                    success: true,
                    created: false,
                    user: existingByClerkId
                });
            }

            const existingByEmail = await this.getUserByEmail.execute(primaryEmail);

            if (existingByEmail) {
                if (existingByEmail.clerkUserId) {
                    return res.status(409).json({
                        success: false,
                        message: "A different Clerk account is already linked to this email."
                    });
                }

                const linkedUser = await this.linkClerkUserId.execute(
                    existingByEmail.id,
                    clerkUser.id
                );

                return res.status(200).json({
                    success: true,
                    created: false,
                    user: linkedUser
                });
            }

            const name = [clerkUser.first_name, clerkUser.last_name]
                .filter(Boolean)
                .join(" ") || primaryEmail.split("@")[0];
            //  temporary console logs for debugging
            console.log("Creating user in database...");
            console.log({
            name,
            email: primaryEmail,
            role,
            clerkUserId: clerkUser.id
            });
                
            const user = await this.createUser.execute({
                name,
                email: primaryEmail,
                role,
                clerkUserId: clerkUser.id
            });

            res.status(201).json({ success: true, created: true, user });
        } catch (error) {
            next(error);
        }
    }

    async getRides(req, res, next) {
        try {
            const rides = await this.getUserRides.execute(
                Number(req.params.id)
            );

            res.status(200).json(rides);
        } catch (error) {
            next(error);
        }
    }

    async getDriverSummary(req, res, next) {

    try {

        const driverId =
            Number(req.params.id);

        const summary =
            await this.getDriverSummaryUseCase.execute(
                driverId
            );

        if (!summary) {

            return res.status(404).json({
                message: "Driver not found"
            });
        }

        res.status(200).json(summary);

    } 
    catch (error) {

        next(error);
     }
    }

}
