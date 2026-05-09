🚗 RideNova (Uber Clone)
A Production-Grade Full-Stack Ride-Sharing Platform

Node.js Express React PostgreSQL Redis Socket.IO License

Real-time ride tracking · Multi-role dashboards · Cloudinary uploads · SAGA orchestration

🚀 Quick Start  •  📖 API Reference  •  🗂️ Project Structure  •  ⚙️ Environment Variables

✨ Features
🛍️ Rider Experience

One-tap ride booking with precise location selection

Real-time ride tracking on a live map (Leaflet)

Simulated payment flow with detailed summaries

OTP authentication and user profile management

Ride history, active promos, and support tickets

🚘 Driver Portal

Multi-step registration with Cloudinary document uploads

Real-time incoming ride alerts via Socket.IO

Live trip navigation with interactive status updates

Earnings dashboard and daily activity tracking

👑 Super Admin

Platform-wide control over users, drivers, and rides

Approve or reject driver documents

Financial tracking and payment transaction audits

Interactive analytics and reports for platform growth

⚡ Platform

JWT auth with refresh token rotation

Role-based access control (Rider, Driver, Admin)

Event-driven SAGA architecture using Kafka

Swagger API docs at /api-docs

Redis-backed global rate limiting & caching

🛠️ Tech Stack
Frontend
Technology	Version	Purpose
React + Vite	19	UI framework & build tool
React Router	v7	Client-side routing
Zustand	Latest	Global state management
Tailwind CSS	v4	Utility-first styling
TanStack Query	v5	Server-state caching
Leaflet	Latest	Live map integration
Backend
Technology	Version	Purpose
Node.js	18+	Runtime
Express	v5	Web framework
Prisma + PostgreSQL	6.x	Relational data & type-safe ORM
Redis	7.x	Caching + rate-limit store
Socket.IO	4.x	Real-time ride tracking
KafkaJS + BullMQ	Latest	Event streaming & Job Queues
Cloudinary	2.x	Image & document storage
Swagger UI	5.x	Interactive API docs
🗂️ Project Structure
UBER-clone/
│
├── 📁 backend/
│   ├── src/
│   │   ├── app.ts              ← Express app · middleware
│   │   ├── server.ts           ← Entry point · DB init · Socket.IO
│   │   ├── config/             ← Kafka, Redis, Prisma, Cloudinary configs
│   │   ├── controllers/        ← Route handlers
│   │   ├── services/           ← Core logic & SAGA handlers
│   │   ├── models/             ← Prisma wrappers
│   │   ├── routes/             ← Modular API routes
│   │   ├── queues/             ← BullMQ workers
│   │   ├── events/             ← Kafka consumers
│   │   └── utils/              ← Shared helpers
│   └── package.json
│
├── 📁 frontend/
│   ├── src/
│   │   ├── app/                ← Root App component & Router
│   │   ├── features/           ← Feature modules (Rider, Driver, Admin)
│   │   ├── shared/             ← Common UI components
│   │   └── lib/                ← API & Socket clients
│   └── package.json
│
├── requirement.txt             ← Informational Node.js dependency list
└── README.md
🚀 Quick Start
Prerequisites
Requirement	Version
Node.js	>= 18
npm	>= 9
PostgreSQL	15.x recommended
Redis	7.x recommended
Kafka	3.x (Optional/Cloud)
Step 1 — Clone the Repository
git clone https://github.com/mrinalkolay/UBER-clone.git
cd UBER-clone
Step 2 — Set Up the Backend
cd backend
npm install
About requirement.txt A requirement.txt file lives at the project root as a human-readable reference of all backend Node.js packages and their pinned versions. It is informational only — npm install (which reads package.json) is always the canonical install method.

Alternative install from requirement.txt:

# Windows PowerShell
Get-Content ..\requirement.txt | Where-Object { $_ -notmatch '^(#|\s*$)' } | ForEach-Object { npm install $_ }

# macOS / Linux
grep -vE '^(#|\s*$)' ../requirement.txt | xargs npm install
Copy and configure your environment file:

cp .env.example .env
# Edit .env with your DB URIs, secrets, and Cloudinary keys
Start the dev server:

npm run dev
Endpoint	URL
Backend API	http://localhost:8000
Swagger Docs	http://localhost:8000/api-docs
Step 3 — Set Up the Frontend
Open a new terminal:

cd frontend
npm install
npm run dev
Frontend runs at: http://localhost:5173

Step 4 — Seed the Database (Optional)
cd backend
npx prisma db seed
⚙️ Environment Variables
Create backend/.env from the template below:

# ── Server ──────────────────────────────────────
PORT=8000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# ── Database ─────────────────────────────────────
DATABASE_URL="postgresql://user:password@localhost:5432/ridenova"

# ── Redis ────────────────────────────────────────
REDIS_URL="redis://127.0.0.1:6379"

# ── Kafka ────────────────────────────────────────
KAFKA_BROKERS="localhost:9092"

# ── JWT ──────────────────────────────────────────
JWT_ACCESS_SECRET="your_super_secret_key_64_chars_minimum"

# ── Cloudinary ───────────────────────────────────
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
📖 API Reference
All routes are versioned. Full interactive docs at http://localhost:8000/api-docs.

Resource	Base Path	Description
Auth	/api/auth	Login · OTP · tokens
Rides	/api/rides	Request & track rides
Drivers	/api/drivers	Driver location & status
Admin	/api/admin	Platform management
Payments	/api/payments	Simulated payments
👥 User Roles
Role	Access Level
rider	Browse · book rides · track · manage profile
driver	Driver portal — incoming requests · live navigation
admin (Super Admin)	Platform-wide user, driver, & ride control
📡 Real-Time Ride Tracking
Socket.IO powers live driver location updates:

const socket = io("http://localhost:8000", {
  auth: {
    token: "YOUR_JWT_TOKEN",
    role: "rider", // 'rider' | 'driver' | 'admin'
  },
});

// Subscribe to a ride's tracking room
socket.emit("join:ride", rideId);

// Receive live location updates
socket.on("driver:locationUpdate", (data) => {
  console.log("Live location:", data.location);
  // Update your Leaflet map marker here
});
🔒 Security
Feature	Implementation
Authentication	JWT (access tokens) · bcryptjs hashing
Role-Based Access	Middleware-enforced on protected routes
Security Headers	helmet
XSS Protection	xss-clean
CORS	Credentials-enabled · origin-restricted
Rate Limiting	Redis-backed via rate-limit-redis
Input Validation	zod & express-validator on endpoints
SQL Injection	Prevented by Prisma ORM
⚡ Performance
Optimization	Detail
Redis Caching	Session & rate-limit data cached
Database Indexing	Indexes on high-frequency query fields (e.g. location)
Queueing	BullMQ for background processing
Connection Pooling	PostgreSQL & Redis connection pools
Async/Await	Consistent non-blocking I/O throughout
🧪 Testing
cURL Quick Tests
# Send Login OTP
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890"}'

# Verify OTP
curl -X POST http://localhost:8000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890","otp":"1234"}'

# Get available rides (authenticated)
curl http://localhost:8000/api/rides \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
🐛 Troubleshooting
PostgreSQL connection fails
Redis connection fails
Kafka broker not found
Port 8000 already in use
CORS errors in browser
📄 License
This project is licensed under the MIT License.

Built with Node.js · Express · React · PostgreSQL · Redis · Socket.IO

⭐ If you found this project useful, consider giving it a star!
