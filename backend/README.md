# 🚕 Uber Clone Backend - Complete File & Architecture Trace
*A highly scalable, production-grade microservices backend for an Uber-style ride-hailing app.*

This document strictly defines every file that has been created and engineered in this project up to this point, detailing exactly how the Node.js architecture operates from the ground up to support massive scale.

---

## 📂 1. Database & Schema Architecture (`/prisma/`)
The single source of truth for persistent storage.

* **`schema.prisma`**
  * Built using PostgreSQL.
  * We enforced UUIDs (`String @id @default(uuid())`) across every single model to ensure zero collision when scaling.
  * **Models Created:** `User`, `Driver`, `Vehicle`, `DriverDocument`, `PaymentMethod`, `LoginAttempt`, `Ride`, `EmergencyContact`.
  * Strictly applied database-level `@@index`ing on frequently searched columns to maintain `O(log N)` search speeds.

---

## 📂 2. Core Server Setup (`/src/`)
The foundational entry points for the Express application.

* **`server.ts`**: The main bootloader. Initializes the Prisma database connection, connects to the Redis clusters, and boots the HTTP server on Port 5000.
* **`app.ts`**: The Express application hub. 
  * Injects security via **Helmet**.
  * Applies **CORS** restrictions (allowing only the specific frontend URL).
  * Mounts the global `/api/...` routers.
  * Applies a centralized `globalErrorHandler` so API failures return a standardized `{ "error", "message", "traceId" }` instead of crashing the server.

---

## 📂 3. Configuration & Observability (`/src/config/`)
Strict configuration logic that prevents the app from starting if variables are missing.

* **`env.ts`**: Uses `dotenv` to load secrets. It manually checks for `JWT_SECRET`, `REDIS_URL`, etc., throwing a hard crash error if any production secrets are missing.
* **`logger.ts`**: Configures **Winston** to print structured JSON logs (vital for tracking bugs across microservices).
* **`redis.ts`**: Connects the standard `node-redis (v4)` client. This is used strictly for Caching, Rate Limiting (via Lua Scripts), and GEO queries.
* **`bullmq.ts`**: Separately exports an `ioredis` connection strictly designed to power the background job queues.

---

## 📂 4. The Auth Service (Production Hardened API)
Responsible for onboarding, login security, and session management.

* **`routes/auth.routes.ts`**: Routes mapping `POST /signup`, `POST /login`, `POST /refresh`.
* **`controllers/auth.controller.ts`**: Parses HTTP Requests and sends JSON Responses (or HTTP-Only secure Cookies containing the JWTs).
* **`validators/auth.validator.ts`**: Uses **Zod** to strictly validate emails, passwords, and names before they ever reach the DB.
* **`services/auth.service.ts`** *(The Heavy Business Logic)*:
  * **JWT Generation:** Creates short-lived access tokens and long-lived refresh tokens.
  * **Device Fingerprinting:** Limits users to 5 active sessions. Automatically evicts the oldest session from Redis if a 6th device logs in.
  * **Brute-Force Guard:** Reads/Writes to the `LoginAttempt` DB table. If a user fails 5 passwords, it mathematically locks their account out.
  * **Async OTP Dispatch:** Pushes an OTP generation payload instantly to a BullMQ worker so the user gets a `200 OK` response in 5ms without waiting for an external SMS API to answer.

---

## 📂 5. The User & Driver Services
Responsible for profile management and driver fleet onboarding.

* **`routes/user.routes.ts`** / **`user.controller.ts`**: Endpoints for updating names, uploading profile pictures, and fetching `PaymentMethod` secure models.
* **`routes/driver.routes.ts`** / **`driver.controller.ts`**: Endpoints for switching a driver's status `ONLINE`/`OFFLINE` and attaching a `Vehicle` model.
* **`services/driver.service.ts`**: 
  * Verifies unique License Plates.
  * Handled Driver Document Uploads. Instead of verifying them instantly (which requires heavy AI), it pushes an image URL to the `ocr-queue` to verify in the background asynchronously.

---

## 📂 6. The Queue System (Background Workers) (`/src/queues/`)
Offloads massive CPU-blocking tasks specifically to keep Express APIs screaming fast.

* **`notification.queue.ts`**: A BullMQ worker that executes `sendEmail` or `sendSMS`. It has 5 automated exponential retries built-in, so if Twilio crashes, the user still gets their OTP automatically 10 seconds later.
* **`ocr.queue.ts`**: A BullMQ worker that intercepts Driver Document uploads, artificially sleeps for 3-5 seconds (mimicking an AI text scanner), and automatically marks the driver's document as `VERIFIED` in Prisma.

---

## 📂 7. The Location Service (`/src/services/location.service.ts`)
The mathematical proximity engine replacing traditional slow Database queries.

* Uses **Redis `GEOADD`** to rapidly cache a driver's `longitude/latitude`.
* Uses **Redis `GEOSEARCH`** to execute a lightning-fast radius query to find exact drivers within 5km for matchmaking.
* Built out a pure math **Haversine formula** function to calculate direct-distance ETA times in `O(1)` time complexity without pinging Google Maps constantly.

---

## 📂 8. Middlewares (`/src/middlewares/`)
The invisible shields wrapping the API routes.

* **`auth.middleware.ts`**: Extracts the signed JWT from the HTTP-Only cookie, verifies the cryptographic signature, and injects the `req.user` ID into the specific routes.
* **`validate.middleware.ts`**: A generic interceptor that catches bad `Zod` inputs and halts requests.
* **`ratelimiter.middleware.ts`**: Injects a custom ATOMIC Lua script directly into Redis to violently cut off client IPs attempting to spam endpoints or DDoS the server.

---

## 📂 9. Future Architecture Blueprint (`/src/mvp.md`)
The 15-year Senior Architect master plan that maps out exactly how the next 3 Microservices will function.

1. **Master System Rules:** Restricts Claude to generating strictly distributed `traceId` context logs, Webhook-first payments, and Zod security checks.
2. **Rider Service Saga:** Instructs Claude exactly how to emit `RIDE_REQUESTED` and handle the Kafka SAGA failure loop if payments don't clear (`COMPLETED_UNPAID`).
3. **Matching Algorithm:** Uses a Min-Heap algorithm coupled with Atomic Lua `SET NX` Redis locks to dispatch 3 drivers at a time safely.
4. **Resilient Stripe Payments:** Includes instructions to wrap the API Gateway with `opossum` Circuit Breakers to fail-fast if external Payment APIs crash.
