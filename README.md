# 🛡️ CloudShield — Next-Gen Zero Trust Cloud Security Platform

[![React](https://img.shields.io/badge/React-19.x-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF.svg)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen.svg)](https://www.mongodb.com/atlas)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Cloud%20CDN-3448C5.svg)](https://cloudinary.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **CloudShield** is an enterprise-grade **Zero Trust Network Access (ZTNA)** and **Cloud Resource Security Management** platform. Built upon the core philosophy of *"Never Trust, Always Verify"*, CloudShield dynamically evaluates user identity, device posture, geographic location, contextual risk, and resource sensitivity to gate every single access request in real-time.

---

## 🌟 Key Features

### 1. 🔒 Continuous Zero Trust Access Evaluation
- **Context-Aware Policy Engine**: Every request is evaluated against user role, department, time of access, device trustworthiness, and location anomalies.
- **Dynamic Risk Scoring**: Real-time numerical risk calculation (0–100 scale: Low, Medium, High, Critical) assessing IP subnet shifts, unfamiliar user-agents, and sensitive resource tiers.
- **Adaptive MFA Challenges**: Automatically prompts multi-factor verification when risk thresholds elevate or when accessing critical enterprise resources.

### 2. ☁️ Cloud Storage & Document Vault (Cloudinary Integration)
- **Direct Laptop-to-Cloud Upload**: Securely stream and upload PDFs, Word documents, and reports from local machines directly into **Cloudinary Cloud CDN**.
- **Dual-Path Streaming Gateway**: Embedded zero-trust in-app PDF preview and download pipeline that enforces TLS 1.3 encryption and Zero Trust authorization before streaming bytes to the client.
- **Multi-Cloud Metadata Support**: Configured for Cloudinary, AWS S3, Google Cloud Storage, and Azure Blob Storage provider schemas.

### 3. 📝 Access Request & Approval Workflow
- **Standard User Gating**: Protected resources and cloud documents are gated with a **"Request Access"** prompt for standard employees.
- **Admin Review Hub**: Administrators can review pending requests with applicant details, risk scores, and business justifications to approve or deny access in one click.
- **Policy Overrides**: Approved access requests grant temporary, time-bound zero-trust session passes.

### 4. 📊 Security Auditing & Threat Intelligence
- **Comprehensive Audit Trail**: Real-time logging of all authentication attempts, resource views, policy blocks, and administrative changes.
- **Interactive Analytics**: Visual distribution charts for risk classifications, access event volumes, and incident telemetry.
- **Data Export**: Export security logs directly to CSV for compliance audits (SOC 2, ISO 27001, HIPAA).

### 5. 👥 Role-Based Access Control (RBAC) & Governance
- **Granular Roles**: Role isolation for `admin`, `manager`, `employee`, `contractor`, and `guest`.
- **Admin Self-Demotion Protection**: Built-in safeguards preventing administrators from accidentally stripping their own privileges.
- **User Lifecycle Management**: Activate, suspend, adjust risk baselines, and reset credentials securely.

---

## 🏗️ Architecture Overview

```
                          ┌─────────────────────────────┐
                          │   Client Application (Vite) │
                          │      React 19 + Lucide UI   │
                          └──────────────┬──────────────┘
                                         │ HTTPS / JWT
                                         ▼
                          ┌─────────────────────────────┐
                          │   Zero Trust API Gateway    │
                          │   (Express.js + Middleware) │
                          └──────────────┬──────────────┘
                                         │
                 ┌───────────────────────┼───────────────────────┐
                 ▼                       ▼                       ▼
    ┌─────────────────────────┐ ┌──────────────────┐ ┌───────────────────────┐
    │ Dynamic Policy Engine   │ │ Risk Analysis    │ │ Auth & MFA Gate       │
    │  - Role / Dept Checks   │ │  - IP / Device   │ │  - JWT Verification   │
    │  - Location Whitelists  │ │  - Time Anomalies│ │  - Adaptive Step-Up   │
    └────────────┬────────────┘ └────────┬─────────┘ └───────────┬───────────┘
                 │                       │                       │
                 └───────────────────────┼───────────────────────┘
                                         │
                                         ▼
                      ┌────────────────────────────────────┐
                      │ Storage & Data Persistence Layer   │
                      │  - MongoDB Atlas (Metadata & RBAC) │
                      │  - Cloudinary Cloud CDN (Documents)│
                      │  - Local Encrypted Vault           │
                      └────────────────────────────────────┘
```

---

## 💻 Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Lucide Icons, Custom Design Tokens, CSS Glassmorphism |
| **Backend** | Node.js, Express.js, Mongoose, JSON Web Tokens (JWT), Multer |
| **Database** | MongoDB Atlas (Cloud Database) |
| **Cloud Storage** | Cloudinary Cloud CDN SDK (Multi-format raw/image streaming) |
| **Security** | BCrypt Password Hashing, Zero-Trust Contextual Gate, Helmet, CORS |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **MongoDB Atlas** database connection string
- **Cloudinary Account** (for cloud document uploads)

---

### 1. Clone the Repository
```bash
git clone https://github.com/<YOUR-USERNAME>/CloudShield.git
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

# Cloudinary Storage (From your Cloudinary Dashboard)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

### 3. Install Dependencies & Seed Database

```bash
# Install root, backend, and frontend packages
npm install
cd server && npm install
cd ../client && npm install

# Seed default users, resources, and zero-trust policies into MongoDB
cd ../server
node seed.js
```

---

### 4. Run the Application

In two separate terminals:

```bash
# Terminal 1: Backend Server (Port 5000)
cd server
npm run dev

# Terminal 2: Frontend Client (Port 5173)
cd client
npm run dev
```

Open **`http://localhost:5173`** in your browser to access the CloudShield portal.

---

## 🔑 Default Demo Credentials

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Administrator** | `admin@company.com` | `password123` | Full Platform & Security Admin |
| **Employee** | `sai@company.com` | `password123` | Engineering Access & Resource Catalog |
| **Employee** | `ravi@company.com` | `password123` | Product Operations Access |
| **Employee** | `john@company.com` | `password123` | Marketing Access |
| **Employee** | `priya@company.com` | `password123` | Finance & HR Access |

---

## 📡 API Reference Summary

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new user profile
- `POST /api/auth/login` — Authenticate and receive JWT session token
- `GET /api/auth/profile` — Fetch authenticated user profile & risk metrics
- `POST /api/auth/verify-mfa` — Validate OTP token for step-up authentication

### Resources & Cloud Documents (`/api/resources`)
- `GET /api/resources` — Evaluate & retrieve all catalog assets for current context
- `GET /api/resources/:id` — Zero-Trust gate check and decrypt asset payload
- `POST /api/resources` — Create a new resource catalog item *(Admin only)*
- `POST /api/resources/upload` — Direct upload of PDF/document to Cloudinary & local vault
- `PUT /api/resources/:id` — Update resource metadata or sensitivity *(Admin only)*
- `DELETE /api/resources/:id` — Delete resource item *(Admin only)*

### Access Requests (`/api/requests`)
- `GET /api/requests` — View all submitted access requests *(Admin)* / user's requests *(Employee)*
- `POST /api/requests` — Submit temporary access request for gated resources
- `PUT /api/requests/:id` — Approve or Reject access request *(Admin only)*

### Security Logs & Risk Analytics (`/api/logs`, `/api/reports`)
- `GET /api/logs` — Retrieve full enterprise audit log stream *(Admin only)*
- `GET /api/logs/my` — Retrieve user's personal activity history
- `GET /api/reports/summary` — Enterprise threat analytics, risk distributions, and alerts

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
