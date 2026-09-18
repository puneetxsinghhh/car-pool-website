# 🔐 Clerk Signup & Role Synchronization Flow

This document explains the **exact, real-world signup and role assignment flow** implemented in this CarPool project. It is based directly on the actual codebase—not a generic tutorial.

---

## 🎯 Executive Summary for Mentors

### The Key Question
> **“In MY project, the role is coming from ______ and the backend reads it from ______.”**

### The Precise Answer
> **“In MY project, the role is coming from the Frontend `RoleSelectionModal.jsx` (sent in the HTTP request body `req.body.role` to `POST /api/users/auth/register`), and the backend reads it from `req.body.role` during registration, stores it in both Clerk metadata (`publicMetadata.carPoolRole`) and the MySQL database (`users.role`), and subsequently reads it from the MySQL database (`users.role`) whenever executing ride actions (`CreateRide` and `JoinRide`).”**

---

## 🧭 Flow Architecture Diagram

The diagram below maps **where the role is created, where it is stored, where it travels, and where the backend reads it**:

```text
                                USER INTERACTION
                                       │
                                       ▼
                       [1] Frontend: Sign Up Button
                       (Navbar.jsx or SignUp.jsx)
                                       │
                                       ▼
                         [2] Clerk Auth Component
                        (<SignUp /> / Clerk Modal)
                                       │
                       (User enters email & password)
                                       │
                                       ▼
                        [3] Clerk Cloud / Server
                     Creates Clerk user (user_2xxxx)
                     Generates Session & JWT Token
                    (NOTE: Role is NOT known yet!)
                                       │
                                       ▼
                    [4] Frontend: AuthProfileContext.jsx
                      Obtains Token: await getToken()
                                       │
                                       ▼
                     [5] Check Local Profile in MySQL
                       GET /api/users/me
                       Authorization: Bearer <JWT>
                                       │
                                       ▼
                    [6] Backend: requireClerkAuth & UserController
                       Verifies token via getAuth(req)
                       Queries MySQL: getUserByClerkUserId
                                       │
                     ┌─────────────────┴─────────────────┐
                     │                                   │
              [User Found in DB]                 [User Not in DB (New)]
                     │                                   │
             Returns HTTP 200                     Returns HTTP 404
             User is logged in                  "No local user profile"
                                                         │
                                                         ▼
                                          [7] Frontend Detects 404
                                            setNeedsOnboarding(true)
                                                         │
                                                         ▼
                                          [8] RoleSelectionModal.jsx
                                         ★ ROLE CREATED HERE BY USER ★
                                         User picks: PASSENGER or DRIVER
                                                         │
                                                         ▼
                                          [9] Complete Onboarding Request
                                         ★ ROLE TRAVELS IN REQUEST BODY ★
                                         POST /api/users/auth/register
                                         Headers: Authorization: Bearer <token>
                                         Body: { role: "PASSENGER", name, email }
                                                         │
                                                         ▼
                                        [10] Backend Express Middlewares
                                         1. clerkMiddleware(): reads Bearer
                                         2. requireClerkAuth: getAuth(req) -> userId
                                         3. validateCreateUser: checks req.body.role
                                                         │
                                                         ▼
                                        [11] UserController.registerAuthenticatedUser
                                         ★ BACKEND READS ROLE FROM req.body.role ★
                                         1. clerkUserId = req.clerkAuth.userId
                                         2. role = req.body.role
                                                         │
                                          ┌──────────────┴──────────────┐
                                          │                             │
                                          ▼                             ▼
                            [12A] Stores in Clerk        [12B] Stores in MySQL
                              clerkClient.users.            CreateUser Use Case
                              updateUserMetadata()          MySQLUserRepository
                           publicMetadata: carPoolRole      INSERT INTO users
                                                      (clerk_user_id, role, name, email)
                                          │                             │
                                          └──────────────┬──────────────┘
                                                         │
                                                         ▼
                                         [13] Backend Returns HTTP 201
                                          { id: 4, name: "...", role: "PASSENGER" }
                                                         │
                                                         ▼
                                         [14] Frontend AuthProfileContext
                                          setDbUser(user); setNeedsOnboarding(false)
                                          Modal closes. User is ready!
                                                         │
                                                         ▼
                                  SUBSEQUENT ACTIONS (CreateRide / JoinRide)
                                                         │
                                                         ▼
                                  ★ BACKEND READS ROLE FROM MySQL DATABASE ★
                                  - CreateRide: userRepository.findById(driverId)
                                    Checks: driver.role === 'DRIVER'
                                  - JoinRide: userRepository.findById(passengerId)
                                    Checks: passenger.role === 'PASSENGER'
```

