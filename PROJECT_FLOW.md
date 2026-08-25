# Car Pool Project Flow

This document shows how a request travels through the Car Pool API.

## 1. Application Startup

```mermaid
flowchart TD
    A[Start: node src/app.js] --> B[Load environment and database pool]
    B --> C[Create PostgreSQL repositories]
    C --> D[Create application use cases]
    D --> E[Create controllers]
    E --> F[Register Express routes]
    F --> G[Register health check and error handler]
    G --> H[Listen on http://localhost:3000]
```

`src/app.js` is the composition root. It connects the infrastructure, repositories, use cases, controllers, and routes through dependency injection.

## 2. Common HTTP Request Flow

```mermaid
flowchart LR
    Client[HTTP client] --> Route[Express route]
    Route --> Controller[HTTP controller]
    Controller --> UseCase[Application use case]
    UseCase --> Domain[Domain entity or rule]
    UseCase --> Repository[PostgreSQL repository]
    Repository --> Database[(PostgreSQL)]
    Database --> Repository
    Repository --> UseCase
    UseCase --> Controller
    Controller --> Success[JSON success response]
    Controller -. error .-> ErrorHandler[Express error handler]
    ErrorHandler --> ErrorResponse[400 JSON error response]
```

Controllers translate HTTP input and output. Use cases contain application decisions. Repositories are the persistence boundary, and domain entities enforce core rules.

## 3. Available Routes

| Method | Endpoint               | Controller action         | Use case       |
| ------ | ---------------------- | ------------------------- | -------------- |
| `GET`  | `/`                    | Health check              | None           |
| `POST` | `/api/users`           | `UserController.create`   | `CreateUser`   |
| `GET`  | `/api/users/:id/rides` | `UserController.getRides` | `GetUserRides` |
| `POST` | `/api/rides`           | `RideController.create`   | `CreateRide`   |
| `GET`  | `/api/rides`           | `RideController.getAll`   | `GetRides`     |
| `GET`  | `/api/rides/:id`       | `RideController.getById`  | `GetRideById`  |
| `POST` | `/api/rides/:id/join`  | `RideController.join`     | `JoinRide`     |

## 4. Create User Flow

```mermaid
flowchart TD
    A[POST /api/users with name, email, role] --> B[UserController.create]
    B --> C[CreateUser.execute]
    C --> D[Create User entity]
    D --> E[UserRepository.create]
    E --> F[(users table)]
    F --> G[Return created user]
    G --> H[201 JSON response]
```

## 5. Create Ride Flow

```mermaid
flowchart TD
    A[POST /api/rides with driverId, origin, destination, totalSeats]
    A --> B[RideController.create]
    B --> C[CreateRide.execute]
    C --> D[Find driver by ID]
    D --> E{Driver exists?}
    E -- No --> X[Throw Driver not found]
    E -- Yes --> F{Role is DRIVER?}
    F -- No --> Y[Throw User is not registered as a driver]
    F -- Yes --> G[Create Ride entity]
    G --> H[Set availableSeats = totalSeats]
    H --> I[RideRepository.create]
    I --> J[(rides table)]
    J --> K[Return created ride]
    K --> L[201 JSON response]
    X --> M[Express error handler]
    Y --> M
    M --> N[400 JSON error response]
```

## 6. Join Ride Flow

```mermaid
flowchart TD
    A[POST /api/rides/:id/join with passengerId]
    A --> B[RideController.join]
    B --> C[JoinRide.execute]
    C --> D[Find passenger by ID]
    D --> E{Passenger exists?}
    E -- No --> X[Throw Passenger not found]
    E -- Yes --> F{Role is PASSENGER?}
    F -- No --> Y[Throw User is not registered as a passenger]
    F -- Yes --> G[Find ride by ID]
    G --> H{Ride exists?}
    H -- No --> Z[Throw Ride not found]
    H -- Yes --> I[Check existing booking]
    I --> J{Already joined?}
    J -- Yes --> Q[Throw Passenger already joined this ride]
    J -- No --> K[ride.join enforces seat rule]
    K --> L{Seats available?}
    L -- No --> R[Domain error]
    L -- Yes --> M[Decrease available seats]
    M --> N[Update ride]
    N --> O[Create booking]
    O --> P[(rides and bookings tables)]
    P --> S[201 JSON booking response]
    X --> T[Express error handler]
    Y --> T
    Z --> T
    Q --> T
    R --> T
    T --> U[400 JSON error response]
```

## 7. Read Flows

### List rides

`GET /api/rides` follows:

```text
Route -> RideController.getAll -> GetRides -> RideRepository.findAll -> PostgreSQL -> 200 JSON
```

### Get one ride

`GET /api/rides/:id` follows:

```text
Route -> RideController.getById -> GetRideById -> RideRepository.findById -> PostgreSQL -> 200 JSON
```

### Get a user's booked rides

`GET /api/users/:id/rides` follows:

```text
Route -> UserController.getRides -> GetUserRides -> BookingRepository.findByUserId -> PostgreSQL -> 200 JSON
```

## 8. Main Architectural Layers

```mermaid
flowchart TB
    Inbound[Inbound adapter\nExpress routes and controllers]
    Application[Application layer\nUse cases and ports]
    Domain[Domain layer\nRide, User, Booking entities]
    Outbound[Outbound adapter\nPostgreSQL repositories]
    Infrastructure[Infrastructure\nExpress app and database pool]

    Infrastructure --> Inbound
    Inbound --> Application
    Application --> Domain
    Application --> Outbound
    Outbound --> Infrastructure
```

The dependency direction keeps business logic independent from Express and PostgreSQL. The application layer receives repository implementations through constructors, which makes the boundaries explicit.
