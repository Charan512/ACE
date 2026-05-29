# ACE ERP

Enterprise Resource Planning platform for the **Association of Computer Engineers**.  
Built on the MERN stack with Razorpay, BullMQ, and a zero-storage headless canvas certificate engine.

---

## Project Structure

```
Project-A/
├── server/          ← Express/Node.js backend (runs on :5000)
│   ├── .env         ← Backend secrets (never committed)
│   ├── .env.example ← Template — copy & fill in real values
│   └── src/
│       ├── index.js
│       ├── config/
│       ├── models/
│       ├── routes/
│       ├── controllers/
│       ├── middleware/
│       ├── utils/
│       ├── queues/
│       └── workers/
│
└── client/          ← React/Vite frontend (runs on :5173)
    ├── .env         ← Browser-safe vars only, VITE_ prefix (never committed)
    ├── .env.example ← Template — copy & fill in real values
    └── src/
```

---

## Getting Started

### 1. Backend
```bash
cd server
cp .env.example .env      # Fill in your real values
npm install
npm run dev               # Starts Express on :5000
```

### 2. Frontend
```bash
cd client
cp .env.example .env      # Fill in your real values (VITE_ prefix only)
npm install
npm run dev               # Starts Vite on :5173
```

> **Note:** The Vite dev server proxies all `/api` requests to `http://localhost:5000`,  
> so you don't need `VITE_API_BASE_URL` in development.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS v4 |
| Backend | Node.js, Express.js (ES Modules) |
| Database | MongoDB (Mongoose) |
| Background Jobs | BullMQ + Redis |
| Payments | Razorpay |
| Canvas | `@napi-rs/canvas` (zero system deps) |
| Storage | Cloudflare R2 (templates only) |