---

## ❓ 15 Critical Questions Answered (Step-by-Step)

### 1. Where does signup start in the frontend?
In the navigation bar (`Car-Pool-Frontend/src/components/Navbar.jsx`) when the user clicks the `<SignUpButton mode="modal">`, or when the user navigates directly to the `/sign-up` page (`Car-Pool-Frontend/src/pages/SignUp.jsx`).

### 2. Which Clerk component/function handles signup?
- If using modal: Clerk's `<SignUpButton mode="modal">` opens the embedded Clerk sign-up modal.
- If using page: The `<ClerkSignUp routing="path" path="/sign-up" />` component from `@clerk/react`.

### 3. What data does Clerk create/return?
Clerk creates a User object in Clerk's cloud containing:
- `id`: unique Clerk user identifier (e.g., `user_2t1aBc...`).
- `primaryEmailAddress`: the verified email address.
- `firstName`, `lastName`, `fullName`.
- A session object containing a signed JWT authentication token.

### 4. Where does the Clerk user ID come from?
The Clerk server automatically generates it upon account creation. It is a string prefixed with `user_` (e.g., `user_2tG...`).

### 5. How is the user's role assigned and stored?
- The role is **not assigned during the initial Clerk sign-up form**.
- Instead, upon signing in, the frontend queries `GET /api/users/me`. Since the user is new, MySQL returns `404 Not Found`.
- The frontend then displays `RoleSelectionModal.jsx`, where the user explicitly chooses **`PASSENGER`** or **`DRIVER`**.
- Once chosen, the role is stored in **two places**:
  1. **Clerk Cloud**: In `publicMetadata.carPoolRole` via `clerkClient.users.updateUserMetadata()`.
  2. **MySQL Database**: In the `users` table (`role` column: `ENUM('DRIVER', 'PASSENGER')`).

### 6. How is the role included in Clerk data/token/metadata based on actual implementation?
In `UserController.registerAuthenticatedUser()`, the backend executes:
```javascript
await clerkClient.users.updateUserMetadata(clerkUserId, {
    publicMetadata: {
        carPoolRole: role
    }
});
```
This permanently writes `carPoolRole` into the user's Clerk `publicMetadata`.

### 7. How does the frontend obtain the authentication token/session?
In `Car-Pool-Frontend/src/context/AuthProfileContext.jsx`, using the Clerk React hook `useAuth()`:
```javascript
const { getToken } = useAuth();
const token = await getToken();
```
`getToken()` fetches the signed session JWT directly from Clerk's client SDK.

### 8. How is the token sent to the backend?
In `Car-Pool-Frontend/src/services/apiClient.js`, the token is attached as an HTTP `Authorization` header:
```javascript
requestHeaders['Authorization'] = `Bearer ${token}`;
```

### 9. Which frontend file sends the API request?
- For profile check: `Car-Pool-Frontend/src/services/userService.js` (`getCurrentUser`).
- For role onboarding: `Car-Pool-Frontend/src/services/userService.js` (`registerAuthenticatedUser`).

