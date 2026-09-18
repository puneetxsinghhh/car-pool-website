# 🚗 CarPool Application — Backend API

A clean, modular REST API built with **Node.js**, **Express 5**, **MySQL**, and **Clerk Authentication**. It allows drivers to publish rides and passengers to discover and join them with atomic seat management.

---

## 📚 Essential Documentation Links

- [**Clerk Signup & Role Flow (`SIGNUP_FLOW.md`)**](./SIGNUP_FLOW.md): Detailed explanation of how user signup, tokens, and `DRIVER`/`PASSENGER` role assignment work across Clerk, Frontend, Express, and MySQL.
- [**Complete Project Flow (`PROJECT_FLOW.md`)**](./PROJECT_FLOW.md): Architectural guide covering Hexagonal architecture, dependency injection, and all 6 core workflows.

---

## 🎯 1. Project Purpose

The purpose of this project is to provide a reliable, scalable car-pooling backend service where:
- Drivers can publish upcoming journeys with specified seat capacity.
- Passengers can explore available rides, view driver and passenger details, and reserve seats.
- Seat availability is updated atomically with database row-level locking (`FOR UPDATE`) to prevent race conditions or overbooking.
- Authentication is handled securely via Clerk (credentials are never stored locally), while application authorization roles (`DRIVER` vs `PASSENGER`) are stored and verified in MySQL.

---

## 🛠️ 2. Technologies Used

- **Runtime Environment:** Node.js (v20+)
- **Web Framework:** Express.js (v5)
- **Database:** MySQL 8+ (`mysql2/promise` with connection pooling)
- **Authentication:** Clerk (`@clerk/express`, Clerk Backend SDK)
- **Security & Utilities:** `dotenv`, `cors`, `svix`
- **Architecture Pattern:** Clean / Hexagonal Architecture (Ports and Adapters)

---

## 🚀 3. Setup and Run Commands

### Prerequisites
- Node.js installed (`node -v`)
- MySQL Server running locally on port `3306` with database `car_pool_db`

### Environment Configuration
Ensure `.env` exists in the `Car-Pool-Backend` directory:
```env
# MySQL Database Configuration
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_NAME=car_pool_db
MYSQL_PORT=3306

# Clerk Authentication Keys
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Server Port
PORT=3000
```

### Install Dependencies & Start Server
```bash
cd Car-Pool-Backend
npm install
npm start
```
> The server will start on: **`http://localhost:3000`**

---

## 🔑 4. Authentication & Role Summary

> **In this project, the role is chosen in the frontend onboarding modal (`RoleSelectionModal.jsx`), transmitted in `req.body.role` to `POST /api/users/auth/register`, stored in both Clerk metadata (`publicMetadata.carPoolRole`) and the MySQL database (`users.role`), and subsequently read from MySQL during ride operations (`CreateRide` and `JoinRide`).**

---

## 📋 5. Core Endpoints Summary

### Public Endpoints
- `GET /`: API health check.
- `GET /api/rides`: Lists all available rides with `available_seats > 0`.
- `GET /api/rides/:id`: Returns basic info for a single ride.
- `GET /api/rides/:id/details`: Returns ride info with driver contact and confirmed passenger list via SQL JOIN.
- `POST /api/rides`: Creates a ride (enforces `driver.role === 'DRIVER'`).
- `POST /api/rides/:id/join`: Concurrency-safe seat booking using row-level locking (`FOR UPDATE`).
- `POST /api/users`: Creates a local user in MySQL directly without Clerk.
- `GET /api/users/:id/rides`: Fetches rides booked by a passenger.
- `GET /api/users/:id/summary`: Driver analytics aggregation (total rides, total passengers, total seats, remaining seats).

### Protected Endpoints (`Authorization: Bearer <Clerk_Token>`)
- `GET /api/users/me`: Returns local MySQL profile for the authenticated Clerk user (returns 404 if not yet registered in MySQL).
- `POST /api/users/auth/register`: Links Clerk user ID to a new MySQL profile with the selected role.
