# 👑 MASTER SYSTEM ARCHITECTURE RULES 
*(Give this directly to Claude as your core system prompt)*

Build a production-grade Uber-like backend using microservices (15-Year Senior Architect Guidelines).

> **Implementation Status Legend:** ✅ = Fully coded & operational | ⚠️ = Partially implemented | 📐 = Architecture design only (not yet coded)

**Requirements:**

### 1. GLOBAL ARCHITECTURE (STRICT)
- **API Gateway:** All traffic routes here. Validates JWT, sets rate limits, and proxies reverse traffic. Injects `X-User-Id`, `X-Role`, and `X-Trace-Id` headers. Downstream services must NEVER decode JWTs.
- **Logging:** Structured JSON logging ONLY (Pino). Propagate `traceId` across Kafka/BullMQ via `AsyncLocalStorage`.
- **Metrics:** Expose `/metrics` (Prometheus via `prom-client`) with latency histograms and request counters. Protect with `METRICS_TOKEN` in production.
- **Documentation:** Expose `/api-docs` (Swagger/OpenAPI 3.0) using `swagger-jsdoc` and `swagger-ui-express`. All endpoints MUST be annotated. ✅
- **Environment & Secrets:** Hardcode NOTHING. Use `dotenv` everywhere. Secrets (Stripe Keys, JWT Salts) must strictly be managed via environment variables. Create a centralized config validation step on startup (App will crash if env is missing).
- **Error Contract:** Every API must return failures in this EXACT format, no exceptions:
  ```json
  { "success": false, "message": "Clear explanation", "traceId": "uuid-trace-id" }
  ```
  Success responses:
  ```json
  { "success": true, "message": "Description", "traceId": "uuid-trace-id", "data": { ... } }
  ```

### 2. TRANSACTIONAL OUTBOX PATTERN ✅
> **Status:** Fully implemented — `OutboxEvent` model in `schema.prisma`, transactional helper in `utils/outbox.ts`, BullMQ relay worker in `queues/outboxRelay.queue.ts`. All Kafka-producing write paths in Ride, Payment, and Admin services now use atomic `prisma.$transaction()` with outbox inserts. Matching Service is exempt (no DB writes to co-locate with).

- **Problem:** If the app crashes between a DB write and Kafka publish, the event is lost forever and the system enters an inconsistent state.
- **Solution (Target Architecture):** Every service producing Kafka events SHOULD use the Outbox pattern:
  1. DB Write + Outbox Insert in the **SAME Prisma transaction**.
  2. A background poller (BullMQ repeatable job) reads unpublished rows from the `OutboxEvent` table and publishes to Kafka.
  3. After successful Kafka publish, mark the row as `published = true`.
- **Schema:**
  ```prisma
  model OutboxEvent {
    id          String   @id @default(uuid())
    topic       String
    payload     Json
    published   Boolean  @default(false)
    createdAt   DateTime @default(now())

    @@index([published, createdAt])
  }
  ```

### 3. WEBSOCKET GATEWAY
- WebSockets are hosted centrally at the **API Gateway** layer (or a Dedicated Notification Service).
- **Architecture:** Backed by a **Redis Pub/Sub Adapter** (via `@socket.io/redis-adapter`). Microservices do NOT hold raw socket connections. They publish events to Redis, and the WS Gateway emits them to clients.
- **Rooms:** `ride:{rideId}`, `driver:{driverId}`. Support reconnection state recovery.
- **Redis Keys:**
  * `ws:session:{userId}` → String (Socket ID) `EX 3600` — Maps userId to active socket for reconnection
  * `ws:room:{rideId}` → SET (User IDs in room) `EX 86400`
- **Reconnection:** On client reconnect, check `ws:session:{userId}` to rejoin the correct room. If the key expired, query DB for active ride and re-join.

### 4. EVENT-DRIVEN SAGA (KAFKA OWNERSHIP METADATA)
- Use Kafka for core state changes complying with the CloudEvents standard:
  `{ "eventId", "version", "type", "source", "timestamp", "traceId", "payload" }`
  
**Strict Producer/Consumer Matrix:**
1. `RIDE_REQUESTED` → **Produced by:** Rider Service | **Consumed by:** Matching Service, Analytics Service.
2. `DRIVER_ASSIGNED` → **Produced by:** Matching Service | **Consumed by:** Rider Service, Analytics Service.
3. `RIDE_COMPLETED` → **Produced by:** Rider Service | **Consumed by:** Payment Service (Intent Trigger), Notification Service (Receipt Email), Analytics Service.
4. `RIDE_CANCELLED` → **Produced by:** Rider Service | **Consumed by:** Matching Service (Release driver lock), Analytics Service.
5. `MATCH_FAILED` → **Produced by:** Matching Service | **Consumed by:** Rider Service (Status update), Notification Service (Push to Rider).
6. `PAYMENT_SUCCESS` / `PAYMENT_FAILED` → **Produced by:** Payment Service Webhook | **Consumed by:** Rider Service (To complete SAGA), Notification Service.

**Kafka DLQ Strategy (MANDATORY):**
- Every consumer group MUST define a DLQ topic: `{original-topic}.dlq`
- After **5 failed processing attempts**, produce the event to the DLQ topic and commit the original offset.
- Track retry count in Redis: `kafka:retry:{topic}:{eventId}` → Counter `EX 86400`.
- DLQ events must be monitored and alertable via Prometheus metrics (`kafka_dlq_events_total`).

### 5. BROKERS & QUEUES (SEGREGATION OF DUTIES)
- **BullMQ (Redis via IORedis):** Background jobs, delays, retries, cron jobs. Global rule: ALL BullMQ queues strictly mandate 5 retries with Exponential Backoff.
- **Kafka:** Distributed Domain Events (Pub/Sub SAGA choreography) & real-time routing (e.g. `driver.dispatch` topic for low-latency delivery).

