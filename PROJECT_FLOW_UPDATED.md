# Car Pool Project - Complete Flow Documentation

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Application Startup](#application-startup)
3. [Authentication Flow (Clerk)](#authentication-flow-clerk)
4. [User Workflows](#user-workflows)
5. [API Endpoints](#api-endpoints)
6. [Database Schema](#database-schema)
7. [Request Flow](#request-flow)
8. [Error Handling](#error-handling)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                   │
│  • Clerk (Authentication & User Management)             │
│  • PostgreSQL (Primary Database)                        │
│  • MySQL (Alternative Database)                         │
└─────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────┐
│                   HEXAGONAL ARCHITECTURE                │
├─────────────────────────────────────────────────────────┤
│  Adapters (Inbound)                                     │
│  ├── HTTP Controllers (UserController, RideController) │
│  ├── Validators (userValidator)                        │
│  └── Error Handler                                      │
├─────────────────────────────────────────────────────────┤
│  Application Layer                                      │
│  ├── Use Cases (CreateUser, CreateRide, JoinRide, etc) │
│  └── Ports (Repository interfaces)                     │
├─────────────────────────────────────────────────────────┤
│  Domain Layer                                           │
│  ├── Entities (User, Ride, Booking)                     │
│  └── Business Rules                                     │
├─────────────────────────────────────────────────────────┤
│  Adapters (Outbound)                                    │
│  ├── PostgreSQL Repositories                           │
│  └── MySQL Repositories                                │
└─────────────────────────────────────────────────────────┘
```

---

## Application Startup

```mermaid
flowchart TD
    A[Start: node src/app.js] --> B[Load Express & Middleware]
    B --> C[Initialize Clerk Middleware]
    C --> D[Connect to Databases]
    D --> E[Create Repositories<br/>PostgreSQL/MySQL]
    E --> F[Create Use Cases<br/>CreateUser, CreateRide, JoinRide...]
    F --> G[Create Controllers<br/>UserController, RideController]
    G --> H[Register Routes<br/>/api/users, /api/rides]
    H --> I[Register Error Handler]
    I --> J[Listen on port 3000]
```

### Dependency Injection Flow

```
Database Pool
    ↓
Repositories (PostgreSQLUserRepository, etc.)
    ↓
Use Cases (CreateUser, CreateRide, etc.)
    ↓
Controllers (UserController, RideController)
    ↓
Routes (userRoutes, rideRoutes)
    ↓
Express App
```

---

## Authentication Flow (Clerk)

### How Clerk Works in This Project

```
User Login/Signup
       ↓
Clerk Dashboard or Clerk SDK
       ↓
Clerk generates JWT Token
       ↓
User includes token in API request headers
       ↓
clerkMiddleware() validates token
       ↓
getAuth(req) extracts user ID from token
       ↓
Your API uses user ID for business logic
```

### Complete Authentication Sequence

```mermaid
sequenceDiagram
    participant User
    participant ClerkAPI as Clerk API
    participant YourAPI as Your API
    participant Database

    User->>ClerkAPI: Create Account / Login
    ClerkAPI->>ClerkAPI: Validate credentials
    ClerkAPI->>User: Return JWT Token

    User->>YourAPI: POST /api/users/auth/signup<br/>+ JWT Token
    YourAPI->>YourAPI: clerkMiddleware validates token
    YourAPI->>YourAPI: getAuth() extracts clerkUserId
    YourAPI->>Database: Create user record
    Database->>YourAPI: Return user
    YourAPI->>User: 201 User created
```

---

## User Workflows

### Workflow 1: User Registration & Profile Setup

```
1. User signs up via Clerk Dashboard
   └─ Clerk creates account & generates clerkUserId

2. User gets JWT token from Clerk

3. User calls: POST /api/users/auth/signup
   ├─ Header: Authorization: Bearer <JWT>
   └─ Body: { name, email, role }

4. Your API validates token via clerkMiddleware

5. Your API creates user record in database
   ├─ Connects Clerk identity to app database
   └─ Stores name, email, role

6. User profile ready for booking rides
```

### Workflow 2: Create & Join Ride

```
DRIVER PERSPECTIVE:
├─ Driver logs in via Clerk (authenticated)
├─ Driver calls: POST /api/rides
│  └─ Body: { driverId, source, destination, ... }
├─ API creates ride record
└─ Ride is ready for passengers

PASSENGER PERSPECTIVE:
├─ Passenger logs in via Clerk (authenticated)
├─ Passenger calls: GET /api/rides
│  └─ Gets list of available rides
├─ Passenger calls: POST /api/rides/:id/join
│  └─ Body: { passengerId }
├─ API verifies passenger exists & has PASSENGER role
├─ API creates booking record
└─ Passenger joins ride successfully
```

### Workflow 3: Ride Details & History

```
User calls: GET /api/rides/:id
    ↓
RideController.getRideDetails()
    ↓
GetRideDetails use case
    ↓
Repository fetches ride + passengers + bookings
    ↓
Returns complete ride information
```

---

## API Endpoints

### Public Endpoints (No Authentication Required)

| Method | Endpoint         | Purpose          | Request                 | Response                             |
| ------ | ---------------- | ---------------- | ----------------------- | ------------------------------------ |
| `GET`  | `/`              | Health check     | None                    | `{ message: "running" }`             |
| `POST` | `/api/users`     | Create user      | `{ name, email, role }` | `{ id, name, email, role }`          |
| `GET`  | `/api/rides`     | List all rides   | Query params            | `[{ id, source, destination, ... }]` |
| `GET`  | `/api/rides/:id` | Get ride details | Ride ID in URL          | `{ id, driver, passengers, ... }`    |

### Protected Endpoints (Require Clerk JWT Token)

| Method | Endpoint                  | Purpose                     | Auth         | Request                 | Response                           |
| ------ | ------------------------- | --------------------------- | ------------ | ----------------------- | ---------------------------------- |
| `GET`  | `/api/users/auth/profile` | Get authenticated user info | Bearer Token | None                    | `{ clerkUserId, isAuthenticated }` |
| `POST` | `/api/users/auth/signup`  | Register after Clerk login  | Bearer Token | `{ name, email, role }` | `{ user, clerkUserId }`            |
| `POST` | `/api/rides/:id/join`     | Join a ride                 | Bearer Token | `{ passengerId }`       | `{ rideId, passengerId, status }`  |

### Authentication Header Format

```
Authorization: Bearer <JWT_TOKEN>
```

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role ENUM('DRIVER', 'PASSENGER') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Rides Table

```sql
CREATE TABLE rides (
  id SERIAL PRIMARY KEY,
  driver_id INT NOT NULL REFERENCES users(id),
  source VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  departure_time TIMESTAMP NOT NULL,
  total_seats INT NOT NULL,
  available_seats INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Bookings Table

```sql
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  ride_id INT NOT NULL REFERENCES rides(id),
  passenger_id INT NOT NULL REFERENCES users(id),
  booking_status VARCHAR(50) DEFAULT 'confirmed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(ride_id, passenger_id)
);
```

### Entity Relationships

```
Users (1) ──────────────────── (Many) Rides
  │                                     │
  │ role = DRIVER                       │ driver_id
  │                                     │
  └─ can create rides                   └─ rides driven

Users (Many) ──────────────────── (Many) Rides
       │                                    │
       │ (through Bookings)                 │
       └────────────────────────────────────┘

Bookings Table:
  ├─ ride_id (FK to Rides)
  └─ passenger_id (FK to Users)
```

---

## Request Flow (Example: Join Ride)

```mermaid
flowchart LR
    subgraph Client["Client (Postman)"]
        A["POST /api/rides/4/join<br/>Body: { passengerId: 1 }<br/>Header: Authorization: Bearer token"]
    end

    subgraph Express["Express Middleware"]
        B["clerkMiddleware()<br/>Validates JWT token"]
        C["body-parser<br/>Parses JSON"]
    end

    subgraph Controller["Controller Layer"]
        D["RideController.join()"]
    end

    subgraph UseCase["Use Case Layer"]
        E["JoinRide.execute()"]
    end

    subgraph Domain["Domain Layer"]
        F["Verify passenger exists<br/>Verify user is PASSENGER<br/>Verify ride exists"]
    end

    subgraph Repository["Repository Layer"]
        G["userRepository.findById()"]
        H["rideRepository.findById()"]
        I["rideRepository.joinRide()"]
    end

    subgraph DB["Database"]
        J["SELECT from users<br/>SELECT from rides<br/>INSERT into bookings"]
    end

    A --> B --> C --> D --> E --> F
    F --> G --> DB
    F --> H --> DB
    F --> I --> DB
    DB --> I --> E --> D
    D --> K["Response<br/>201 Created<br/>{ booking }"]

```

---

## Error Handling

### Error Flow

```mermaid
flowchart TD
    A["HTTP Request"] --> B["Route Handler"]
    B --> C{Error?}
    C -->|No| D["Success Response"]
    C -->|Yes| E["throw Error"]
    E --> F["next(error)"]
    F --> G["errorHandler middleware"]
    G --> H["Map to HTTP status"]
    H --> I["Send error response"]
```

### Common Errors

| Error                   | Status | Cause                     | Fix                    |
| ----------------------- | ------ | ------------------------- | ---------------------- |
| `Unauthorized`          | 401    | Missing/invalid JWT token | Add valid Bearer token |
| `User not found`        | 404    | Passenger doesn't exist   | Create user first      |
| `Passenger not found`   | 400    | Invalid passengerId       | Check user ID          |
| `User is not PASSENGER` | 400    | User role is DRIVER       | Use PASSENGER account  |
| `Ride not found`        | 404    | Invalid rideId            | Check ride ID          |
| `Validation failed`     | 400    | Missing required fields   | Check request body     |

### Error Response Format

```json
{
  "error": "Passenger not found",
  "message": "User does not exist"
}
```

---

## Testing Workflow in Postman

### 1. Create User

```
POST /api/users
Body: { "name": "John Doe", "email": "john@example.com", "role": "PASSENGER" }
```

### 2. Create Ride

```
POST /api/rides
Body: { "driverId": 2, "source": "NYC", "destination": "Boston", ... }
```

### 3. Join Ride (with JWT token)

```
POST /api/rides/1/join
Headers: Authorization: Bearer <token>
Body: { "passengerId": 1 }
```

### 4. Verify Booking

```
GET /api/rides/1
Headers: Authorization: Bearer <token>
```

---

## Key Design Principles

### 1. **Hexagonal Architecture**

- Clear separation between business logic (domain) and infrastructure
- Easy to test and replace components

### 2. **Dependency Injection**

- No hardcoded dependencies
- All dependencies injected through constructors

### 3. **Repository Pattern**

- Data access logic isolated in repositories
- Easy to switch databases (PostgreSQL ↔ MySQL)

### 4. **Use Cases / Application Services**

- Each use case handles one business operation
- Coordinates between repositories and domain entities

### 5. **Domain-Driven Design**

- Domain entities enforce business rules
- Rich domain logic instead of anemic models

### 6. **Error Handling**

- Centralized error handler
- Consistent error responses

---

## Development Setup

### Install Dependencies

```bash
pnpm install
```

### Environment Variables

Create `.env` file:

```
DATABASE_URL=postgresql://user:password@localhost:5432/carpool
CLERK_SECRET_KEY=sk_...
PORT=3000
```

### Start Server

```bash
pnpm run dev
```

### Run Tests (if available)

```bash
pnpm test
```

---

## Summary Flow Chart

```mermaid
graph TB
    Start["User Request"] -->|HTTP| API["Car Pool API"]
    API -->|1. Validate Auth| Clerk["Clerk Middleware"]
    Clerk -->|2. Route| Controller["Controller"]
    Controller -->|3. Business Logic| UseCase["Use Case"]
    UseCase -->|4. Verify| Domain["Domain Entity"]
    Domain -->|5. Persist| Repo["Repository"]
    Repo -->|6. Execute| DB["Database"]
    DB -->|Response| Repo
    Repo -->|Result| UseCase
    UseCase -->|Data| Controller
    Controller -->|JSON| Response["HTTP Response"]
    Response -->|Result| End["Client"]
```

---

## Notes

- **Clerk Integration**: Provides authentication without building it from scratch
- **Multi-Database Support**: Code supports both PostgreSQL and MySQL
- **Scalability**: Repository pattern allows easy database migration
- **Testability**: Dependency injection enables unit testing
- **Security**: JWT tokens validate all requests to protected endpoints
