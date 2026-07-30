# 📖 Applicant Tracking System (ATS) - User Guide & Manual

Welcome to the **Applicant Tracking System (ATS)**. This document provides a step-by-step guide for using the ATS platform effectively across all user roles.

---

## 📋 Table of Contents

1. [System Overview & User Roles](#-system-overview--user-roles)
2. [Getting Started & Login](#-getting-started--login)
3. [Recruiter Portal & Daily Workflows](#-recruiter-portal--daily-workflows)
   - [Dashboard Overview](#dashboard-overview)
   - [Adding & Managing Candidates](#adding--managing-candidates)
   - [Resume Upload & Parsing](#resume-upload--parsing)
   - [Candidate Pipeline & Stage Updates](#candidate-pipeline--stage-updates)
   - [Daily Activity & WFH Status](#daily-activity--wfh-status)
4. [Team Leader (TL) & Manager Portal](#-team-leader-tl--manager-portal)
   - [Team Performance Monitoring](#team-performance-monitoring)
   - [Requisition Allocation](#requisition-allocation)
   - [Revenue & Joiner Analytics](#revenue--joiner-analytics)
5. [Admin Portal & System Administration](#-admin-portal--system-administration)
   - [User Management](#user-management)
   - [Job Requisitions (JRs)](#job-requisitions-jrs)
   - [System Analytics & Exports](#system-analytics--exports)
6. [Walk-in Candidate Self-Registration](#-walk-in-candidate-self-registration)
7. [Finance & Invoice Management](#-finance--invoice-management)
8. [Frequently Asked Questions (FAQ) & Troubleshooting](#-frequently-asked-questions-faq--troubleshooting)

---

## 👥 System Overview & User Roles

The ATS platform supports role-based access control (RBAC). Each role sees tailored views and actions:

| Role | Primary Responsibilities |
|---|---|
| **Admin** | Full system control, user creation, JR creation, global analytics, system configurations. |
| **Manager** | High-level performance tracking, revenue oversight, department-wide metrics. |
| **Team Leader (TL)** | Managing team members, monitoring daily targets, reviewing candidate submissions. |
| **Recruiter** | Daily candidate sourcing, interviewing, updating stage statuses, logging daily calls. |
| **Walk-in Candidate** | Kiosk / Self-registration portal for candidates visiting the office directly. |
| **Finance** | Invoice tracking, joining billing verifications, payment status monitoring. |

---

## 🔑 Getting Started & Login

### Accessing the Portal
1. Open your browser and navigate to the ATS application URL (default local: `http://localhost:7899`).
2. Enter your registered **Email Address** and **Password**.
3. Select your role if prompted or use your default role assignment.

### Default Testing Credentials
*(Note: Change passwords after initial login)*

- **Admin Portal**: `admin@whitehorsemanpower.in` / `Password2026!`
- **Team Leader Portal**: `suresh@whm.com` / `password123`
- **Manager Portal**: `kavita@whm.com` / `password123`
- **Recruiter Portal**: `priya@whm.com` / `password123`

---

## 👩‍💼 Recruiter Portal & Daily Workflows

### Dashboard Overview
When a recruiter logs in, the dashboard displays real-time metrics:
- **Total Candidates Sourced**: Candidates added during the current period.
- **Interviews Scheduled**: Upcoming candidate interviews.
- **Selections & Offers**: Candidates selected by clients or offered positions.
- **Joiners**: Candidates who have successfully joined client companies.

### Adding & Managing Candidates
1. Click **+ Add Candidate** from the top navigation bar or recruiter dashboard.
2. Fill in essential candidate details:
   - Full Name, Phone Number, Email
   - Current Location, Total Experience, Current CTC, Expected CTC
   - Primary Skillset & Applied Position / JR ID
3. Click **Save Candidate**.

### Resume Upload & Parsing
- Drag and drop candidate resumes (`.pdf`, `.docx`, or `.doc`) into the **Upload Resume** field.
- The built-in parser automatically extracts candidate details (Name, Contact Info, Skills, Work History) to pre-fill candidate forms.

### Candidate Pipeline & Stage Updates
Track candidate progression through the recruitment lifecycle:
1. **Screening / Sourced**: Initial contact made.
2. **Internal Interview / L1**: Recruiter evaluation.
3. **Client Submission**: Profile submitted to client HR.
4. **Client Interview (L2 / Managerial / HR)**: External interviews.
5. **Offered**: Candidate accepted job offer.
6. **Joined**: Candidate joined the organization (Triggers revenue billing entry).
7. **Rejected / Backed Out**: Candidate was rejected or declined offer.

To update stage: Open candidate profile -> Select **Update Status** -> Choose new stage & add detailed notes.

### Daily Activity & WFH Status
- **Work From Home (WFH) Indicator**: Mark your daily working location (Office vs. Remote WFH).
- **Daily Call Log**: Log number of candidate calls made, interviews scheduled, and follow-ups.

---

## 👔 Team Leader (TL) & Manager Portal

### Team Performance Monitoring
- View aggregate stats for all recruiters under your hierarchy.
- Monitor active pipeline count per recruiter.
- Identify bottlenecks (e.g., high sourcing but low interview conversion).

### Requisition Allocation
- Assign open **Job Requisitions (JRs)** to specific recruiters or recruiter groups.
- Set priority levels (Urgent, High, Medium, Standard) for requisitions.

### Revenue & Joiner Analytics
- Monitor revenue generated per recruiter and team.
- Track candidate joining dates and billing eligibility.

---

## 🛠️ Admin Portal & System Administration

### User Management
1. Navigate to **Admin Dashboard -> User Management**.
2. Click **+ Add User**.
3. Fill in user details, select Role (**Recruiter**, **TL**, **Manager**, **Finance**), and assign reporting manager.
4. Manage status (Active / Inactive) or reset passwords.

### Job Requisitions (JRs)
1. Go to **JRs List**.
2. Click **Create New JR**.
3. Define client name, job title, experience requirements, salary range, location, and open positions count.
4. Publish JR to make it available in recruiters' dropdowns.

### System Analytics & Exports
- Download reports in Excel/CSV format (Candidate pipeline export, recruiter performance export, revenue reports).
- View overall funnel conversion rate charts.

---

## 🚶 Walk-in Candidate Self-Registration

For walk-in candidates visiting office branch locations:
1. Access the Walk-in Portal endpoint at `/walkin` or click **Walk-in Candidate Portal** on login page.
2. Candidate fills in personal information, uploads resume, and selects recruiter/interviewer.
3. Candidate submits form and receives a queue token number.
4. Front-desk / Recruiter sees real-time notification on candidate arrival.

---

## 💳 Finance & Invoice Management

1. **Joined Candidates Billing**: Once a candidate stage changes to **Joined**, candidate details flow to Finance view.
2. **Invoice Generation**: Track invoice number, billing amount, GST details, and payment due dates.
3. **Payment Clearance**: Update status from *Pending Invoice* to *Invoice Sent* to *Payment Cleared*.

---

## ❓ Frequently Asked Questions (FAQ) & Troubleshooting

#### Q1: Candidate phone number or email is showing as duplicate.
> **Solution**: The system enforces unique candidate contact checks to prevent duplicate records across recruiters. Search the candidate database first before creating a new record.

#### Q2: Backend connection error / Unable to load data.
> **Solution**: Ensure the backend server (`npm run dev` in `/backend`) is running on port 5001 and MongoDB is connected.

#### Q3: How do I export candidate data?
> **Solution**: As an Admin or TL, click the **Export Excel** button on the Candidates List page.

---

*Need support or technical assistance? Contact system administrator at `admin@whitehorsemanpower.in`.*