### 6. DB, REDIS, & SECURITY
- **Redis State:** GEO Indexing, Caching, Locks (`SET NX`). All keys MUST have `EX` TTL. Use Lua scripts for safe lock release.
- **Security:** Input boundary entirely validated by `Zod`. Never trust client data (especially prices/fees/surge). Surge multiplier MUST be calculated server-side.
- **Pagination:** DB queries must use `cursor`-based pagination using UUID `id` with `createdAt` ordering (O(logN) index scanning).
- **Rate Limiting:** For authenticated routes, rate limit by `userId` (not IP). For unauthenticated routes (login, signup), rate limit by IP+email. Use atomic Lua script (`INCR` + conditional `EXPIRE`) to prevent race conditions.

### 7. REST API CONVENTIONS
- **URL Params for resource identifiers:** `PATCH /rides/:rideId/cancel` (not `rideId` in body).
- **GET for reads:** `GET /rides/history?cursor=x&limit=10` (not POST for queries).
- **POST for creation:** `POST /rides` to create a new ride.
- **Consistent response shape** via `apiResponse()` utility.



<br><br><br>
---
---
<br><br><br>

# 🔐 Auth Service MVP ✅

> **Status:** Fully implemented — `auth.service.ts`, `auth.controller.ts`, `auth.middleware.ts`

## 🎯 Goal
Robust, highly-secure authentication system with:
* Rate Limiting & Account locking (Fail-closed execution)
* JWT session lifecycle with device fingerprinting and max device caps
* OTP fallback with strict limits and BullMQ delayed retry delivery
* Blacklist checking using Redis caching

---

## 🧱 PRISMA SCHEMA

```prisma
model User {
  id               String         @id @default(uuid())
  name             String
  email            String         @unique
  password         String
  phone            String?        @unique
  profilePhotoUrl  String?
  role             UserRole       @default(USER)
  isActive         Boolean        @default(true)

  failedAttempts   Int            @default(0)
  lockedUntil      DateTime?

  tokenVersion     Int            @default(0)

  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  loginAttempts    LoginAttempt[]
  driver           Driver?
  paymentMethods   PaymentMethod[]
  rides            Ride[]

  @@index([phone])
}

enum UserRole {
  USER
  DRIVER
  ADMIN
}

model LoginAttempt {
  id        String           @id @default(uuid())
  email     String
  ip        String
  userId    String?
  type      LoginAttemptType @default(FAILED)
  createdAt DateTime         @default(now())

  user      User?            @relation(fields: [userId], references: [id])

  @@index([email])
  @@index([ip])
  @@index([type])
  @@index([email, createdAt])
  @@index([ip, createdAt])
  @@index([userId, createdAt])
}

enum LoginAttemptType {
  FAILED
  OTP_PENDING
  SUCCESS
}
```

---

## ⚙️ REDIS DESIGN
* `login_rate:{ip}:{email}` → Rate limits (Atomic Lua INCR + conditional EXPIRE)
* `signup_rate:{ip}` → Signup rate limits
* `user_sessions:{userId}` → ZSET (Managing active sessions max cap)
* `user_devices:{userId}` → ZSET (Device fingerprints mapped to TTL, evict via Lua `ZADD` + `ZPOPMIN`)
* `otp:{email}:{requestId}` → String `EX 300` (5 min OTP TTL)
* `otp_attempts:{email}:{requestId}` → Counter `EX 300`
* `otp_global_attempts:{email}` → Counter `EX 300`
* `otp_global_block:{email}` → String `EX 86400` (24h block)
* `otp_rate:{email}` → Counter `EX 60` (3 per minute)
* `refresh:{userId}:{tokenId}` → String `EX 604800` (7 days)
* `access_blacklist:{token}` → String `EX {remaining TTL}` (Revoked tokens)
* `pending_device:{email}:{requestId}` → String `EX 300` (Device awaiting OTP verification, TTL matches OTP)
* `user_pending_devices:{userId}` → SET `EX 300` (Tracks pending requestIds per user for cleanup on logoutAll)

---

## 🚀 CORE FUNCTIONS & FLOW
1. **Signup:** Enforce strict password strength at service layer (3 of 4 categories: upper, lower, digit, special). Enforce signup rate limit per IP. Hash password (bcrypt, 12 rounds). Create User in DB.
2. **Login:** Assess Risk Level via Device Fingerprinting (SHA-256 of `browser|os`, IP excluded for mobile). Enforce account lock timeouts (`lockedUntil`) and `checkLoginRateLimit()`. If SAFE device → issue tokens directly. If HIGH_RISK → trigger OTP flow.
3. **Handle MFA/OTP:** OTP rate limit (`3 per 60s`). Check 24h block FIRST (survives TTL expiry). Increment global counter BEFORE OTP check (expired OTP burns budget). Per-requestId attempt limit (`5`). Global attempt limit (`20`) → 24h block. Deliver OTP via BullMQ (SMS-first, email fallback). Admin can `unlockOTPBlock()`.
4. **Token Generation & Blacklisting:** `tokenVersion` embedded in both JWT types. Password change increments version → invalidates all tokens globally. Use atomic Redis pipeline to `storeRefreshToken` up to `MAX_DEVICES=5`, evicting older ones using Lua script (`ZADD` + `ZPOPMIN`). Blacklist access tokens on logout with TTL = remaining token lifetime.
5. **Observability:** Centralized `traceId` propagation via `AsyncLocalStorage`. Security events correctly mapped via `safeAudit()`. Non-crashing `safeMetric()` wrapper for Prometheus counters. `safeAlert()` for security alerting.

<br><br><br>
---
---
<br><br><br>

# 👤 User Service MVP ✅

> **Status:** Fully implemented — `user.service.ts`, `user.controller.ts`

## 🎯 Goal
General user profile and lifecycle management platform handling:
* Secure profile CRUD (Name, Phone, Profile Images)
* Cache invalidation using Redis
* Payment methodology associations

---

## 🧱 PRISMA SCHEMA

