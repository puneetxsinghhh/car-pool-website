import { Router } from "express";

import {
    validateCreateUser
} from "../validators/userValidator.js";

export default function createUserRoutes(userController) {

    const router = Router();

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
