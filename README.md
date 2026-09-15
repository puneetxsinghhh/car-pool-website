# Car Pool API

A Node.js and Express REST API for drivers to offer rides and passengers to join them. MySQL stores car-pool data; Clerk provides authentication.

## Features

- Create `DRIVER` and `PASSENGER` users.
- Create, list, and inspect rides.
- Join rides with seat and duplicate-booking protection.
- View passenger bookings and driver summaries.
- Link a Clerk account to a local MySQL user.
- Protect APIs with a Clerk Bearer JWT.

## Architecture

```text
HTTP Route -> Controller -> Use Case -> Repository Port -> MySQL Repository -> MySQL
```

```text
src/
  adapters/inbound/http/     Express routes, controllers, middleware
  adapters/outbound/         MySQL and PostgreSQL repositories
  application/useCases/      Business actions
  application/ports/         Repository contracts
  domain/entities/           User, Ride, Booking models
  infrastructure/            Database and Clerk setup
scripts/                     Local migration and Clerk test helpers
```

## Requirements

- Node.js 20+
- MySQL 8+
- Clerk development instance

## Environment setup

Create `.env` in the project root. Never commit or share its values.

```env
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_NAME=car_pool_db
MYSQL_PORT=3306

CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

## Database model

```text
users
  id               local numeric ID
  clerk_user_id    unique Clerk user ID; null for unlinked old users
  name
  email            unique
  role             DRIVER or PASSENGER

rides
  id, driver_id, origin, destination, total_seats, available_seats

bookings
  id, ride_id, passenger_id
```

Run the safe, repeatable migration if the Clerk column is missing:

```bash
node scripts/add-clerk-user-id.js
```

## Run the API

```bash
node src/app.js
```

The server listens at `http://localhost:3000`.

## Endpoints

### Public

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Health check |
| POST | `/api/users` | Create a local driver or passenger |
| GET | `/api/users/:id/rides` | Get a passenger's bookings |
| GET | `/api/users/:id/summary` | Get driver summary |
| GET | `/api/rides` | List rides with free seats |
| POST | `/api/rides` | Create a ride |
| GET | `/api/rides/:id` | Get a ride |
| GET | `/api/rides/:id/details` | Get ride details |
| POST | `/api/rides/:id/join` | Join a ride |

### Clerk-protected

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/users/auth/register` | Link a Clerk account to an existing/local MySQL user |
| GET | `/api/users/me` | Get the local user linked to the JWT |

## Clerk flow

```text
Clerk signup/sign-in
  -> Clerk session JWT
  -> Authorization: Bearer <JWT>
  -> clerkMiddleware() validates token
  -> requireClerkAuth checks authenticated user
  -> req.clerkAuth.userId
  -> users.clerk_user_id links Clerk identity to MySQL user
```

Clerk owns passwords, login, sessions, and JWT generation. This API never stores a password.

`DRIVER` and `PASSENGER` are car-pool roles, not authentication roles.

## Postman Clerk test

1. Create a local user using `POST /api/users`.
2. Create a Clerk user with the same email in the Clerk Dashboard.
3. For local testing only, generate a session JWT:

```bash
node scripts/create-clerk-token.js user_your_clerk_user_id
```

4. In Postman use **Authorization -> Bearer Token** and paste the JWT.
5. Call:

```http
POST /api/users/auth/register
Content-Type: application/json
Authorization: Bearer <JWT>
```

```json
{
  "name": "Clerk Demo Driver",
  "email": "clerk.driver.demo@example.com",
  "role": "DRIVER"
}
```

6. Verify with:

```http
GET /api/users/me
Authorization: Bearer <JWT>
```

For a real frontend, Clerk's sign-in UI obtains the JWT. `create-clerk-token.js` is a development-only helper and must never be exposed as an HTTP endpoint.

## Authentication vs authorization

```text
Authentication: Clerk verifies who sent the request.
Authorization: this application checks what the local user can do.
```