```prisma
model PaymentMethod {
  id          String          @id @default(uuid())
  userId      String
  provider    PaymentProvider
  last4       String
  label       String?
  isDefault   Boolean         @default(false)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  user        User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

enum PaymentProvider {
  STRIPE
  RAZORPAY
  UPI
}
```

---

## ⚙️ REDIS DESIGN
* `user_profile:{userId}` → String (User cache invalidated dynamically on DB updates)

---

## 🚀 CORE FUNCTIONS
1. **Profile Management:** Implement logic for `getProfile`, `updateProfile`, and `uploadProfilePicture`. Manage `user_profile:{userId}` invalidations. Phone uniqueness check on update.
2. **Security Controls:** Handle `changePassword` (verify old password, enforce strength at service layer, increment `tokenVersion`, bcrypt 12 rounds) and `deactivateAccount`. For both operations, call `logoutAll` ensuring no dangling sessions exist.
3. **Payment Bindings:** Manage the assignment of external `paymentMethods` (provider enum, last4 digits, optional label, isDefault flag).

<br><br><br>
---
---
<br><br><br>

# 🚗 Driver Service MVP ✅

> **Status:** Fully implemented — `driver.service.ts`, `driver.controller.ts`, OCR queue operational.

## 🎯 Goal
Strictly audited lifecycle management for platform drivers, controlling:
* Vehicle configurations & driver statuses
* Document uploads and verifications 
* OCR verifications for supplied documents (Asynchronously via BullMQ)

---

## 🧱 PRISMA SCHEMA

```prisma
model Driver {
  id            String           @id @default(uuid())
  userId        String           @unique
  vehicleNumber String
  licenseNumber String           @unique
  status        DriverStatus     @default(OFFLINE)
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  user          User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  vehicle       Vehicle?
  documents     DriverDocument[]
  rides         Ride[]

  @@index([userId])
  @@index([status])
}

model Vehicle {
  id           String      @id @default(uuid())
  driverId     String      @unique
  type         VehicleType
  make         String
  model        String
  year         Int
  licensePlate String      @unique
  color        String
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  driver       Driver      @relation(fields: [driverId], references: [id], onDelete: Cascade)

  @@index([driverId])
  @@index([licensePlate])
}

model DriverDocument {
  id           String       @id @default(uuid())
  driverId     String
  type         DocumentType
  documentUrl  String
  verified     Boolean      @default(false)
  expiresAt    DateTime?
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  driver       Driver       @relation(fields: [driverId], references: [id], onDelete: Cascade)

  @@index([driverId])
  @@index([driverId, type])
  @@index([verified])
  @@index([expiresAt])
}

enum DriverStatus {
  AVAILABLE
  BUSY
  OFFLINE
}

enum VehicleType {
  SEDAN
  SUV
  HATCHBACK
  AUTO
  BIKE
}

enum DocumentType {
  LICENSE
  REGISTRATION
  INSURANCE
  AADHAR
  PAN
}
```

---

## ⚙️ BULLMQ QUEUES
* `ocr-verification-queue`: Triggers document parsing after upload (e.g. License Validations). 5 retries, exponential backoff (3s base). Concurrency: 2 (OCR is heavy).

---

## 🚀 CORE FUNCTIONS
1. **Driver Registration:** Verify 1:1 user bounds (`findByUserId`). Check user exists and is active. Confirm no concurrent uniqueness collisions on `licenseNumber`.
2. **Vehicle Management:** Check plate uniqueness across the system (`findByLicensePlate`), attach details matching `VehicleType`. Support update with re-check on plate change.
3. **Compliance Documents:** Handle `addDocument` with `DocumentType` enum. Dispatch `verify-document-ocr` to BullMQ after successful receipt. Support verification/deletion via `verifyDocument()`. Ownership guard on delete (document.driverId === driver.id).
4. **Status Enforcement:** Admin controls / Driver events mapping to `updateStatus(status: DriverStatus)`.

<br><br><br>
---
---
<br><br><br>

# 📍 Location Service MVP ✅

> **Status:** Fully implemented — `location.service.ts`, `location.model.ts`. Uses Redis GEO + Heartbeat pattern (not H3).

## 🎯 Goal
High throughput tracking and geographic computational engine powered by:
* Ultra-fast Haversine spatial calculations (O(1))
* Real-time Redis GEO interactions (O(logN))
* External map routing simulation

---

## ⚙️ REDIS & SPATIAL DESIGN
* `drivers:geo` → GEO Index (Redis `GEOADD` / `GEOSEARCH` for spatial queries, O(log N))
* `driver:{driverId}:heartbeat` → String (Timestamp) `EX 10` (10s liveness — if driver stops pinging, they become invisible to GEOSEARCH)
* `rider_location:{userId}` → String (JSON `{lng, lat, updatedAt}`) `EX 3600`

> 📐 **Future Enhancement:** Replace flat `GEOSEARCH` with Uber H3 Hexagonal Indexing (`drivers:h3:{cellIndex}` SETs) for O(1) cell-based lookups in dense urban areas.

---

## 🚀 CORE FUNCTIONS
1. **Agent Tracking:** `updateDriverLocation()` → Verify driver profile exists. Pipeline: `GEOADD drivers:geo {lng} {lat} {driverId}` + `SETEX driver:{driverId}:heartbeat 10 {timestamp}`. Heartbeat auto-expires — no manual cleanup needed.
2. **Distance Scanning:** `getNearbyDrivers()` → `GEOSEARCH drivers:geo FROMLONLAT {lng} {lat} BYRADIUS {km} km ASC COUNT {limit} WITHDIST WITHCOORD`. Results filtered by heartbeat liveness (only drivers with active heartbeat returned). O(log N + K).
3. **ETA Forecasting:** Pure math computation relying on Great-Circle (Haversine) equations. Apply 1.4x urban road factor. Speed constraint: 30 km/h average. Returns `{ distanceKm, estimatedMinutes }`.
4. **Provider Integrations:** Expose `getRoutePath()` to simulate/trigger external Route Map aggregators (e.g. Google Maps Directions API). Currently returns Haversine-based stub — replace with actual API call in production.
5. **Pool Lifecycle:** `removeDriverFromPool()` → Pipeline: `ZREM drivers:geo {driverId}` + `DEL driver:{driverId}:heartbeat`. `getDriverLastLocation()` uses `GEOPOS` for O(1) lookup.

