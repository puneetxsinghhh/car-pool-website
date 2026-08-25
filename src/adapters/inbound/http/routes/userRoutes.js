import { Router } from "express";

export default function createUserRoutes(userController) {

    const router = Router();

    router.post("/", (req, res, next) =>
        userController.create(req, res, next)
    );

    router.get("/:id/rides", (req, res, next) =>
        userController.getRides(req, res, next)
    );

    return router;
}
