import "dotenv/config";
import express from "express";
import { clerkMiddleware } from "@clerk/express";
import cors from "cors";

// --------------------------------------------------
// Outbound Adapters / Repositories
// --------------------------------------------------

import MySQLUserRepository
    from "./adapters/outbound/persistence/MySQLUserRepository.js";

import MySQLRideRepository
    from "./adapters/outbound/persistence/MySQLRideRepository.js";

import MySQLBookingRepository
    from "./adapters/outbound/persistence/MySQLBookingRepository.js";
 
import MySQLOutboxRepository
    from "./adapters/outbound/persistence/MySQLOutboxRepository.js";    

// --------------------------------------------------
// Use Cases
// --------------------------------------------------

import CreateUser
    from "./application/useCases/CreateUser.js";

import CreateRide
    from "./application/useCases/CreateRide.js";

import GetRides
    from "./application/useCases/GetRides.js";

import GetRideById
    from "./application/useCases/GetRideById.js";

import JoinRide
    from "./application/useCases/JoinRide.js";

import GetUserRides
    from "./application/useCases/GetUserRides.js";

import GetRideDetails
    from "./application/useCases/GetRideDetails.js";

import GetDriverSummary
    from "./application/useCases/GetDriverSummary.js";

import GetUserByClerkUserId
    from "./application/useCases/GetUserByClerkUserId.js";

import GetUserByEmail
    from "./application/useCases/GetUserByEmail.js";

import LinkClerkUserId
    from "./application/useCases/LinkClerkUserId.js";

// --------------------------------------------------
// Controllers
// --------------------------------------------------

import UserController
    from "./adapters/inbound/http/controllers/UserController.js";

import RideController
    from "./adapters/inbound/http/controllers/RideController.js";

// --------------------------------------------------
// Routes
// --------------------------------------------------

import createUserRoutes
    from "./adapters/inbound/http/routes/userRoutes.js";

import createRideRoutes
    from "./adapters/inbound/http/routes/rideRoutes.js";

import createClerkWebhookRoutes
    from "./adapters/inbound/http/routes/clerkWebhookRoutes.js";

// --------------------------------------------------
// Error Handler
// --------------------------------------------------

import errorHandler
    from "./adapters/inbound/http/errors/errorHandler.js";
    
// =================================================
// Services
// =================================================
import OutboxProcessor
    from "./application/services/OutboxProcessor.js";


// ==================================================
// APP
// ==================================================

const app = express();

const PORT = Number(process.env.PORT || 3000);


// ==================================================
// CORS
// ==================================================

app.use(
    cors({
        origin: "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);


// ==================================================
// CLERK MIDDLEWARE
// ==================================================

// Adds Clerk authentication information to requests.
//
// IMPORTANT:
// This does NOT automatically protect every route.
// Routes such as the webhook can still remain public.
app.use(clerkMiddleware());


// ==================================================
// REPOSITORIES
// ==================================================

const userRepository = new MySQLUserRepository();

const outboxRepository = new MySQLOutboxRepository();
const outboxProcessor =
    new OutboxProcessor(outboxRepository);

const rideRepository =
    new MySQLRideRepository(outboxRepository);

const bookingRepository = new MySQLBookingRepository();

// ==================================================
// USE CASES
// ==================================================

// ---------- User Use Cases ----------

const createUser = new CreateUser(userRepository);

const getUserRides = new GetUserRides(
    bookingRepository
);

const getDriverSummary = new GetDriverSummary(
    userRepository
);

const getUserByClerkUserId =
    new GetUserByClerkUserId(userRepository);

const getUserByEmail =
    new GetUserByEmail(userRepository);

const linkClerkUserId =
    new LinkClerkUserId(userRepository);


// ---------- Ride Use Cases ----------

const createRide = new CreateRide(
    rideRepository,
    userRepository
);

const getRides = new GetRides(
    rideRepository
);

const getRideById = new GetRideById(
    rideRepository
);

const joinRide = new JoinRide(
    rideRepository,
    userRepository
);

const getRideDetails = new GetRideDetails(
    rideRepository
);


// ==================================================
// CONTROLLERS
// ==================================================

const userController = new UserController(
    createUser,
    getUserRides,
    getDriverSummary,
    getUserByClerkUserId,
    getUserByEmail,
    linkClerkUserId
);

const rideController = new RideController(
    createRide,
    getRides,
    getRideById,
    joinRide,
    getRideDetails
);


// ==================================================
// CLERK WEBHOOK
// ==================================================
//
// VERY IMPORTANT:
//
// express.raw() MUST be used for Clerk webhook.
//
// It must also come BEFORE express.json().
//
// Clerk's verifyWebhook() needs the original raw
// request body to verify the webhook signature.
//

app.use(
    "/api/webhooks",
    express.raw({
        type: "application/json"
    }),
    createClerkWebhookRoutes(userController)
);


// ==================================================
// NORMAL JSON MIDDLEWARE
// ==================================================
//
// All normal API requests can now use JSON.
//
// DO NOT move this above the webhook route.
//

app.use(express.json());


// ==================================================
// USER ROUTES
// ==================================================

app.use(
    "/api/users",
    createUserRoutes(userController)
);


// ==================================================
// RIDE ROUTES
// ==================================================

app.use(
    "/api/rides",
    createRideRoutes(rideController)
);


// ==================================================
// HEALTH / TEST ROUTE
// ==================================================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Car Pool API is running"
    });
});


// ==================================================
// ERROR HANDLER
// ==================================================
//
// Must be registered AFTER all routes.
//

app.use(errorHandler);

// ==================================================
// Outbox Processor

setInterval(async () => {
    await outboxProcessor.processPendingEvents();
}, 5000);


// ==================================================
// START SERVER
// ==================================================

app.listen(PORT, () => {
    console.log(
        `Car Pool API running on http://localhost:${PORT}`
    );
});