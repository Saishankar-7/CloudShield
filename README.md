# 🛡️ CloudShield — Next-Gen Zero Trust Cloud Security Platform

[![React](https://img.shields.io/badge/React-19.x-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF.svg)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen.svg)](https://www.mongodb.com/atlas)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Cloud%20CDN-3448C5.svg)](https://cloudinary.com/)

> **CloudShield** is an enterprise-grade **Zero Trust Network Access (ZTNA)** and **Cloud Resource Security Management** platform. Built upon the core philosophy of *"Never Trust, Always Verify"*, CloudShield dynamically evaluates user identity, device posture, geographic location, contextual risk, and resource sensitivity to gate every single access request in real-time.

---

## 🌟 Key Features & Capabilities

### 1. 🔒 Continuous Zero Trust Access Evaluation
- **Context-Aware Policy Engine**: Every request is evaluated against user role, department, time of access, device trustworthiness, and location anomalies.
- **Dynamic Risk Scoring**: Real-time numerical risk calculation (0–100 scale: Low, Medium, High, Critical) assessing IP subnet shifts, unfamiliar user-agents, and sensitive resource tiers.
- **Adaptive MFA Gates**: Automatically prompts multi-factor verification when risk thresholds elevate or when accessing confidential enterprise resources.

### 2. ☁️ Cloud Storage Vault & In-App Document Streamer (Cloudinary CDN)
- **Direct Laptop-to-Cloud Upload**: Securely stream and upload PDFs, Word documents, and spreadsheets from local machines directly into **Cloudinary Cloud CDN**.
- **Decrypted Document Streaming Gateway**: Embedded in-app PDF preview and download pipeline (`/api/resources/:id/stream`) that enforces TLS 1.3 encryption, token verification, and policy checks before streaming bytes to the client.
- **Automatic Cloudinary CDN Purge**: When an administrator deletes any resource or document from the catalog, CloudShield automatically identifies the asset and **permanently purges it from Cloudinary and the CDN cache**, ensuring zero orphaned files.

### 3. 👥 Interactive HR Employee Directory Viewer
- **Decrypted HR Dataset**: In-app encrypted personnel database viewer with real-time department filtering, search, and pagination.
- **Synchronized Cloud PDF**: Live streaming and viewing of official enterprise employee directory documents hosted on Cloudinary CDN.

### 4. ✉️ Multi-Provider Resilient Email Delivery (Port 443 / SSL 465)
- **Zero-Failure Architecture**: Dispatches login MFA and document access OTPs directly to user emails.
- **Multi-Cloud Failover**: Prioritizes HTTPS REST APIs (Resend, Brevo, SendGrid on Port 443) with automatic fallback to Direct Gmail SMTP SSL (Port 465).
- **Session Security**: 10-minute time-bound numeric passcodes with live resend cooldowns and email masking.

### 5. ✨ Micro-Interactions & Cyber Animation Suite
- **Holographic Biometric Scanline**: Active cyan laser beam (`.auth-scanline-beam`) sweeps downward during credentials verification.
- **Gateway Unlock Portal**: Smooth emerald verification feedback and portal zoom transitions into the dashboard.
- **Lockout Security Shake**: Horizontal shake animation (`@keyframes lockShake`) with a crimson border flare on authentication failure.
- **Ambient Shimmer Sweep**: Diagonal light sheen that glides across primary action buttons on hover and interaction.
- **Zero-Trust Verification Pulse**: Expanding emerald scanwave (`@keyframes verifySuccessPulse`) upon document decryption and MFA approval.

### 6. 🎨 Dual-Theme Engine (Cyber Dark & Enterprise Light)
- Full visual support for dark and light modes with persistent local preferences.
- Re-engineered resource cards, high-contrast security session cards, and glassmorphic navigation components.

### 7. 📝 Access Request & Approval Workflow
- **Employee Gating**: Protected resources and cloud documents are gated with a **"Request Access"** prompt for standard employees.
- **Admin Review Hub**: Administrators review pending requests with applicant profiles, risk scores, and business justifications to grant or reject access in real-time.
- **Policy Overrides**: Approved access requests grant temporary, time-bound zero-trust session passes.

### 8. 📊 Security Auditing & Threat Intelligence
- **Comprehensive Audit Trail**: Real-time logging of all authentications, resource views, policy blocks, and administrative actions.
- **Interactive Analytics**: Visual distribution charts for risk classifications, access event volumes, and incident telemetry.
- **Compliance Export**: One-click CSV export of audit logs for SOC 2, ISO 27001, and HIPAA compliance reviews.

---

## 🏗️ Architecture Overview

```
                          ┌─────────────────────────────┐
                          │   Client Application (Vite) │
                          │  React 19 + Theme Engine    │
                          └──────────────┬──────────────┘
                                         │ HTTPS / JWT
                                         ▼
                          ┌─────────────────────────────┐
                          │   Zero Trust API Gateway    │
                          │  (Express.js + Middleware)  │
                          └──────────────┬──────────────┘
                                         │
                 ┌───────────────────────┼───────────────────────┐
                 ▼                       ▼                       ▼
    ┌─────────────────────────┐ ┌──────────────────┐ ┌───────────────────────┐
    │ Dynamic Policy Engine   │ │ Risk Calculator  │ │ Auth & MFA Gate       │
    │  - Role / Dept Checks   │ │  - IP / Device   │ │  - JWT Verification   │
    │  - Location Whitelists  │ │  - Time Context  │ │  - Dual MFA (TOTP/OTP)│
    │  - Access Overrides     │ │  - Thresholding  │ │  - Resend Failover    │
    └────────────┬────────────┘ └────────┬─────────┘ └───────────┬───────────┘
                 │                       │                       │
                 └───────────────────────┼───────────────────────┘
                                         │
                                         ▼
                      ┌────────────────────────────────────┐
                      │ Storage & Data Persistence Layer   │
                      │  - MongoDB Atlas (Metadata & RBAC) │
                      │  - Cloudinary Cloud CDN (Documents)│
                      │  - Auto-Purge Lifecycle Cleanup    │
                      └────────────────────────────────────┘
```

---

## 💻 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Lucide Icons, Vanilla CSS Design System, Glassmorphic UI |
| **Backend** | Node.js (v20+), Express.js, Mongoose, JSON Web Tokens (JWT), Multer, PDFKit |
| **Database** | MongoDB Atlas (Cloud Database) |
| **Cloud Storage** | Cloudinary Cloud CDN SDK (Multi-format raw & image uploads, streaming, auto-purge) |
| **Email Services** | Resend HTTPS REST, Brevo, SendGrid (Port 443), Nodemailer Gmail Direct SSL (Port 465) |
| **Security** | BCrypt Password Hashing, Zero-Trust Contextual Gate, Helmet, CORS |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.x or higher (v20+ recommended)
- **npm**: v9.x or higher
- **MongoDB Atlas** database connection string
- **Cloudinary Account** (for cloud document storage and CDN delivery)

---

### 1. Clone the Repository
```bash
git clone https://github.com/Saishankar-7/CloudShield.git
cd CloudShield
```

---

### 2. Configure Environment Variables

Create a `.env` file in the `server/` directory:

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/cloudshield?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key
NODE_ENV=development

# Cloudinary Storage Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Email Dispatch Services (Optional - for direct email OTP delivery)
# Option A: Gmail SMTP
GMAIL_USER=your_admin_email@gmail.com
GMAIL_PASS=your_gmail_app_password

# Option B: Cloud HTTPS REST APIs (Port 443)
RESEND_API_KEY=your_resend_api_key
BREVO_API_KEY=your_brevo_api_key
SENDGRID_API_KEY=your_sendgrid_api_key
```

---

### 3. Install Dependencies & Seed Database

```bash
# Install root, backend, and frontend packages
npm install
npm install --prefix server
npm install --prefix client

# Seed default enterprise users, resources, and zero-trust policies into MongoDB
cd server
node seed.js
cd ..
```

---

### 4. Run the Application

You can launch both the frontend and backend concurrently with a single command from the project root:

```bash
npm start
```

Or run them individually in separate terminal windows:

```bash
# Terminal 1: Backend Server (Port 5000)
cd server
npx nodemon server.js

# Terminal 2: Frontend Client (Port 5173)
cd client
npm run dev
```

Open **`http://localhost:5173`** in your browser to access the CloudShield portal.

---

## 🔑 Default Demo Credentials

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Administrator** | `admin@company.com` | `password123` | Full Platform, Security Catalog & Admin Governance |
| **Employee** | `sai@company.com` | `password123` | Engineering Access & Resource Catalog |
| **Employee** | `ravi@company.com` | `password123` | Product Operations Access |
| **Employee** | `john@company.com` | `password123` | Marketing Access |
| **Employee** | `priya@company.com` | `password123` | Finance & HR Access |

---

## 📡 API Reference Summary

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new enterprise user profile
- `POST /api/auth/login` — Authenticate and receive JWT session token
- `GET /api/auth/profile` — Fetch authenticated user profile & risk metrics
- `POST /api/auth/verify-mfa` — Validate TOTP or Email OTP for step-up verification
- `POST /api/auth/mfa/resend` — Dispatch a fresh 6-digit MFA OTP to registered email
- `POST /api/auth/mfa/setup` — Initialize Authenticator App QR pairing
- `POST /api/auth/mfa/confirm` — Finalize MFA activation
- `POST /api/auth/mfa/disable` — Disable MFA protection
- `PUT /api/auth/preferences` — Update notification and dark mode preferences

### Resources & Cloud Documents (`/api/resources`)
- `GET /api/resources` — Evaluate & retrieve all catalog assets for current context
- `GET /api/resources/:id` — Zero-Trust gate check and decrypt asset payload
- `GET /api/resources/:id/stream` — Stream or download decrypted document via CDN
- `GET /api/resources/employee-data/records` — Fetch decrypted synthetic HR employee directory records
- `POST /api/resources/upload` — Direct upload of PDF/document to Cloudinary Cloud CDN
- `POST /api/resources/:id/request-otp` — Request time-bound document access verification OTP
- `POST /api/resources/:id/verify-otp` — Verify document OTP to unlock secure payload
- `PUT /api/resources/:id/access` — Update granular access control rules *(Admin only)*
- `POST /api/resources` — Create a new resource catalog item *(Admin only)*
- `PUT /api/resources/:id` — Update resource metadata or sensitivity *(Admin only)*
- `DELETE /api/resources/:id` — Delete resource and **automatically purge asset from Cloudinary** *(Admin only)*

### Access Requests (`/api/requests`)
- `GET /api/requests` — View all submitted access requests *(Admin)* / user's requests *(Employee)*
- `POST /api/requests` — Submit temporary access request for gated resources
- `PUT /api/requests/:id` — Approve or Reject access request *(Admin only)*

### Security Logs & Risk Analytics (`/api/logs`, `/api/reports`)
- `GET /api/logs` — Retrieve full enterprise audit log stream *(Admin only)*
- `GET /api/logs/my` — Retrieve user's personal activity history
- `GET /api/reports/summary` — Enterprise threat analytics, risk distributions, and alerts