<br><br><br>
---
---
<br><br><br>

# 🚀 Rider Service MVP ✅

> **Status:** Fully implemented — `ride.service.ts`, `ride.controller.ts`, `rideProducer.ts`, `rideConsumer.ts`. ✅ Kafka events are published via the Transactional Outbox Pattern (DB write + outbox insert in same `prisma.$transaction`). DLQ strategy is documented but retry-only in current consumer code. Surge multiplier is currently client-provided (Analytics Service not yet operational).

## 🎯 Goal
Fully complete rider-side service (Ride Lifecycle Owner) with:
* Idempotency (Atomic Redis SET NX)
* Kafka (Consumer groups, direct publish with error logging)
* BullMQ (Async jobs, retries)
* Redis (Cache, rate limits, strict TTLs)
* Prisma (UUIDs, correct relations)

---

## 🧱 PRISMA SCHEMA (The Single Source of Truth for Rides)

```prisma
enum RideStatus { REQUESTED, ACCEPTED, IN_PROGRESS, COMPLETED_UNPAID, COMPLETED_PAID, CANCELLED }

model Ride {
  id              String     @id @default(uuid())
  userId          String     
  driverId        String?    
  status          RideStatus @default(REQUESTED)
  
  originLat       Float
  originLng       Float
  destLat         Float
  destLng         Float
  
  fare            Float?
  surgeMultiplier Float      @default(1.0)
  cancellationFee Float      @default(0.0)

  idempotencyKey  String     @unique
  
  acceptedAt      DateTime?
  completedAt     DateTime?
  
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  user            User       @relation(fields: [userId], references: [id])
  driver          Driver?    @relation(fields: [driverId], references: [id])
  rating          Rating?

  @@index([userId])
  @@index([driverId])
  @@index([status])
  @@index([userId, status])
  @@index([userId, createdAt])
}

model Rating {
  id        String   @id @default(uuid())
  rideId    String   @unique
  userId    String
  driverId  String
  rating    Int
  comment   String?
  createdAt DateTime @default(now())

  ride      Ride     @relation(fields: [rideId], references: [id])

  @@index([driverId])
  @@index([userId])
}
```

---

## ⚙️ REDIS DESIGN
* `rider:{userId}:activeRide` → String `EX 86400`
* `idempotency:ride:{userId}:{key}` → String `EX 60`
* `idempotency:rate:{rideId}` → String `EX 86400`
* `event:{topic}:{eventId}` → String `EX 86400` (Kafka Consumer Deduplication)
* `kafka:retry:{topic}:{eventId}` → Counter `EX 86400` (DLQ retry tracking)

---

## ⚙️ ROUTE DESIGN (RESTful)
* `POST /rides` → Create ride request (idempotent via client `idempotencyKey`)
* `PATCH /rides/:rideId/cancel` → Cancel a ride
* `PATCH /rides/:rideId/complete` → Complete a ride
* `GET /rides/active` → Get active ride (Redis-cached hot path)
* `GET /rides/history?cursor=x&limit=10` → Cursor-based paginated history
* `POST /rides/:rideId/rate` → Rate a completed ride (idempotent)

---

## 🚀 CORE FUNCTIONS & SAGA HANDLERS

1. **Create Ride Request:** Atomic idempotency (`SET NX EX 60`) → Check no active ride → Calculate fare SERVER-SIDE (Haversine × road factor × base rate × surge). ⚠️ *Currently `surgeMultiplier` is client-provided; server-side surge requires Analytics Service.* → Transactional Outbox: `prisma.$transaction()` wraps DB Save + OutboxEvent insert for `RIDE_REQUESTED`.
2. **Cancel Ride:** Verify ownership (`ride.userId === userId`) → Calc fee (if ACCEPTED and >5 mins since `acceptedAt` → ₹50 fee) → Transactional Outbox: `prisma.$transaction()` wraps atomic DB update with WHERE guard (`status IN [REQUESTED, ACCEPTED]`) + OutboxEvent insert for `RIDE_CANCELLED` → Clear active ride cache.
3. **Complete Ride:** Verify authorization — for **driver**, look up Driver record by `userId` first, then compare `ride.driverId === driver.id`. For **rider**, compare `ride.userId === userId`. → Transactional Outbox: `prisma.$transaction()` wraps atomic DB update (`IN_PROGRESS → COMPLETED_UNPAID`) + OutboxEvent insert for `RIDE_COMPLETED` → Clear active ride cache.
4. **Handle Kafka `DRIVER_ASSIGNED`:** Update DB Status `REQUESTED → ACCEPTED` with `driverId` and `acceptedAt`. Dispatch push notification via BullMQ `ride-notification` queue.
5. **Handle Kafka `MATCH_FAILED`:** Update DB Status to `CANCELLED`, clear active ride cache, send Push Notification via BullMQ to Rider.
6. **Handle Kafka `PAYMENT_SUCCESS` (Saga Completion):** Sync Ride DB: `Where { rideId, status: COMPLETED_UNPAID }`, `Data { status: COMPLETED_PAID }`. Notify rider.
7. **Handle Kafka `PAYMENT_FAILED` (Saga Completion):** Keep status as `COMPLETED_UNPAID`. Dispatch Push Notification to Rider requesting alternative payment via BullMQ.
8. **Rate Ride:** Idempotency `SET NX` on `idempotency:rate:{rideId}` `EX 86400`. Fail-closed if Redis is down (503). Verify ride is `COMPLETED_UNPAID` or `COMPLETED_PAID`. DB unique constraint (`rideId @unique` on Rating) is the final idempotency guard.

