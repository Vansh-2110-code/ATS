# 🚀 Applicant Tracking System (ATS)

A feature-rich, full-stack **Applicant Tracking System (ATS)** designed to streamline the recruitment process. This application is divided into a fast **React + Vite** frontend and a robust **Express + MongoDB** backend.

---

## 🏗️ Project Architecture & Tech Stack

This project is structured as a monorepo-style setup with separate client (frontend) and server (backend) codebases.

### Frontend
- **Framework:** React with Vite & TypeScript
- **Styling & Components:** Tailwind CSS, Material UI (MUI), Radix UI
- **Animations:** Framer Motion (motion)
- **Charts/Analytics:** Recharts
- **Iconography:** Lucide React
- **Port:** Defaults to `7899` (with API requests proxied to `http://localhost:5001`)

### Backend
- **Platform:** Node.js with Express.js
- **Database:** MongoDB via Mongoose
- **Securities & Utilities:** Helmet, CORS, Express-Rate-Limit, Morgan, Bcrypt.js, JsonWebToken, Multer, ExcelJS, PDF-Parse, Mammoth

---

## 🌟 Key Features

- **🔐 Multi-Role Portals:** Separate interfaces and permissions for Admin, Team Leader (TL), Manager, Recruiter, Walk-in Candidates, and Finance.
- **📄 Resume Analysis & Scan:** Custom resume uploads, extraction, and scanning capabilities (including Face Verification).
- **💼 Candidate Pipelines:** Track candidates through stages (calls, interviews, walk-ins).
- **📊 Business Intelligence & Analytics:** Dynamic dashboards with custom metrics, logs, and activity reports.
- **💰 Financial/Invoice Tracker:** Manage invoices and candidate onboarding-related financials.
- **⏰ Attendance & Tasks:** Track employee attendance, remote work status (WFH), and daily checklists/tasks.
- **📧 Email Integrations:** Automated notifications and candidate correspondence logs.

---

## ⚙️ Configuration Setup (.env)

Ensure you have correct configuration parameters in both root and backend environments.

### 1. Root `.env` (Frontend config & fallback)
Create or check a `.env` file in the project root:
```env
VITE_API_URL=http://localhost:5001
AHMED_SIR_EMAIL=ahmed@whitehorsemanpower.in
JWT_SECRET=ats_secret_key_2026
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/ats_db
```

### 2. Backend `.env` (`/backend/.env`)
Create or edit a `.env` file inside the `backend/` folder:
```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/ats_db # Or MongoDB Atlas connection string
JWT_SECRET=ats_secret_key_2026
AHMED_SIR_EMAIL=ahmed@whitehorsemanpower.in
CORS_ORIGIN=http://localhost:7899
```

---

## 📥 Installation & Local Development Setup

Follow these steps to set up the project locally.

### Step 1: Install Frontend Dependencies
From the root of the project, run:
```bash
npm install
```

### Step 2: Install Backend Dependencies
Navigate to the backend directory and install its dependencies:
```bash
cd backend
npm install
```

### Step 3: Seed the Database 🗄️
Before running the application, seed the MongoDB database with initial sample candidates, system users, and portal configurations:
```bash
# Inside the backend directory
npm run seed
```
> ⚠️ **Warning:** Running this seed script will clear existing collections in the database and repopulate them with fresh seed data.

#### 👥 Default Seeded Accounts for Testing:
| Role | Email | Password | WFH Status |
|---|---|---|---|
| **Admin** | `admin@whitehorsemanpower.in` | `Password2026!` | Office |
| **Recruiter** | `priya@whm.com` | `password123` | WFH |
| **Recruiter** | `amit@whm.com` | `password123` | Office |
| **Team Leader** | `suresh@whm.com` | `password123` | Office |
| **Manager** | `kavita@whm.com` | `password123` | Office |

---

## 🚀 Running the Project

For a full local setup, run both the frontend and backend servers.

### 1. Start the Backend Server
From the `backend/` folder:
```bash
npm run dev
```
*Runs on port `5001` (by default).*

### 2. Start the Frontend Server
From the root directory:
```bash
npm run dev
```
*Runs on port `7899` (proxied to `/api` on `http://localhost:5001`).*

---

## 📖 User Guide & Documentation

For detailed instructions on how to use the Applicant Tracking System based on your role (Admin, Recruiter, Team Leader, Manager, Finance, Walk-in Candidate), please check out our comprehensive **[User Guide (USERGUIDE.md)](file:///d:/ats-main-deploy/ats-main/USERGUIDE.md)**.

---

## 📦 Building for Production

To create an optimized production build for the frontend application:
```bash
# In the root folder
npm run build
```
This output is saved to the `/dist` directory. For more details on deploying to traditional VPS, Nginx, or Docker container environments, please refer to [DEPLOYMENT.md](file:///d:/ats-main-deploy/ats-main/DEPLOYMENT.md).