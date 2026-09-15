import { Router } from "express";

export default function createRideRoutes(rideController) {
    const router = Router();

    router.get("/", (req, res, next) =>
        rideController.getAll(req, res, next)
    );

    router.post("/", (req, res, next) =>
        rideController.create(req, res, next)
    );

    router.get("/:id", (req, res, next) =>
        rideController.getById(req, res, next)
    );

    router.get("/:id/details", (req, res, next) =>
        rideController.getRideDetails(req, res, next)
    );

    // A ride can be joined only once per request; duplicate route registration is removed.
    router.post("/:id/join", (req, res, next) =>
        rideController.join(req, res, next)
    );

    return router;
}