**Kafka Consumer (Current Implementation):**
- Consumer group: `rider-service-group`
- Subscribes to: `DRIVER_ASSIGNED`, `MATCH_FAILED`, `PAYMENT_SUCCESS`, `PAYMENT_FAILED`
- On error: Delete dedup key (`event:{topic}:{eventId}`) so event is reprocessed on next consumer poll. Errors are logged but retry count is not tracked.
- 📐 **DLQ Target Architecture:** Increment `kafka:retry:{topic}:{eventId}`. If count > 5 → produce to `{topic}.dlq`, log critical alert, commit offset. If count ≤ 5 → delete dedup key so event is reprocessed.

<br><br><br>
---
---
<br><br><br>

# 🚀 Matching Service MVP ✅

> **Status:** Fully implemented — `matching.service.ts`, `matchingConsumer.ts`, `matchingProducer.ts`, `matchingTimeout.queue.ts`, `matching.types.ts`. All 9 core functions operational: GEOSEARCH + Min Heap sort, atomic Redis locks (Lua scripts), BullMQ 15s timeout with recursive re-dispatch, SAGA failure/cancellation handlers.

## 🎯 Goal
Complete real-time driver matching engine with:
* Uber H3 Spatial Indexes + Min Heap (Distance-based sorting)
* Kafka (Low-latency Driver dispatch routing on dedicated topics)
* Concurrency safety (Atomic Redis Locks + Lua Scripts)

---

## ⚙️ REDIS DESIGN
* `drivers:geo` → GEO Index
* `matching:{rideId}:status` → String `EX 3600`
* `lock:driver:{driverId}` → String (Value = `rideId`) `EX 15`
* `driver:{driverId}:heartbeat` → String (Timestamp) `EX 10`

---

## ⚙️ KAFKA & BULLMQ DESIGN
* **Kafka Topic (`driver.dispatch`):** High-throughput, partitioned topic for real-time driver dispatch routing. WS Gateway consumes this directly for ultra-low latency delivery.
* **BullMQ Queue:** `matching-timeout` (15s crash-proof window delay)
* **BullMQ Queue:** `matching-dlq` (Dead Letter Queue for 5x hard failures)

---

## 🚀 CORE FUNCTIONS & HANDLERS

1. **Find Nearest:** Fetch from rider's H3 cell + immediate neighbors. Filter by `driver:{driverId}:heartbeat` (Must be online and fresh within 10s).
2. **Match (Min Heap):** Sort by ETA using Min Heap, pop nearest. *(Batch 2-3 concurrently for prod)*.
3. **Lock Driver:** `SET lock:driver:{driverId} {rideId} NX EX 15`. If lock fails → driver already being matched, skip.
4. **Send Dispatch:** Drop payload in Kafka (`driver.dispatch`). Schedule BullMQ 15s timeout job. WS Gateway picks up Kafka event and rings Driver Phone.
5. **Safe Driver Acceptance (Race Condition Protection):** When Driver hits Accept, verify `lock:driver:{driverId}` STILL equals `rideId` using Lua GET. If the lock expired or the timeout passed, strictly **REJECT** the Driver and return `410 Gone`.
6. **Safe Unlock (Lua Script):** `if redis.call('GET', key) == rideId then redis.call('DEL', key) end` — prevents unlocking a driver that was already re-matched.
7. **Timeout Handler (BullMQ processing):** If 15s delay completes and driver didn't click ACCEPT → Emit `request_cancelled` via WS (Redis Pub/Sub), safe unlock driver, recursively match next driver in heap.
8. **Handle SAGA Failure:** If `attempts > MAX_RETRY (5)` or Heap is empty → Set matching status `FAILED` → Produce Kafka `MATCH_FAILED` for Rider Service (📐 *via Outbox when implemented*).
9. **Handle `RIDE_CANCELLED` (Kafka Consumer):** Immediately safe-unlock the driver (`lock:driver:{driverId}`), cancel any pending BullMQ `matching-timeout` job, set matching status to `CANCELLED`.

<br><br><br>
---
---
<br><br><br>

# 💳 Payment Service MVP ✅

> **Status:** Fully implemented — `payment.service.ts`, `paymentConsumer.ts`, `paymentProducer.ts`, `paymentRefund.queue.ts`, `receiptGeneration.queue.ts`, `paymentGateway.ts` (stub), `payment.model.ts`, `payment.controller.ts`, `payment.routes.ts`. Circuit breaker, webhook idempotency, and Kafka SAGA events operational. ✅ All event-producing write paths use the Transactional Outbox Pattern. Swap `paymentGateway.ts` for real Razorpay/Stripe SDK in production.

## 🎯 Goal
Complete payment system with:
* Secure Gateway integration (Razorpay / Stripe)
* Strict Webhook Idempotency
* BullMQ async jobs for receipts and refunds
* **Circuit Breakers** protecting the service from external downtime.

---

## 🏗️ SPECIFIC RESILIENCE (PAYMENTS)
* **Circuit Breaker:** Wrap the Razorpay/Stripe API `createOrder`/`createPaymentIntent` call using `opossum`. If 50% fails over 10 requests, "Open" the circuit and return `503 Service Unavailable` flatly to avoid cascading timeouts hitting Node threads.
* **Idempotency Key to Gateway:** Pass `rideId` as the idempotency key in the Stripe `createPaymentIntent({ idempotencyKey: rideId })` call. This prevents duplicate charges if the service retries the API call.

---

## 🧱 PRISMA SCHEMA

```prisma
enum PaymentStatus { PENDING, SUCCESS, FAILED, REFUND_PROCESSING, REFUNDED }

model Payment {
  id                    String        @id @default(uuid())
  rideId                String        @unique 
  userId                String
  gatewayTransactionId  String?       @unique // Razorpay Order ID or Stripe PaymentIntent ID
  amount                Float
  status                PaymentStatus @default(PENDING)
  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt

  @@index([userId])
  @@index([status])
  @@index([userId, createdAt])
}
```

---

## ⚙️ REDIS DESIGN 
* `idempotency:payment:{userId}:{key}` → String `EX 3600`
* `webhook:processed:{eventId}` → String `EX 86400`

