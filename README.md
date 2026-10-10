# 🚜 FarmFleet - Custom Hiring Centre (CHC) Logistics Platform

A production-ready, fullstack web application and REST API engineered for managing **Custom Hiring Centres (CHCs)** in India. FarmFleet optimizes agricultural machinery utilization, tractor operator dispatches, farmer service delivery, and live field GPS tracking.

---

## 🌟 Key Highlights & AI Modules

1. **Role-Based Access Control (RBAC)**:
   - **`ADMIN`**: Comprehensive fleet management, machine provisioning, and user administration.
   - **`CHC_MANAGER`**: Booking management, calendar schedule, live tractor tracking, and dynamic rescheduling.
   - **`OPERATOR`**: Daily field route assignments, start/complete job status actions, and mobile GPS telemetry streaming.
   - **`FARMER`**: Machinery reservation requests, booking timeline tracking, and live notifications.

2. **AI Module 1: Voice-to-Booking Assistant**:
   - Audio call recording via `MediaRecorder` API or audio file upload.
   - Clear privacy consent disclaimer: *"This call will be recorded to help create a booking. The recording and transcript will be deleted if you choose not to schedule the job."*
   - Agricultural speech-to-text and bilingual Hindi/English/Punjabi rule-based NLP extraction (farmer name, phone, machine type, acreage, crop, village, landmark).
   - Preview form with **"Schedule this job?"** prompt (`Yes` creates booking; `No` purges recording and transcript).

3. **AI Module 2: Predictive Job Duration Engine**:
   - Calibrated regression model factoring machinery type baseline speed (Tractor, Rotavator, Super Seeder, Harvester, Sprayer).
   - Soil resistance, canopy density, and crop coefficients (Wheat, Paddy, Sugarcane, Cotton, Mustard).
   - Continually trains and refines calibration from completed job durations.

4. **AI Module 3: AI-Assisted Slot Recommendations**:
   - Evaluates active machinery schedules, working windows (07:00 AM - 07:00 PM), and maintenance breaks.
   - Multi-criteria optimization scoring algorithm minimizing transit distance, road travel, and clustering jobs in adjacent fields.
   - Recommends top 2–3 ranked slots with confidence fit scores and human-readable rationales.

5. **AI Module 4: Dynamic Rescheduling on Disruptions**:
   - Detects equipment breakdowns (`BREAKDOWN`), weather/field delays (`DELAY`), urgent priority harvests (`URGENT_JOB`), and cancellations (`CANCELLATION`).
   - Greedy local search re-allocates jobs to backup active machinery or adjusts timeline.
   - Displays dynamic change proposal banners with old vs. new scheduled times diff, one-click accept, and farmer notification triggers.

6. **Live Tractor GPS Telemetry**:
   - **Operator side**: Mobile geolocation streaming (`navigator.geolocation.getCurrentPosition()`) transmitting GPS coordinate, speed, and timestamp every 5 seconds.
   - **CHC Manager side**: Real-time vector radar & Google Maps JS API wrapper displaying target field pin, tractor live coordinate, heading arrow, breadcrumb path polyline, distance gauge, and speed HUD.

7. **Multilingual Localization (i18n)**:
   - Full English (`en`), Hindi (`hi` हिन्दी), and Tamil (`ta` தமிழ்) localization dictionaries externalized for outdoor and rural usability across Indian farming communities.
   - Instant language toggle in navigation bar and login screen.

---

## 🏗️ Project Architecture

```
FarmFleet/
├── client/                     # React 18 + TypeScript + Vite + Tailwind CSS Frontend
│   ├── src/
│   │   ├── components/         # Navbar, Sidebar, Layout, MapComponent, StatusBadge, ConfirmModal
│   │   ├── context/            # AuthContext (JWT, user state, quick demo role switchers)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── i18n/               # Localization (en.ts, hi.ts, ta.ts, I18nProvider)
│   │   ├── pages/
│   │   │   ├── chc/            # CHC Dashboard, Bookings (List/New/Details), Schedule, Live Tracking
│   │   │   ├── farmer/         # Farmer Dashboard, Machinery Requests, Bookings, Notifications
│   │   │   ├── operator/       # Operator Dashboard, Task Details, Live GPS Transmitter
│   │   │   └── login.tsx       # Authentication portal with demo role pills
│   │   ├── services/           # Axios API client with Bearer auth and 401 interceptors
│   │   ├── types/              # Domain TypeScript interfaces
│   │   ├── App.tsx             # Root Provider wrapper
│   │   ├── routes.tsx          # ProtectedRoute and RBAC routing table
│   │   └── main.tsx            # React entrypoint
│   ├── index.html              # High-contrast mobile viewport & Google Fonts (Inter)
│   └── tailwind.config.js      # Farm, Tractor, and Earth curated agricultural palette
│
├── server/                     # Node.js 20+ + Express + TypeScript + Prisma REST API
│   ├── prisma/
│   │   ├── schema.prisma       # Prisma data models (User, Machine, Booking, Location, etc.)
│   │   ├── migrations/         # PostgreSQL migration SQL definitions
│   │   └── seed.ts             # Rich Indian agriculture demo seed data
│   ├── src/
│   │   ├── controllers/        # Auth, Bookings, Voice, Schedule, Tracking, Machines, Farmers
│   │   ├── middleware/         # JWT verification, RBAC check, global error handler
│   │   ├── routes/             # Express API route modules
│   │   ├── services/
│   │   │   ├── ai/             # VoiceBooking, JobDurationPredictor, SlotRecommender, DynamicRescheduler
│   │   │   ├── tracking/       # Live GPS location ingestion, path pruning, and distance calculation
│   │   │   └── db.ts           # Database connection & robust in-memory local data store fallback
│   │   ├── types/              # Backend TypeScript types
│   │   └── server.ts           # Main Express server entrypoint
│   ├── tsconfig.json           # Server TypeScript configuration
│   └── .env                    # Server environment variables
│
└── package.json                # Root concurrently script orchestrator
```