### 10. Which backend middleware receives and verifies the Clerk token?
Two middlewares in `Car-Pool-Backend`:
1. `clerkMiddleware()` in `src/app.js`: parses the `Authorization: Bearer <token>` header.
2. `requireClerkAuth` in `src/adapters/inbound/http/middleware/requireClerkAuth.js`:
   ```javascript
   const auth = getAuth(req);
   if (!auth.isAuthenticated || !auth.userId) {
       return res.status(401).json({ success: false, error: "Unauthorized" });
   }
   req.clerkAuth = auth;
   next();
   ```

### 11. How does the backend get the authenticated user's information?
- The backend gets `clerkUserId` from `req.clerkAuth.userId`.
- The backend fetches the user's email and profile details directly from Clerk's backend SDK:
  ```javascript
  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const clerkEmail = clerkUser.primaryEmailAddress?.emailAddress;
  ```

### 12. How does the backend get the user's role?
- **During Registration (`POST /api/users/auth/register`)**: The backend reads the role from the request body:
  ```javascript
  const { role } = req.body; // Sent from RoleSelectionModal
  ```
- **During Ride Actions (`POST /api/rides`, `POST /api/rides/:id/join`)**: The backend reads the role from the **MySQL database**:
  ```javascript
  const user = await this.userRepository.findById(userId);
  if (user.role !== "DRIVER") { ... }
  ```

### 13. Which controller/service/use case handles the request?
1. Controller: `Car-Pool-Backend/src/adapters/inbound/http/controllers/UserController.js` (`registerAuthenticatedUser`).
2. Use Case: `Car-Pool-Backend/src/application/useCases/CreateUser.js`.
3. Outbound Repository: `Car-Pool-Backend/src/adapters/outbound/persistence/MySQLUserRepository.js`.

### 14. How is user data finally stored in MySQL?
In `MySQLUserRepository.js`, via an SQL `INSERT` statement:
```sql
INSERT INTO users (clerk_user_id, name, email, role)
VALUES (?, ?, ?, ?)
```
Parameters:
- `user.clerkUserId`: `user_2t...`
- `user.name`: user's full name
- `user.email`: user's primary Clerk email
- `user.role`: `'DRIVER'` or `'PASSENGER'`

### 15. What response comes back to the frontend?
The backend returns HTTP `201 Created` with the JSON representation of the MySQL user:
```json
{
  "id": 4,
  "clerkUserId": "user_2t...",
  "name": "Alex Carter",
  "email": "alex@example.com",
  "role": "PASSENGER"
}
```
The frontend saves this object in React state (`setDbUser(user)`), turns off `needsOnboarding`, closes the modal, and the user is immediately active!

---

## 📂 File-by-File & Code-by-Code Explanation

---

### File 1: `Car-Pool-Frontend/src/components/Navbar.jsx`
- **Purpose**: Entry point for user authentication in the UI.
- **Important code**:
  ```jsx
  <SignUpButton mode="modal">
    <button className="btn btn-primary">Sign Up</button>
  </SignUpButton>
  ```
- **What happens**: Clicking "Sign Up" opens Clerk's modal dialog.
- **Why it is needed**: Triggers the initial Clerk account creation flow.
- **Next file**: Clerk's internal modal component / Clerk Cloud.

---

### File 2: Clerk Cloud Authentication
- **Purpose**: Authenticates the user credentials and issues session tokens.
- **Important code**: Executed on Clerk's hosted server.
- **What happens**: Clerk validates user email and password, creates the `user_...` record, and returns an active session token to the browser.
- **Why it is needed**: Offloads password hashing, session tokens, and security to Clerk.
- **Next file**: `Car-Pool-Frontend/src/context/AuthProfileContext.jsx`.

---

### File 3: `Car-Pool-Frontend/src/context/AuthProfileContext.jsx`
- **Purpose**: Checks whether the authenticated Clerk user has an existing database profile.
- **Important code**:
  ```javascript
  const token = await getToken();
  try {
    const user = await getCurrentUser(token);
    setDbUser(user);
    setNeedsOnboarding(false);
  } catch (err) {
    if (err.status === 404 || err.message?.includes('404')) {
      setNeedsOnboarding(true); // User is in Clerk, but not in MySQL!
    }
  }
  ```