---

## ⚙️ BULLMQ QUEUES
* `payment-refund` (Hits Razorpay/Stripe API to refund with 5 exponential retries)
* `receipt-generation` (Gen PDF & Email with 5 exponential retries)

---

## 🚀 CORE FUNCTIONS & EVENT PRODUCERS

1. **Create Intent (Consumed via `RIDE_COMPLETED` event):** Deduplicate via `SET NX idempotency:payment:{userId}:{rideId}` → DB `PENDING` → Razorpay/Stripe API (via Circuit Breaker, with `rideId` as gateway idempotency key). Transactional Outbox: `prisma.$transaction()` wraps DB status update + OutboxEvent insert for `PAYMENT_SUCCESS`/`PAYMENT_FAILED`.
2. **Handle Webhook (CRITICAL):** 
   - Deduplicate via `SET NX webhook:processed:{eventId}`. 
   - Verify Razorpay/Stripe Webhook Cryptographic Signature.
   - Transactional Outbox: `prisma.$transaction()` wraps atomic DB state update + OutboxEvent insert.
3. **Emit SAGA Completion:** `PAYMENT_SUCCESS`/`PAYMENT_FAILED` events are written to OutboxEvent table — relay worker publishes to Kafka.
4. **Issue Refund (Safe State):** Check `status == SUCCESS`. Update DB to `REFUND_PROCESSING`. Add to BullMQ `payment-refund` queue.
5. **Pagination:** cursor-based `findMany` using UUID `id` with `createdAt` ordering.

<br><br><br>
---
---
<br><br><br>

# 🔔 Notification Service MVP ✅

> **Status:** Fully implemented — `notification.service.ts`, `notificationConsumer.ts`, `notificationSend.queue.ts`, `notificationProvider.ts` (stub), `notification.model.ts`, `notification.controller.ts`, `notification.routes.ts`. Multi-channel delivery (Email/SMS/Push stubs with circuit breakers), BullMQ priority queue, Kafka SAGA integration, user preferences, and Redis-cached unread count operational.

## 🎯 Goal
Fully production-ready notification system with:
* Multi-channel delivery (SMS, Email, Push)
* Provider abstraction + fallback strategy
* BullMQ async processing + retries + priority queues
* **Kafka Event-Driven Triggers (SAGA Integration)**
* **Resilient Provider Integration (Circuit Breakers)**
* **Distributed Tracing (Trace ID Propagation)**

---

## 🧱 PRISMA SCHEMA

```prisma
enum NotificationType { EMAIL, SMS, PUSH }
enum NotificationStatus { QUEUED, SENT, DELIVERED, FAILED }
enum NotificationPriority { HIGH, MEDIUM, LOW }

model Notification {
  id        String               @id @default(uuid())
  userId    String
  type      NotificationType
  title     String?
  message   String
  isRead    Boolean              @default(false)
  status    NotificationStatus   @default(QUEUED)
  priority  NotificationPriority @default(MEDIUM)
  createdAt DateTime             @default(now())

  @@index([userId, createdAt])
}

model NotificationPreference {
  id        String  @id @default(uuid())
  userId    String  @unique
  email     Boolean @default(true)
  sms       Boolean @default(true)
  push      Boolean @default(true)
}

model NotificationTemplate {
  id        String   @id @default(uuid())
  name      String
  version   Int
  content   String
  createdAt DateTime @default(now())

  @@unique([name, version])
}
```

---

## ⚙️ REDIS DESIGN
* `notification:unread:{userId}` → Counter (O(1) lookup) `EX 86400`
* `idempotency:notification:{eventId}` → String `EX 86400`
* `rate:notification:{userId}` → Counter (Rate limits) `EX 60`

---

## ⚙️ KAFKA INTEGRATION (The Triggers)
The Notification Service listens to Domain Events via Kafka to trigger emails/SMS without tight coupling.
* **Consumes:** `MATCH_FAILED` (Sends Push to Rider)
* **Consumes:** `PAYMENT_FAILED` (Sends notification to Rider)
* **Consumes:** `RIDE_COMPLETED` (Sends Receipt Email to Rider)

Consumer group: `notification-service-group`. DLQ: `{topic}.notification.dlq`. Max retries: 5.

---

## ⚙️ BULLMQ QUEUES (Execution & Retries)
Kafka tells the service *what* happened, but BullMQ handles the reliable execution.
* `notification-send` (5x Exponential Backoff retries for provider failures. **Priority support:** BullMQ `priority` option — `1` = HIGH, `5` = MEDIUM, `10` = LOW. Lower number = processed first.)
* `notification-schedule` (Delayed jobs for scheduled notifications)
* `notification-dlq` (Dead Letter Queue after max attempts — jobs moved here for manual inspection/replay)

---

## 🛡️ PROVIDER ABSTRACTION & RESILIENCE
```text
NotificationService
  → EmailProvider (SendGrid/SMTP) [Wrapped in Opossum Circuit Breaker]
  → SMSProvider (Twilio)          [Wrapped in Opossum Circuit Breaker]
  → PushProvider (FCM)            [Wrapped in Opossum Circuit Breaker]
```
* **Circuit Breaker:** If a provider (like Twilio) goes down, the Circuit Breaker trips immediately to prevent crashing Node threads. Failed requests are safely routed to the BullMQ retry queue.
* **Provider Fallback:** If primary provider circuit is OPEN, attempt secondary provider before routing to retry queue.

---

