# 🚀 Enterprise Applicant Tracking System (ATS) - Project Presentation Document

---

## Executive Summary

The **Applicant Tracking System (ATS)** is a full-stack, enterprise-grade recruitment operating platform engineered to automate and optimize the end-to-end talent acquisition process. Designed for agency recruitment and corporate staffing across **BPO, IT, and Lateral** divisions, the system unifies candidate sourcing, AI resume extraction, multi-stage pipeline management, physical walk-in branch registration, biometrics attendance verification, team performance management, and client billing/invoicing.

---

## 🏗️ System Architecture & Technology Stack

The platform is built on a high-performance monorepo-style architecture with decoupled client and server layers.

### Frontend Technologies
* **Framework:** React 18 with Vite 6 & TypeScript
* **Styling & UI:** Tailwind CSS v4, Material UI (MUI v7), Radix UI components
* **Animations:** Framer Motion (`motion`)
* **Data Visualization:** Recharts
* **Biometrics:** `@vladmandic/face-api` (Client-side face detection & liveness model)
* **Icons:** Lucide React & MUI Icons

### Backend Technologies
* **Server Platform:** Node.js with Express.js REST API
* **Database:** MongoDB with Mongoose ODM
* **Security & Utilities:** Helmet, CORS, Express-Rate-Limit, Morgan, Bcrypt.js, JsonWebToken
* **File Parsing & Utilities:** Multer, Mammoth (`.docx`), PDF-Parse (`.pdf`), ExcelJS (`.xlsx`)

---

## 👥 Role-Based Access Control (RBAC) & Portals

The application features 6 specialized user roles with custom interfaces and operational permissions:

| User Role | Access Scope & Responsibilities |
|---|---|
| **Super Admin** | Complete platform control, user account provisioning, system logs, JR creation, global candidate database management, field visibility controls. |
| **Manager** | Strategic department oversight, cross-team performance analytics, high-level revenue tracking, requisition allocation. |
| **Team Leader (TL)** | Team performance monitoring, daily target tracking, candidate second-call reviews, final interview round evaluation. |
| **Recruiter** | Sourcing candidates, AI resume scanning, calling workflow, pipeline stage updates, WFH status logging, candidate scheduling. |
| **Walk-In Kiosk** | Standalone tablet/kiosk portal for branch office self-registration, queue token assignment, photo capture, and recruiter notification. |
| **Finance** | Candidate placement billing verification, tax invoice generation, proforma invoices, credit notes, employee salary slip management. |

---

## 🔑 Core Functional Modules & Capabilities

### 1. Candidate Lifecycle & Funnel Pipeline
* **Multi-Channel Intake:** Manual entry, bulk Excel sheet import, resume drag-and-drop, and public application portal.
* **Stage Tracking:** Screening (L1) -> Internal Interview -> Client Submission (L2) -> Offer Released -> Candidate Joined.
* **Recruiter Ownership Lock:** 30-day candidate retention rule preventing duplicate candidate sourcing across recruiters.
* **Audit Logs:** Full history tracking of every status change, timestamp, and user action.

### 2. AI Resume Scanning & Parsing
* Automatic extraction of candidate details (Name, Contact Details, Email, Skills, Experience, Location, Education) from PDF and DOCX files.
* Auto-syncing of parsed data into searchable ATS records.

### 3. Branch Walk-In Kiosk & AI Biometrics
* **Kiosk Self-Registration:** Tablet-friendly check-in workflow for office branch visitors with live queue numbers.
* **Biometrics Attendance:** Camera-based facial verification powered by Face API for employee WFH and office attendance logging.

### 4. Financial & Invoicing Suite
* **Joined Candidate Billing:** Automatic triggers when candidate stage transitions to *Joined*.
* **Tax Invoices & Proformas:** Generate downloadable/printable PDF invoices with GST calculations and client credit notes.
* **Commission Calculations:** Auto-calculated placement revenue based on joining salary and agreement percentage (e.g. 8.33%).

### 5. Business Intelligence & Analytics
* Interactive dashboards with conversion funnels, job requisition fulfillment rates, recruiter call activity logs, and monthly revenue trends.

---

## 🌐 Production Deployment Architecture

* **Frontend Production URL:** `https://ats.weinnovatee.com/`
* **Backend Production API:** `http://backendats.weinnovate.com/`
* **Web Server:** Nginx Reverse Proxy with SPA fallback routing and SSL via Let's Encrypt Certbot.
* **Containerization:** Docker & Docker Compose setup supported.

---

## 📄 Artifact Files Included

* **Interactive Slide Presentation:** [PROJECT_PRESENTATION.html](file:///d:/ats-main-deploy/ats-main/PROJECT_PRESENTATION.html)
* **System User Guide:** [USERGUIDE.md](file:///d:/ats-main-deploy/ats-main/USERGUIDE.md)
* **Deployment Technical Manual:** [DEPLOYMENT.md](file:///d:/ats-main-deploy/ats-main/DEPLOYMENT.md)
