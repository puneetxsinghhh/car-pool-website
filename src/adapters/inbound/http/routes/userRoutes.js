import { Router } from "express";

import {
    validateCreateUser
} from "../validators/userValidator.js";

import UserController from "../controllers/UserController.js";

import requireClerkAuth
    from "../middleware/requireClerkAuth.js";

export default function createUserRoutes(userController) {

    const router = Router();

    // Creates the MySQL profile for an already authenticated Clerk user.
    router.post(
        "/auth/register",
        requireClerkAuth,
        validateCreateUser,
        (req, res, next) =>
            userController.registerAuthenticatedUser(req, res, next)
    );

    // Returns the local MySQL profile for the Clerk user in the Bearer token.
    router.get(
        "/me",
        requireClerkAuth,
        (req, res, next) => userController.getMe(req, res, next)
    );

    // Post api for creating the user : driver or passenger
    router.post( "/",
    validateCreateUser,  (req, res, next) =>
        userController.create(req, res, next)
    );

    // get api for id & rides // 
    router.get("/:id/rides", (req, res, next) =>
        {
            // debugger;
            userController.getRides(req, res, next);
        }
    );

    router.get(
    "/:id/summary",
    (req, res, next) =>
        userController.getDriverSummary(
            req,
            res,
            next
        )
    );


    return router;
}