## 🚀 CORE FUNCTIONS & FLOW
1. **Consume Kafka Event:** Extract `traceId` and user details. Check idempotency (`SET NX idempotency:notification:{eventId}`). Respect DLQ retry limits.
2. **Validate Preferences:** Check if user opted-out of email/sms via `NotificationPreference` table.
3. **Queue Job:** Add to BullMQ `notification-send` (injecting the `traceId` into the payload, setting `priority` based on event type — PAYMENT_FAILED = HIGH, RIDE_COMPLETED = MEDIUM).
4. **BullMQ Worker Execution:** Call abstracted provider (via Circuit Breaker). Update `Notification.status` to `SENT`. Increment `notification:unread:{userId}` counter.
5. **Handle Webhooks/Tracking:** Provider Webhooks (e.g., "Delivered") hit DB → Update `status` to `DELIVERED` → Emit to Redis Pub/Sub → WS Gateway pushes real-time "Read/Delivered" receipt to the client.
6. **Observability:** `traceId` from Kafka must be passed into BullMQ payload and sent all the way to structured JSON logs.

<br><br><br>
---
---
<br><br><br>

# 📊 Analytics Service MVP ✅

> **Status:** Fully implemented — schema models (`RideAnalytics`, `RevenueAnalytics`) added, Redis sliding window defined, core Engine built (`analytics.service.ts`), Kafka event syncing configured in `analyticsConsumer.ts`, repeatable scheduled workers integrated securely inside `analytics.queue.ts` including Surge, and REST endpoints set up via `analytics.routes.ts` & `analytics.controller.ts`.

## 🎯 Goal
Fully production-grade analytics system with:
* Kafka event ingestion (idempotent consumers)
* Real-time + batch aggregation
* Outbox-compatible event safety
* Time-series storage
* Redis caching
* Surge pricing engine
* Reporting + anomaly detection
* Reprocessing + correction pipelines

---

## 🧱 DATA STORAGE DESIGN

PostgreSQL with TimescaleDB Extension (Optimized Time-Series)
*(Prevents standard Postgres MVCC bloat and lock contention under heavy Kafka ingest)*

```prisma
model RideAnalytics {
  id        String   @id @default(uuid())
  city      String
  demand    Int
  supply    Int
  timestamp DateTime

  @@index([city, timestamp])
}

model RevenueAnalytics {
  id        String   @id @default(uuid())
  total     Float
  city      String
  timestamp DateTime

  @@index([city, timestamp])
}
```

*Note: Write-heavy workloads will utilize Prisma `createMany` (micro-batching) from Kafka consumers.*

---

## ⚙️ REDIS DESIGN
* `analytics:demand:{city}` → Counter `EX 600` (10 min sliding window bucket)
* `analytics:supply:{city}` → Counter `EX 600`
* `analytics:surge:{city}` → String (computed ratio) `EX 60`
* `analytics:activeDrivers` → Counter `EX 60`
* `analytics:event:{eventId}` → String **`EX 86400`** *(Strict 24h TTL to prevent memory leaks)*

---

## ⚙️ KAFKA CONSUMERS (CRITICAL)
Consumers operate in batches (e.g., 500 events) for high-throughput Postgres inserts.
Consume events (partition key = `rideId`):
* `RIDE_REQUESTED` → Increment `analytics:demand:{city}`
* `DRIVER_ASSIGNED` → Increment `analytics:supply:{city}`, `analytics:activeDrivers`
* `RIDE_COMPLETED` → Decrement `analytics:activeDrivers`
* `PAYMENT_SUCCESS` → Accumulate revenue

Consumer group: `analytics-service-group`. DLQ: `{topic}.analytics.dlq`. Max retries: 5.

**Idempotency & Traceability:**
* `SET NX analytics:event:{eventId} EX 86400`
* Extract `traceId` from the CloudEvent payload and include it in all structured Node.js JSON logging (especially during Anomaly Detection alerts).

---

## ⚙️ SURGE PRICING — SLIDING WINDOW ALGORITHM

```text
Algorithm: Time-Bucketed Sliding Window (5-minute resolution)

1. Divide time into 1-minute buckets: `analytics:demand:{city}:{minuteBucket}`
2. Each bucket has TTL = 600s (10 minutes, to cover the full window)
3. To calculate surge:
   a. Read last 5 buckets (5-minute window): SUM(demand), SUM(supply)
   b. surge = MAX(1.0, demand / supply)
   c. Apply smoothing: newSurge = (0.7 × currentSurge) + (0.3 × previousSurge)
   d. Cap at 5.0x maximum
   e. Cache result: SET analytics:surge:{city} {surge} EX 60
4. Recalculate every 60 seconds via BullMQ repeatable job.

This prevents price oscillation and provides a smooth, predictable surge curve.
```

---

## ⚙️ BULLMQ JOBS
* `analytics-aggregation` (hourly/daily batch sweep over real-time Redis data to Postgres)
* `analytics-surge-calculator` (Repeatable every 60s — runs sliding window algorithm per city)
* `analytics-anomaly-detection` (scans metrics, generates alerts)
* `analytics-recompute` (data correction/replays if Kafka acts up)

---

## 🚀 CORE FUNCTIONS & FLOW
1. **Get Ride Demand Stats:** Aggregated demand per city with time-range support.
2. **Get Driver Activity Stats:** Active vs idle drivers (Derived from `DRIVER_ASSIGNED`).
3. **Get Revenue Stats:** Sum of `PAYMENT_SUCCESS` grouped by time.
4. **Get Surge Pricing Zones:** Read from `analytics:surge:{city}` cache (O(1)). If cache miss, compute on-demand from buckets.
5. **Get System Metrics:** Total rides, Active drivers, Cancellation rate.
6. **Get Time-Range Analytics:** Filters for hour, day, week.
7. **Get Real-Time Metrics:** Fast Redis O(1) lookups.
8. **Export Analytics Report:** Async BullMQ job exporting CSV / JSON.
9. **Get Anomaly Alerts:** Detect spikes in demand, cancellations, or revenue drops (carrying the Kafka `traceId`).

---

## ⚠️ EDGE CASES HANDLING
* **Event Duplication:** Prevent via Redis `SET NX` (with `EX`).
* **Late Events:** Adjust aggregates via eventual consistency rules.
* **Out-of-Order Events:** Use timestamp-based correction via Kafka partition ordering.
* **High Throughput:** Micro-batch Kafka consumption + DB `createMany` inserts.
* **Data Consistency:** Idempotent aggregation logic.
* **Cache Consistency:** Update Redis after DB aggregation or use Redis as source of truth for current sliding window.
* **Missing Events (System Failure):** Reprocess from Kafka offset using `analytics-recompute`.