- **What happens**: Calls `GET /api/users/me`. If the backend returns 404, it marks `needsOnboarding = true`.
- **Why it is needed**: Connects Clerk's authentication state to MySQL's application database.
- **Next file**: `Car-Pool-Frontend/src/components/RoleSelectionModal.jsx`.

---

### File 4: `Car-Pool-Frontend/src/components/RoleSelectionModal.jsx`
- **Purpose**: Prompts newly registered users to pick their application role.
- **Important code**:
  ```jsx
  <div onClick={() => setRole('PASSENGER')}>Passenger</div>
  <div onClick={() => setRole('DRIVER')}>Driver</div>
  <button onClick={handleSubmit}>Confirm as {role}</button>
  ```
- **What happens**: User clicks "Driver" or "Passenger". Submitting calls `completeOnboarding({ role, name, email })`.
- **Why it is needed**: Standard Clerk sign-up does not know about CarPool roles. This step collects the role explicitly.
- **Next file**: `Car-Pool-Frontend/src/services/userService.js`.

---

### File 5: `Car-Pool-Frontend/src/services/userService.js`
- **Purpose**: Dispatches the registration HTTP request to the backend.
- **Important code**:
  ```javascript
  export async function registerAuthenticatedUser(token, { name, email, role }) {
    const response = await apiClient('/api/users/auth/register', {
      method: 'POST',
      token,
      body: { name, email, role },
    });
    return response.json();
  }
  ```
- **What happens**: Packages the Bearer token in the headers and sends `{ role, name, email }` in the JSON body.
- **Why it is needed**: Serves as the API service layer communicating with the Express backend.
- **Next file**: `Car-Pool-Frontend/src/services/apiClient.js`.

---

### File 6: `Car-Pool-Frontend/src/services/apiClient.js`
- **Purpose**: Centralized fetch wrapper adding authorization headers.
- **Important code**:
  ```javascript
  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }
  ```
- **What happens**: Sends the HTTP POST request to `http://localhost:3000/api/users/auth/register`.
- **Why it is needed**: Attaches the Clerk Bearer token so backend middleware can verify identity.
- **Next file**: `Car-Pool-Backend/src/app.js`.

---

### File 7: `Car-Pool-Backend/src/app.js`
- **Purpose**: Initializes Express server, CORS, Clerk middleware, and route mounting.
- **Important code**:
  ```javascript
  app.use(clerkMiddleware());
  app.use(express.json());
  app.use("/api/users", createUserRoutes(userController));
  ```
- **What happens**: Parses Clerk authentication from incoming headers and forwards `/api/users` requests to user routes.
- **Why it is needed**: Core application entry point and middleware pipeline.
- **Next file**: `Car-Pool-Backend/src/adapters/inbound/http/middleware/requireClerkAuth.js`.

---

### File 8: `Car-Pool-Backend/src/adapters/inbound/http/middleware/requireClerkAuth.js`
- **Purpose**: Guards protected endpoints against unauthorized requests.
- **Important code**:
  ```javascript
  const auth = getAuth(req);
  if (!auth.isAuthenticated || !auth.userId) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
  req.clerkAuth = auth;
  next();
  ```
- **What happens**: Cryptographically verifies the Clerk JWT. Extracts `userId` and attaches it to `req.clerkAuth`.
- **Why it is needed**: Ensures that only requests with a valid Clerk session can register a database profile.
- **Next file**: `Car-Pool-Backend/src/adapters/inbound/http/validators/userValidator.js`.

---

### File 9: `Car-Pool-Backend/src/adapters/inbound/http/validators/userValidator.js`
- **Purpose**: Validates payload structure before reaching controller logic.
- **Important code**:
  ```javascript
  if (!["DRIVER", "PASSENGER"].includes(role)) {
    return res.status(400).json({ success: false, message: "Role must be DRIVER or PASSENGER" });
  }
  ```
