# High Concurrency Booking System

A production-ready Node.js booking backend designed to prevent double-booking under high concurrency using Redis-based temporary locks and PostgreSQL transaction safety.

## Problem Statement

Booking systems often break down under concurrent traffic.

- Multiple users can attempt to reserve the same seat at the same time.
- A naive read-then-write flow can create race conditions.
- Two requests may see the same seat as available and both proceed.
- The result is double-booking, inconsistent data, and poor user experience.

## Architecture

This system uses Redis and PostgreSQL for different responsibilities.

- **Redis**
  - Handles low-latency, temporary seat locking.
  - Uses `SET NX PX` to create a lock only if it does not already exist.
  - Ensures atomic lock acquisition, preventing concurrent access to the same seat.
  - Uses TTL to automatically expire abandoned locks.

- **PostgreSQL + Prisma**
  - Stores seats and bookings as the source of truth.
  - Uses transactions for final booking consistency.
  - Ensures seat state updates and booking creation happen atomically.

- **Express.js**
  - Exposes the HTTP API.
  - Orchestrates validation, lock checks, and booking flow.
  - Keeps the codebase modular and maintainable.

## Booking Flow Diagram

```text
Client
  │
  ├── POST /lock-seat
  │       │
  │       ├── Redis SET NX PX (lock)
  │       └── returns lock token
  │
  ├── POST /book
  │       │
  │       ├── Validate lock (Redis)
  │       ├── DB Transaction:
  │       │     ├── Update seat → BOOKED
  │       │     └── Create booking
  │       └── Delete lock
  │
  └── Response → Booking confirmed

```

## Booking Flow

The booking process follows a simple and safe sequence:

1. **Lock**
   - Client requests a temporary lock for a seat.
   - Redis creates the lock using `SET NX PX`.
   - If a lock already exists, the request is rejected.

2. **Validate**
   - The booking request checks the lock token.
   - The seat is verified in PostgreSQL before final booking.
   - This prevents stale or invalid lock usage.

3. **Book**
   - PostgreSQL transaction updates the seat to `BOOKED` using a conditional update (only if not already BOOKED).
   - A booking record is created atomically.
   - Ensures the lock belongs to the requesting user before proceeding.
   - The Redis lock is removed after success.

## Failure Scenarios Handled

- **Concurrent booking attempts**
  - Redis lock ensures only one user can reserve a seat at a time.

- **User abandons booking**
  - TTL automatically releases the lock after expiration.

- **Duplicate booking requests**
  - Database constraints + transaction prevent inconsistent writes.

- **Race conditions**
  - Redis lock + conditional DB update ensures correctness even if concurrent requests bypass the lock layer.

## API Endpoints

- `GET /seats`
  - Returns all seats from PostgreSQL.
  - Used to inspect seat availability and pricing.

- `POST /lock-seat`
  - Creates a temporary Redis lock for a seat.
  - Uses `SET NX PX` with TTL.
  - Returns a lock token for the booking step.

- `POST /book`
  - Validates the lock token and ownership.
  - Confirms the booking in PostgreSQL.
  - Marks the seat as `BOOKED`.

- `POST /admin/seats`
  - Creates one or many seats in PostgreSQL.
  - Requires the `x-admin-api-key` header.
  - Accepts validated `price` and optional `count` for bulk seat creation.
  - Useful for seeding inventory without touching the public booking flow.

## How to Run

### 1. Start infrastructure

```bash
docker compose up -d postgres redis
```

### 2. Apply Prisma migrations

```bash
npm run prisma:migrate
```

### 3. Seed sample seats

```bash
npm run db:seed
```

### 4. Configure admin access

Set the admin key in `.env` if you want to use the admin seat creation endpoint.

Run the following command to generate a secure API key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Example `.env` value:

```bash
ADMIN_API_KEY=your-generated-key
```

### 5. Start the application

```bash
docker compose up --build app
```

### 6. Test the API

```bash
curl http://localhost:3000/health
curl http://localhost:3000/seats
```

### 7. Create seats in bulk

```bash
curl -X POST http://localhost:3000/admin/seats \
  -H "Content-Type: application/json" \
  -H "x-admin-api-key: dev-admin-key" \
  -d '{"price":150,"count":20}'
```

Validation rules:

- `price` must be greater than `0` and at most `1000000`
- `count` must be an integer between `1` and `500`
- If `count` is omitted, the API creates `1` seat

Single-seat creation still works:

```bash
curl -X POST http://localhost:3000/admin/seats \
  -H "Content-Type: application/json" \
  -H "x-admin-api-key: dev-admin-key" \
  -d '{"price":150}'
```

## Key Concepts

- **Locking**
  - Redis provides temporary seat exclusivity.
  - Prevents concurrent users from booking the same seat.

- **TTL**
  - Locks expire automatically.
  - Reduces stale-lock risk and improves recovery.

- **Transactions**
  - PostgreSQL guarantees atomic booking writes.
  - Seat state and booking creation succeed or fail together.

- **Separation of Concerns**
  - API, services, infrastructure, and utilities are split cleanly.
  - Keeps the project easy to extend and debug.

## Tradeoffs

- Redis locking improves performance but introduces eventual consistency concerns if not carefully managed.
- System relies on TTL for recovery instead of strict distributed consensus (e.g., Redlock).

## Future Improvements

- **Lua script**
  - Make lock acquisition and validation atomic in Redis.

- **Idempotency**
  - Prevent duplicate booking requests from creating duplicate records.

- **Load testing**
  - Validate concurrency behavior under real traffic.

- **Observability**
  - Add structured logging, metrics, and tracing.

- **Lock cleanup**
  - Add more robust lock release and expiration handling.