<br><br><br>
---
---
<br><br><br>

# 🛠 Admin Service MVP ✅

> **Status:** Fully implemented — `Admin`, `Role`, `AuditLog` schemas successfully implemented. Built advanced system control panels with custom JWT auth strategy, explicit `requirePermission` RBAC interceptors, BullMQ automated anomaly sweeps, and ✅ Transactional Outbox Pattern for Ride force cancellation/completion operations!

## 🎯 Goal
Secure, auditable, and powerful admin control system with:
* RBAC (Role-Based Access Control)
* Audit logging (with Trace ID tracking)
* System monitoring
* Fraud detection
* Emergency overrides (via Kafka SAGA)
* Feature/config management (via Redis O(1) Cache)

---

## 🧱 PRISMA SCHEMA

```prisma
model Admin {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // bcrypt hashed, 12 rounds
  roleId    String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  role      Role     @relation(fields: [roleId], references: [id])

  @@index([email])
}

model Role {
  id          String  @id @default(uuid())
  name        String  @unique
  permissions Json    // Array of permission strings: ["users:read", "users:write", "rides:cancel"]
  createdAt   DateTime @default(now())

  admins      Admin[]
}

model AuditLog {
  id        String   @id @default(uuid())
  adminId   String
  action    String
  entity    String
  entityId  String
  metadata  Json?    // Additional context
  traceId   String   // CRITICAL: Trace Admin-generated SAGAs through the system
  createdAt DateTime @default(now())

  @@index([adminId, createdAt])
  @@index([entity, entityId])
  @@index([traceId])
}
```

---

## ⚙️ REDIS DESIGN
* `admin:rate:{adminId}` → Counter `EX 60` (Rate limits — prevent admin abuse)
* `admin:block:{userId}` → String (No TTL — persistent until manually `DEL`'d. **Note:** Redis rejects `EX 0`; use `SET` without `EX` for persistent keys.)
* `admin:feature:{flagName}` → String **(Boolean O(1))** *(Feature flags cached here to prevent hitting Postgres)*
* `admin:session:{adminId}` → String `EX 3600` (Admin JWT session — shorter TTL than user sessions)

---

## 🚀 CORE FUNCTIONS & ENDPOINTS

### 🔑 ADMIN AUTHENTICATION (SEPARATE FROM USER AUTH)
* **Admin Login:** Separate auth flow (not shared with User auth). bcrypt password verification. Enforce **MFA/2FA** (TOTP via `otplib`). Issue short-lived JWT (`1h` access, `24h` refresh).
* **Token-based access:** Admin JWTs contain `{ adminId, roleId, type: "admin" }`. Admin middleware verifies token type === "admin".

### 🔐 RBAC (CRITICAL)
* **Create Role / Assign Role to Admin:** Roles contain JSON array of permission strings.
* **Permission-based access middleware:** `requirePermission("rides:cancel")` — checks `admin.role.permissions` array. Deny-by-default.

### 👤 USER & DRIVER MANAGEMENT
* **Get All Users** (with O(logN) cursor pagination + filters)
* **Get All Drivers** (with status filter)
* **Suspend/Unsuspend User/Driver** (Updates DB `isActive` flag)
* **Block/Unblock User** (Updates DB + Sets/Deletes `admin:block:{userId}` in Redis for instant API-level blocking)

### 🚗 DRIVER & DOCUMENT CONTROL
* **Approve/Reject Driver Documents** (Updates `DriverDocument.verified`)

### 📄 LOGS & MONITORING
* **View Ride/Payment Logs** (cursor-paginated)
* **Get Audit Logs** (filter by adminId, entity, dateRange)
* **System Health Check / Live System Metrics** (Redis, Postgres, Kafka health + Prometheus metrics)

### 🚨 FRAUD & ALERT SYSTEM
* **Get Fraud Detection Report / Active Alerts** (Abnormal patterns: too many cancellations, rapid ride creation, payment failures)
* **Resolve Alert** (Admin marks as resolved with notes in AuditLog)

### ⚙️ SYSTEM CONTROL
* **Update System Configuration**
* **Feature Flags:** Flip feature flags, sync immediately to DB and `admin:feature:{flagName}` Redis Cache.

### 🧨 EMERGENCY ACTIONS (SAGA EMITTERS ✅ *via Outbox Pattern*)
* **Force Cancel Ride:** Transactional Outbox: `prisma.$transaction()` wraps DB update + OutboxEvent insert for `RIDE_CANCELLED` → relay worker publishes to Kafka so Matching Service releases Driver lock. Log in AuditLog with `traceId`.
* **Force Complete Ride:** Transactional Outbox: `prisma.$transaction()` wraps DB update + OutboxEvent insert for `RIDE_COMPLETED` → relay worker publishes to Kafka.
* **Adjust Payment / Issue Refund:** Dispatch job to BullMQ `payment-refund` queue (do *not* manually edit gateway states). Log in AuditLog.

### 🔍 SEARCH & FILTER
* **Search Users** (by name, email, phone - case-insensitive)
* **Filter Drivers** (by status, verified docs, registration date)

---

## ⚠️ EDGE CASES HANDLING
* **Authorization:** Enforce RBAC on *every* endpoint. Deny-by-default.
* **Audit Logging:** Log EVERY admin action in `AuditLog` table, always saving the `traceId`.
* **Rate Limiting:** Prevent admin abuse (`admin:rate:{adminId}`, rate limit by adminId not IP).
* **Fraud Handling:** Flag suspicious behavior automatically via BullMQ scheduled scan jobs.
* **Data Safety:** Prevent accidental mass actions (pagination limits, confirmation for destructive actions).
* **Idempotency / State Sync:** Safe retries for critical actions. All state changes produce Kafka CloudEvents via Outbox pattern.
