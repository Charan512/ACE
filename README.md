# ACE 
 platform for the **Association of Computer Engineers (ACE)**.  
Built on the MERN stack (MongoDB, Express, React, Node.js), powered by PhonePe PG v1, BullMQ + Redis, and a zero-storage headless canvas certificate engine.

---

## 1. System Overview

ACE manages role-based member directories, event registrations, automated billing, credentials vaults, and asynchronous email notifications. The platform operates on a secure backend system with a unified frontend designed in an **Industrial Cyber-Minimalism** theme.

### Key Functional Areas
* **RBAC & Identity Engine:** Manages levels from Guests and Members to Student Board Members (SBM), Executive Board Members (EBM), and Administrators. Members receive unique sequential IDs (`26ACE0___`) generated via an atomic MongoDB counters collection.
* **Dual-Tier Event Registrations:** Dynamically determines event pricing based on user role (Member vs. Non-Member) and tracks transaction status securely.
* **Server-Redirect PhonePe Payments:** Integrates PhonePe PG v1 redirect model. Verifies Razorpay-alternative webhooks using PhonePe's checksum mechanism (`X-VERIFY` header validation).
* **Asynchronous Jobs & Background Workers:** Processes deferred tasks through Redis-backed BullMQ queues. This includes:
  - **10-Hour Treasurer Digest:** Gathers event registrations and emails a consolidated digest to the Treasurer.
  - **Late Converter Migration:** Back-ports a guest's historical event registrations and certificates to their permanent Member Vault when they purchase a full membership.
* **Zero-Storage headless Certificate Renderer:** Fetches base blank certificate templates to RAM from Cloudflare R2, applies high-resolution text overlays dynamically using `@napi-rs/canvas` based on event metrics, and streams the buffer directly to the client.

---

## 2. System Architecture

The following diagrams illustrate the core structure, payment flows, and background queue mechanics.

### 2.1 Complete System Architecture Overview
```mermaid
graph TD
    subgraph Client Layer
        Vite["React SPA / Vite"]
    end

    subgraph Application Server
        Express["Express.js Server / Node.js 18+"]
        Canvas["@napi-rs/canvas Engine"]
    end

    subgraph Database & Caching
        Mongo[("MongoDB / Mongoose")]
        Redis[("Redis Key-Value DB")]
    end

    subgraph Third Party Services
        PhonePe["PhonePe PG v1 Gateway"]
        R2["Cloudflare R2 Storage"]
        SMTP["SMTP Mail Server"]
    end

    Vite <--> |"HTTPS / JSON API"| Express
    Express <--> |"Mongoose ODM"| Mongo
    Express <--> |"BullMQ Queues"| Redis
    Express --> |"Fetch Base Templates"| R2
    Express --> |"Stream Buffer"| Vite
    Express <--> |"PG Redirect & Status API"| PhonePe
    Express --> |"Transports Emails"| SMTP
```


### 2.2 Payment Initialization & Webhook Verification Flow
```mermaid
sequenceDiagram
    autonumber
    actor User as Member / Guest
    participant Frontend as React SPA
    participant Backend as Express Server
    participant PhonePe as PhonePe Gateway
    participant DB as MongoDB

    User->>Frontend: Register for Event / Membership
    Frontend->>Backend: POST /api/payments/initiate
    Note over Backend: Calculates fee (INR -> paise)<br/>Creates txn payload & checksum
    Backend-->>Frontend: Returns redirectUrl & txnId
    Frontend->>PhonePe: Redirect user to hosted PG page
    Note over PhonePe: Processes transaction
    PhonePe-->>Backend: HTTP Webhook (POST /api/payments/webhook) with X-VERIFY
    Note over Backend: Validates SHA256 checksum & updates DB
    PhonePe-->>User: Redirect to Frontend /payment/callback
    User->>Frontend: Loads Callback Page
    Frontend->>Backend: GET /api/payments/verify/:txnId
    Note over Backend: Direct Query to PhonePe Status API
    Backend-->>Frontend: Response (SUCCESS/FAILURE)
    Frontend->>User: Display Status & Unlock Access
```

### 2.3 The Treasurer Digest Debounce Lifecycle
```mermaid
stateDiagram-v2
    [*] --> Idle: Queue Empty
    Idle --> RunningTimer: First Registration occurs (Start 2.5h TTL)
    RunningTimer --> ResetTimer: Next Registration occurs (within 2.5h)
    ResetTimer --> RunningTimer: Reset TTL countdown to 2.5h
    RunningTimer --> Flushed: 2.5h TTL hits 0 OR 10h Absolute Ceiling Reached
    Flushed --> EmailSent: Trigger Worker (Collect registrations & generate HTML)
    EmailSent --> Idle: Reset State
```

