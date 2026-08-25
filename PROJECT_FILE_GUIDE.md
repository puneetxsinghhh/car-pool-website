# Project File Guide

Short reference for each package and file in the Car Pool API.

## Packages

- `express`: Creates the HTTP server, routes, middleware, and JSON responses.
- `pg`: Connects the application to PostgreSQL and runs database queries.
- `postgres`: PostgreSQL client dependency currently available for future database use.
- `dotenv`: Loads database settings from the `.env` file.
- `pnpm`: Installs dependencies and runs project scripts.

## Root Files

- `package.json`: Defines project metadata, dependencies, and `start`/`dev` commands.
- `pnpm-lock.yaml`: Locks exact dependency versions for consistent installs.
- `.env`: Stores local database connection settings.
- `.gitignore`: Lists files Git should ignore.
- `README.md`: Explains setup, endpoints, and project structure.
- `PROJECT_FLOW.md`: Documents startup, request, ride, booking, and architecture flows.
- `CREATE_DRIVER_FLOW.md`: Documents the driver creation flow and debugger breakpoints.
- `PROJECT_FILE_GUIDE.md`: This short package and file reference.
- `.vscode/launch.json`: Configures VS Code to debug `src/app.js` with Node Inspector.

## `src` Files

### Application Entry

- `src/app.js`: Builds the Express app, injects dependencies, registers routes, and starts the server.

### Infrastructure

- `src/infrastructure/database/db.js`: Creates and exports the PostgreSQL connection pool.

### Inbound HTTP Adapter

- `src/adapters/inbound/http/routes/userRoutes.js`: Defines user-related HTTP endpoints.
- `src/adapters/inbound/http/routes/rideRoutes.js`: Defines ride and join-ride HTTP endpoints.
- `src/adapters/inbound/http/controllers/UserController.js`: Handles user requests and sends user responses.
- `src/adapters/inbound/http/controllers/RideController.js`: Handles ride requests and sends ride or booking responses.

### Application Use Cases

- `src/application/useCases/CreateUser.js`: Creates a user entity and saves it.
- `src/application/useCases/CreateRide.js`: Validates a driver and creates a ride.
- `src/application/useCases/GetRides.js`: Retrieves all rides.
- `src/application/useCases/GetRideById.js`: Retrieves one ride by ID.
- `src/application/useCases/GetUserRides.js`: Retrieves rides booked by one user.
- `src/application/useCases/JoinRide.js`: Validates a passenger, checks seats, and creates a booking.

### Application Ports

- `src/application/ports/UserRepository.js`: Defines the repository contract for users.
- `src/application/ports/RideRepository.js`: Defines the repository contract for rides.
- `src/application/ports/BookingRepository.js`: Defines the repository contract for bookings.

### Domain Entities

- `src/domain/entities/User.js`: Represents a user with an ID, name, email, and role.
- `src/domain/entities/Ride.js`: Represents a ride and controls available-seat behavior.
- `src/domain/entities/Booking.js`: Represents a passenger booking for a ride.

### Outbound PostgreSQL Persistence

- `src/adapters/outbound/persistence/PostgreSQLUserRepository.js`: Saves and finds users in PostgreSQL.
- `src/adapters/outbound/persistence/PostgreSQLRideRepository.js`: Saves, finds, lists, and updates rides in PostgreSQL.
- `src/adapters/outbound/persistence/PostgreSQLBookingRepository.js`: Saves bookings and finds a user's or ride's bookings.

## Request Direction

`Client -> Route -> Controller -> Use Case -> Entity -> Repository -> PostgreSQL -> JSON response`