---
### Contribution & Development Workflow

- **Project Documentation:** Maintains clear documentation of the application architecture, core modules, API endpoints, and local setup instructions.
- **Version Control:** Uses Git and GitHub to track code changes, manage commits, and support collaborative development.
- **Development Setup:** Provides installation instructions and environment configuration for running the frontend and backend locally.
## ⚡ Quick Start Guide

### 1. Installation

From the project root:
```bash
npm run install:all
```
*(or run `npm install` inside both `server/` and `client/` directories)*

### 2. Running Locally

Run both the frontend and backend simultaneously with one command:
```bash
npm run dev
```

- **Frontend Application**: `http://localhost:5173`
- **Backend REST API**: `http://localhost:5000/api`
- **Health Check**: `http://localhost:5000/api/health`

---

## 🔑 Demo Login Credentials

The login page (`/login`) includes **1-Click Quick Demo Role Switcher Buttons** for instant evaluation, or you can enter credentials manually:

| Role | Email / Phone | Password | Target Dashboard |
|---|---|---|---|
| **CHC Manager** | `manager@farmfleet.in` / `9876543211` | `Manager@123` | `/chc/dashboard` |
| **Farmer** | `farmer@farmfleet.in` / `9876543213` | `Farmer@123` | `/farmer/dashboard` |
| **Operator** | `operator@farmfleet.in` / `9876543212` | `Operator@123` | `/operator/dashboard` |
| **Admin** | `admin@farmfleet.in` / `9876543210` | `Admin@123` | `/chc/dashboard` |

---

## 🗄️ Database & Prisma Setup

FarmFleet is configured for PostgreSQL (such as **Neon serverless Postgres**):

1. Set your Neon database connection string in `server/.env`:
   ```env
   DATABASE_URL="postgresql://neondb_owner:your_password@ep-your-subdomain.ap-south-1.aws.neon.tech/neondb?sslmode=require"
   ```
2. Generate the Prisma client:
   ```bash
   npm --prefix server run prisma:generate
   ```
3. Push schema or run migrations:
   ```bash
   npm --prefix server run prisma:push
   ```
4. Seed the database with sample Punjabi/Indian agriculture fleet data:
   ```bash
   npm --prefix server run seed
   ```

> **Zero-Friction Dev Fallback**: If `DATABASE_URL` is not yet connected to a live Postgres instance, FarmFleet automatically runs in an in-memory high-performance data store preloaded with realistic Punjabi farming records so all features, GPS tracking, and AI scheduling work immediately out-of-the-box!

---

## 📡 API Endpoint Reference

### Authentication
- `POST /api/auth/login` - Authenticate with email/phone & password, receives JWT token
- `GET /api/auth/me` - Profile lookup

### Bookings (CHC Manager & Admin)
- `GET /api/bookings` - List bookings with status, machine, date filters, and pagination
- `POST /api/bookings` - Create new booking with duration prediction
- `GET /api/bookings/:id` - Booking details
- `PATCH /api/bookings/:id` - Update status/timings, trains duration regression AI
- `DELETE /api/bookings/:id` - Soft cancel booking

### Voice-to-Booking AI
- `POST /api/voice-booking/process` - Multipart audio processing, Speech-to-Text & NLP extraction
- `POST /api/voice-booking/confirm` - Confirms extracted parameters and creates booking
- `POST /api/voice-booking/reject` - Purges audio recording & transcript

### Schedule & AI Recommendations
- `GET /api/schedule` - Machine/Operator calendar tracks
- `GET /api/schedule/recommend-slots` - Multi-criteria slot optimization
- `GET /api/schedule/proposals` - Pending dynamic rescheduling change proposals
- `POST /api/schedule/propose-reschedule` - Triggers rescheduling algorithm
- `POST /api/schedule/accept-reschedule` - Applies proposal changes & notifies farmers
- `POST /api/schedule/reject-reschedule` - Rejects proposal

### Live Tractor GPS Tracking
- `POST /api/operator/location` - Ingests operator phone GPS coordinates & speed
- `GET /api/chc/tracking/:bookingId` - Retrieves live telemetry, target field coordinates, distance, and recent path

### Farmer Portal
- `GET /api/farmer/requests` - List submitted requests
- `POST /api/farmer/requests` - Submit new machinery requirement
- `GET /api/farmer/requests/:id` - Timeline status tracker
- `GET /api/farmer/bookings` - List confirmed bookings
- `GET /api/farmer/bookings/:id` - Booking details & operator contact
- `POST /api/farmer/bookings/:id/cancel` - Cancel booking
- `GET /api/farmer/notifications` - Notifications with unread badge count
- `PATCH /api/farmer/notifications/:id/read` - Mark read

### Operator Console
- `GET /api/operator/tasks` - List assigned shift tasks
- `PATCH /api/operator/tasks/:id` - Mark `IN_PROGRESS` or `COMPLETED`
- `GET /api/operator/active-job` - Retrieve active in-progress job