---

## 3. Project Directory Structure

```
Project-A/
├── server/                    # Express/Node.js backend (runs on :5000)
│   ├── .env.example           # Template for environment configuration
│   ├── src/
│   │   ├── index.js           # Express App & Server Startup Point (includes JWT guard)
│   │   ├── config/            # Third-party services integrations (Redis, etc.)
│   │   ├── models/            # Mongoose Schemas (User, Event, Registration, Transaction, Counter)
│   │   ├── routes/            # API Route Declarations (auth, admin, event, payment)
│   │   ├── controllers/       # Core Business Logic (auth, admin, event, payment controllers)
│   │   ├── middleware/        # Express Middlewares (auth validation, role checkers, error handlers)
│   │   ├── utils/             # Helper Modules (OTP generator, canvas helper, R2 fetcher)
│   │   ├── queues/            # BullMQ Job Producers (email queues, digest queues)
│   │   └── workers/           # BullMQ Consumers (digest worker, late converter worker)
│   └── package.json           # Backend dependency configuration
│
└── client/                    # React/Vite frontend (runs on :5173)
    ├── .env.example           # Template for client environment configuration
    ├── src/
    │   ├── App.jsx            # Main Router & Application Wrapper
    │   ├── main.jsx           # Vite Mount Point
    │   ├── index.css          # Cyber-Minimalism Tailwind Core Styles
    │   ├── components/        # Reusable UI widgets & Layout Layout wrappers
    │   ├── pages/             # Page components (Auth, Dashboard, Events, PaymentCallback)
    │   ├── store/             # Global State Management (useAuthStore, etc.)
    │   └── lib/               # Utility API layers and wrapper functions
    └── package.json           # Frontend dependency configuration
```

---

## 4. Tech Stack Specification

| Module / Layer | Technical Choice | Description |
|---|---|---|
| **Frontend Framework** | React 18 & Vite | Fast, client-side rendering with module replacement. |
| **Styling Engine** | Tailwind CSS v4 | Provides atomic utility classes tailored to theme variables. |
| **Theme / Font** | Industrial Cyber-Minimalism | JetBrains Mono font for technical data and a `#0B0F19` color scheme. |
| **Backend Engine** | Node.js (>=18.0.0) | Enforced runtime version for native fetch capabilities. |
| **Web Framework** | Express.js | Standard HTTP request pipeline and routing layer. |
| **Database Layer** | MongoDB & Mongoose | Document database for flexible schemas with strong models. |
| **Distributed Cache** | Upstash Redis | Serverless Redis with TLS — used as BullMQ message broker. |
| **Queue Manager** | BullMQ | Redis-backed robust asynchronous task runner (co-located in Express process). |
| **Payment Gateway** | PhonePe PG v1 | Secure redirect payment handling with verified callbacks. |
| **Email Delivery** | Resend (SMTP relay) | HTTP-based mail relay — bypasses Render SMTP port restrictions. |
| **Certificate Engine** | `@napi-rs/canvas` | Node canvas engine fetching assets to RAM (zero local storage). |
| **Image Storage** | Cloudflare R2 | S3-compatible template storage for blank certificates. |
| **Hosting (Backend)** | Render | Free-tier web service with auto-deploy from GitHub. |

---

## 5. Getting Started & Setup

### Prerequisites
* **Node.js:** `>= 18.0.0`
* **MongoDB:** Deployed instance or local connection string
* **Redis:** Deployed instance or local connection string

### 5.1 Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd server
   ```
2. Copy the environment template and populate it with your actual credentials:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server in development mode:
   ```bash
   npm run dev
   ```
   The backend will launch at `http://localhost:5000`.

### 5.2 Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd client
   ```
2. Copy the client-side environment template:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173`.

---

## 6. Environment Variables Guide

The following configuration values are required in `server/.env` to achieve complete system functionality.

### Core Variables
* `NODE_ENV`: Either `development` or `production`. Under production mode, weak JWT secret values will trigger a safety startup guard.
* `MONGO_URI`: The MongoDB Atlas connection string (or local host URI).
* `REDIS_URL`: The Redis URI (e.g. `redis://127.0.0.1:6379`). Required by BullMQ.
* `JWT_SECRET`: Minimum 64-character hex key to secure session tokens.