- **What happens**: Validates `name`, `email`, and `role`. Returns HTTP 400 if invalid.
- **Why it is needed**: Protects database integrity against bad or corrupted inputs.
- **Next file**: `Car-Pool-Backend/src/adapters/inbound/http/controllers/UserController.js`.

---

### File 10: `Car-Pool-Backend/src/adapters/inbound/http/controllers/UserController.js`
- **Purpose**: Coordinates role metadata update in Clerk and record creation in MySQL.
- **Important code**:
  ```javascript
  const clerkUserId = req.clerkAuth.userId;
  const { role } = req.body;

  // 1. Store role in Clerk publicMetadata
  await clerkClient.users.updateUserMetadata(clerkUserId, {
    publicMetadata: { carPoolRole: role }
  });

  // 2. Insert into MySQL database
  const user = await this.createUser.execute({
    ...req.body,
    email: clerkEmail,
    clerkUserId
  });
  res.status(201).json(user);
  ```
- **What happens**: Reads `role` from `req.body.role`, saves it to Clerk metadata, and calls the `CreateUser` use case.
- **Why it is needed**: Orchestrates the sync between Clerk identity and local database records.
- **Next file**: `Car-Pool-Backend/src/application/useCases/CreateUser.js`.

---

### File 11: `Car-Pool-Backend/src/application/useCases/CreateUser.js`
- **Purpose**: Pure business logic use case for user creation.
- **Important code**:
  ```javascript
  async execute(userData) {
    const user = new User(userData);
    return await this.userRepository.create(user);
  }
  ```
- **What happens**: Instantiates a domain `User` entity and delegates persistence to the repository port.
- **Why it is needed**: Hexagonal / Clean Architecture separation between business logic and database persistence.
- **Next file**: `Car-Pool-Backend/src/adapters/outbound/persistence/MySQLUserRepository.js`.

---

### File 12: `Car-Pool-Backend/src/adapters/outbound/persistence/MySQLUserRepository.js`
- **Purpose**: Executes SQL statements against the MySQL database.
- **Important code**:
  ```javascript
  const query = `
    INSERT INTO users (clerk_user_id, name, email, role)
    VALUES (?, ?, ?, ?)
  `;
  const [result] = await this.pool.execute(query, [
    user.clerkUserId,
    user.name,
    user.email,
    user.role
  ]);
  return { id: result.insertId, ...user };
  ```
- **What happens**: Inserts a new row into the `users` table and returns the generated database `id`.
- **Why it is needed**: Persists the user record so rides and bookings can reference a relational Foreign Key (`driver_id`, `passenger_id`).
- **Next file**: Returned back through HTTP pipeline to `AuthProfileContext.jsx`.

---

## 🔍 Clarification on Webhook vs. Frontend API

### The Existing Issue in Code:
In `Car-Pool-Backend/src/adapters/inbound/http/controllers/UserController.js`, there is an alternative sync method:
```javascript
async syncClerkUserFromWebhook(req, res, next) {
    ...
    const role = clerkUser.public_metadata?.carPoolRole;
    if (!['DRIVER', 'PASSENGER'].includes(role)) {
        return res.status(422).json({
            success: false,
            message: "Clerk publicMetadata.carPoolRole must be DRIVER or PASSENGER."
        });
    }
}
```

### Why this is confusing:
- When a user signs up on Clerk, Clerk immediately fires a `user.created` webhook event.
- At that initial instant, `clerkUser.public_metadata.carPoolRole` is `undefined` because standard Clerk signup does not ask for the role.
- Thus, the webhook returns HTTP `422 Unprocessable Entity`!

### The Minimum Required Correction:
- **Understand that the Frontend API flow (`POST /api/users/auth/register`) is the primary, working mechanism in this project.**
- The webhook is designed for setups where role metadata is pre-assigned before signup (e.g. via invite links or backend webhooks).
- For local development and mentor presentations, **`POST /api/users/auth/register` via `RoleSelectionModal.jsx` is the intended, 100% reliable path**.
