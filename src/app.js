import express from "express";

// Database
import pool from "./infrastructure/database/db.js";
import mysqlPool from "./infrastructure/database/mysqlDb.js";


// PostgresSQL Outbound adapters
import PostgreSQLUserRepository
    from "./adapters/outbound/persistence/PostgreSQLUserRepository.js";

import PostgreSQLRideRepository
    from "./adapters/outbound/persistence/PostgreSQLRideRepository.js";

import PostgreSQLBookingRepository
    from "./adapters/outbound/persistence/PostgreSQLBookingRepository.js";

// MySQL outbound adapters
import MySQLUserRepository
    from "./adapters/outbound/persistence/MySQLUserRepository.js";

import MySQLRideRepository
    from "./adapters/outbound/persistence/MySQLRideRepository.js";

import MySQLBookingRepository
    from "./adapters/outbound/persistence/MySQLBookingRepository.js";    

// Use cases
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

// Controllers
import UserController
    from "./adapters/inbound/http/controllers/UserController.js";

import RideController
    from "./adapters/inbound/http/controllers/RideController.js";

// Routes
import createUserRoutes
    from "./adapters/inbound/http/routes/userRoutes.js";

import createRideRoutes
    from "./adapters/inbound/http/routes/rideRoutes.js";


const app = express();

const PORT = 3000;


// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(express.json());


// --------------------------------------------------
// Outbound Adapters / Repositories
// --------------------------------------------------

// postgres

// const userRepository =
//     new PostgreSQLUserRepository(pool);

// const rideRepository =
//     new PostgreSQLRideRepository(pool);

// const bookingRepository =
//     new PostgreSQLBookingRepository(pool);


// sql   
const userRepository =
    new MySQLUserRepository();

const rideRepository =
    new MySQLRideRepository();

const bookingRepository =
    new MySQLBookingRepository(); 


// --------------------------------------------------
// Use Cases
// --------------------------------------------------

const createUser =
    new CreateUser(userRepository);

const createRide =
    new CreateRide(
        rideRepository,
        userRepository
    );

const getRides =
    new GetRides(rideRepository);

const getRideById =
    new GetRideById(rideRepository);

const joinRide =
    new JoinRide(
        rideRepository,
        userRepository,
        bookingRepository
    );

const getUserRides =
    new GetUserRides(bookingRepository);


// --------------------------------------------------
// Controllers
// --------------------------------------------------

const userController =
    new UserController(
        createUser,
        getUserRides
    );

const rideController =
    new RideController(
        createRide,
        getRides,
        getRideById,
        joinRide
    );


// --------------------------------------------------
// Routes
// --------------------------------------------------

app.use(
    "/api/users",
    createUserRoutes(userController)
);

app.use(
    "/api/rides",
    createRideRoutes(rideController)
);


// --------------------------------------------------
// Health Check
// --------------------------------------------------

app.get("/", (req, res) => {
    res.json({
        message: "Car Pool API is running"
    });
});


// --------------------------------------------------
// Error Handler
// --------------------------------------------------

app.use((error, req, res, next) => {

    console.error(error);

    res.status(400).json({
        message: error.message
    });
});


// --------------------------------------------------
// Start Server
// --------------------------------------------------

app.listen(PORT, () => {
    console.log(
        `Car Pool API running on http://localhost:${PORT}`
    );
});