### Payment Integration (PhonePe)
* `PHONEPE_MERCHANT_ID`: Your unique merchant identifier registered on PhonePe.
* `PHONEPE_SALT_KEY`: Salt key used to generate high-security payloads checksums.
* `PHONEPE_SALT_INDEX`: Salt index identifier matching your key registration.
* `PHONEPE_BASE_URL`: API gateway endpoint (Sandbox/UAT or Production URL).

### Cloudflare R2 Integration
* `R2_ACCOUNT_ID`: Cloudflare dashboard account ID.
* `R2_ACCESS_KEY_ID`: Restricted access key credentials.
* `R2_SECRET_ACCESS_KEY`: Secret string matching the access key.
* `R2_BUCKET_NAME`: Bucket hosting the base canvas certificate files.
* `R2_PUBLIC_URL`: Client-accessible endpoint to download or display base templates.

### Email Delivery (Resend)
Render's free tier **blocks SMTP ports 25, 465, and 587**. The backend uses Resend's SMTP relay, which tunnels over HTTPS (port 443) — never blocked by Render.
* `RESEND_API_KEY`: Your Resend API key (starts with `re_`). Get one free at [resend.com](https://resend.com).
* `EMAIL_FROM`: The sender address shown to recipients (must be on your verified Resend domain).

### Redis (Upstash)
* `REDIS_URL`: Use an Upstash `rediss://` URL (TLS) for production. Get a free instance at [upstash.com](https://upstash.com). Local dev uses `redis://127.0.0.1:6379`.

---

## 7. Security Policies & Best Practices

* **Atomic Database Counters:** Sequential ID generation executes using MongoDB's `$inc` operator within `findOneAndUpdate` commands. This avoids potential node race conditions.
* **Checksum Verification:** All callback integrations require standard SHA256 checksum checks utilizing base64 payloads to confirm identity before state changes occur in the database.
* **Production Password Protocol:** Deployed production systems automatically generate random passwords upon initial purchase and flag user credentials as `requiresPasswordChange: true`.
* **Fail-Fast Secret Check:** A startup validator verifies `JWT_SECRET` complexity when running under `production` mode, refusing to boot under weak keys.

---

## 8. Deploying to Render

The repository includes a [`render.yaml`](file:///Users/sriramcharannalla/Project-A/render.yaml) at the project root for one-click deployment.

### Prerequisites
* A [Render](https://render.com) account connected to your GitHub repository.
* A [MongoDB Atlas](https://cloud.mongodb.com) cluster (free M0 tier works).
* An [Upstash Redis](https://upstash.com) database (free tier — get `rediss://` connection URL).
* A [Resend](https://resend.com) account with a verified sending domain and API key.

### Steps

1. **Push `render.yaml`** to your `main` branch.
2. In the Render dashboard, click **New → Blueprint** and connect your repository.
3. Render will detect `render.yaml` and pre-fill the service configuration.
4. Fill in the `sync: false` environment variables in the Render dashboard:

   | Variable | Where to get it |
   |---|---|
   | `MONGO_URI` | MongoDB Atlas → Connect → Drivers |
   | `REDIS_URL` | Upstash dashboard → `rediss://` URL |
   | `RESEND_API_KEY` | Resend dashboard → API Keys |
   | `EMAIL_FROM` | e.g. `ACE ERP <noreply@yourdomain.com>` |
   | `PHONEPE_MERCHANT_ID` | PhonePe merchant dashboard |
   | `PHONEPE_SALT_KEY` | PhonePe merchant dashboard |
   | `CLIENT_URL` | Your deployed frontend URL (e.g. Vercel) |
   | `TREASURER_EMAIL` | Treasurer's email address |
   | `R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_PUBLIC_URL` | Cloudflare R2 dashboard |

5. `JWT_SECRET` is **auto-generated** by Render (`generateValue: true`) — no action needed.
6. Click **Apply** — Render builds and deploys the service.
7. Verify the deployment by hitting the health endpoint:
   ```
   GET https://<your-render-url>/api/health
   → { "success": true, "message": "ACE ERP Server is operational." }
   ```

> **Note on BullMQ workers:** Workers (email, treasurer digest, late converter) are co-located inside the Express process on the same Render web service. Render's `SIGTERM` is handled gracefully — workers complete in-flight jobs before shutdown.
