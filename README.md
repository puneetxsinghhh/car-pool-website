# Car Pool API

A Node.js and Express REST API for creating users, offering rides, and joining available rides. PostgreSQL is used for persistence.

## Requirements

- Node.js
- pnpm
- PostgreSQL

## Installation

```bash
pnpm install
```

Create a `.env` file in the project root:

```env
DB_USER=your_postgres_user
DB_HOST=localhost
DB_NAME=your_database_name
DB_PASSWORD=your_postgres_password
DB_PORT=5432
```

The PostgreSQL database must contain the `users`, `rides`, and booking tables expected by the repository queries.

## Run the API

Development mode with automatic restart:

```bash
pnpm dev
```

Production-style start:

```bash
pnpm start
```

The API listens on `http://localhost:3000`.

Note: the available development script is `pnpm dev`; `pnpm rundev` is not defined in `package.json`.

## Endpoints

### Health check

```http
GET /
```

### Users

Create a user:

```http
POST /api/users
Content-Type: application/json
```

```json
{
  "name": "Puneet",
  "email": "puneet@example.com",
  "role": "DRIVER"
}
```

Get rides booked by a user:

```http
GET /api/users/:id/rides
```

### Rides

Create a ride. The `driverId` must belong to a user whose role is `DRIVER`:

```http
POST /api/rides
Content-Type: application/json
```

```json
{
  "driverId": 1,
  "origin": "Delhi",
  "destination": "Gurgaon",
  "totalSeats": 3
}
```

List available rides:

```http
GET /api/rides
```

Get a ride by ID:

```http
GET /api/rides/:id
```

Join a ride. The `passengerId` must belong to a user whose role is `PASSENGER`:

```http
POST /api/rides/:id/join
Content-Type: application/json
```

```json
{
  "passengerId": 2
}
```

## Project structure

- `src/adapters/inbound/http`: Express controllers and routes
- `src/application/useCases`: Application business operations
- `src/domain/entities`: Domain entities
- `src/adapters/outbound/persistence`: PostgreSQL repositories
- `src/infrastructure/database`: Database connection setup
