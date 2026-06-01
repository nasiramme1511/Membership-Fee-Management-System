# Membership Fee Contribution For Prosperity Party Dire Dawa Branch Office
## Dire Dawa City Administration

Enterprise-grade membership contribution management system replacing Excel-based workflows with a fully automated, directive-based calculation engine.

---

## Table of Contents

1. [Overview & Features](#overview--features)
2. [Tech Stack](#tech-stack)
3. [Quick Start](#quick-start)
4. [Setup Guide](#setup-guide)
5. [Member Classification System](#member-classification-system)
6. [API Documentation](#api-documentation)
7. [New Features (v2.1.0)](#new-features-v210)
8. [What's New (v2.0.0)](#whats-new-v200)
9. [Changelog](#changelog)
10. [Testing Checklist](#testing-checklist)
11. [Troubleshooting](#troubleshooting)
12. [Security](#security)

---

## Overview & Features

### Core Features
- **Complete Excel Replacement** — Digital member management with auto-classification
- **Directive-Based Calculations** — Automatic contribution calculation based on member type
- **Payment Tracking** — Record payments with automatic receipt generation
- **PDF Receipts** — Unique receipt ID for every payment with official PDF download
- **Financial Reports** — Monthly, yearly, HQ vs Branch distribution
- **Defaulter Detection** — Automatic identification of unpaid members
- **Excel Import/Export** — Bulk import from Excel with validation
- **Dashboard Analytics** — Charts, trends, top contributors, Urban vs Rural
- **Role-Based Access** — Admin, Operator, Viewer roles
- **Dark Mode** — Full dark mode support
- **Responsive UI** — Works on desktop, tablet, and mobile

### Advanced Features
- **Cluster/Sector Hierarchy** — Urban/Rural cluster with 25+ sectors
- **PDF Receipt Generation** — Official formatted PDF receipts with download
- **SMS Notification Service** — Placeholder for Twilio/Africa's Talking integration
- **Backup System** — Database backup and restore utilities
- **Multi-Language Support** — Framework for English/Amharic translations
- **Wing Management** — Women & Youth wing tracking
- **Receipt Modal** — View, print, and download receipts directly from UI

---

## Tech Stack

### Backend
- **Node.js + Express** — REST API server
- **MySQL + Sequelize** — Relational database & ORM
- **JWT Authentication** — Secure token-based auth
- **Multer + XLSX** — Excel file processing
- **PDFKit** — PDF receipt generation

### Frontend
- **React + TypeScript** — Type-safe UI components
- **Tailwind CSS** — Modern styling
- **Recharts** — Data visualization
- **Axios** — HTTP client
- **React Router** — Client-side routing
- **Framer Motion** — Animations
- **i18next** — Internationalization

### Project Structure

```
Membership Fee Contribution For Prosperity Party Dire Dawa Branch Office/
├── backend/
│   ├── config/db.js              # MySQL connection (Sequelize)
│   ├── controllers/              # API route controllers
│   ├── models/                   # Sequelize models
│   ├── routes/                   # Express routes
│   ├── utils/                    # classificationEngine, receiptPDF, smsService, backupService, i18n
│   ├── uploads/                  # Uploaded profile photos & docs
│   ├── .env                      # Environment variables
│   └── server.js                 # Entry point
│
└── frontend/
    ├── src/
    │   ├── components/           # Reusable UI (ReceiptModal, MemberModal, etc.)
    │   ├── context/              # Auth state management
    │   ├── lib/                  # Axios instance & API config
    │   ├── pages/                # Dashboard, Members, Payments, Reports, Settings, etc.
    │   ├── i18n/locales/         # en.json, am.json
    │   ├── App.tsx               # Main routing
    │   └── main.tsx              # Entry point
    └── package.json
```

---

## Quick Start

### Prerequisites
- **Node.js** v18+
- **MySQL** 8.0+ or **MariaDB**
- **npm** or **yarn**

### 1. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

Create `backend/.env`:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=30d

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=membership_fee_db
DB_PORT=3306

FRONTEND_URL=http://localhost:5173
```

### 3. Setup Database
1. Create a MySQL database named `membership_fee_db`.
2. Tables are auto-created by Sequelize on backend start.

### 4. Seed Database
```bash
cd backend
npm run seed
```

This creates:
- Admin: `admin@mcms.ddu` / `admin123`
- Operator: `operator@mcms.ddu` / `operator123`
- 29 sample members across all Urban/Rural sectors
- Sample payments, receipts, and default settings

### 5. Run the Application

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```
Backend runs on `http://localhost:5000`

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:5173`

### 6. Login
Open `http://localhost:5173` and login with `admin@mcms.ddu` / `admin123`.

### Common Commands
```bash
# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev

# Re-seed database (WARNING: deletes all data)
cd backend && npm run seed

# Production build
cd frontend && npm run build
```

---

## Setup Guide

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `JWT_SECRET` | JWT signing secret | — |
| `JWT_EXPIRE` | Token expiration | `30d` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_USER` | MySQL user | `root` |
| `DB_PASSWORD` | MySQL password | — |
| `DB_NAME` | Database name | `membership_fee_db` |
| `DB_PORT` | MySQL port | `3306` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:5173` |

### SMS Configuration (Optional)
```env
ENABLE_SMS=false
SMS_PROVIDER=twilio  # or africas-talking
SMS_API_KEY=your_key
SMS_API_SECRET=your_secret
SMS_FROM_NUMBER=+1234567890
```

### Production Deployment

**Backend:**
```bash
NODE_ENV=production
JWT_SECRET=strong_random_secret
FRONTEND_URL=https://yourdomain.com
npm start
```

**Frontend:**
```bash
npm run build
# Serve frontend/dist with nginx or static server
```

---

## Member Classification System

### Salary-Based (Percentage of Salary)

| Employment Type | Salary Range | Percentage |
|----------------|--------------|-----------|
| Government | ≤ 5,000 | 1% |
| Government | 5,001 – 10,000 | 2% |
| Government | 10,001 – 20,000 | 3% |
| Government | 20,001 – 50,000 | 4% |
| Government | > 50,000 | 5% |
| Private/NGO | ≤ 10,000 | 2% |
| Private/NGO | 10,001 – 25,000 | 3% |
| Private/NGO | 25,001 – 50,000 | 4% |
| Private/NGO | > 50,000 | 5% |
| Embassy | Any | 5% (USD) |

### Fixed Fee Members

| Type | Monthly Fee |
|------|------------|
| Student | 1 ETB |
| Farmer | 5 ETB |
| Pastoralist | 5 ETB |
| Labor | 3 ETB |
| Micro Business | 5 ETB |
| Small Business | 10 ETB |
| Medium Business | 20 ETB |

### Investor Members

| Capital | Monthly Fee |
|---------|------------|
| ≤ 5M ETB | 500 ETB |
| 5M – 10M ETB | 1,000 ETB |
| > 10M ETB | 2,000 ETB |

### Revenue Distribution
- **HQ Share:** 20% of annual fee
- **Branch Share:** 80% of annual fee

### Income Auto-Calculation Reference

When importing from Excel without an Income value, the system auto-calculates based on sector, occupation, or business type.

**Urban Sector Rates (ETB/month):**
| Sector | Estimated Income |
|--------|-----------------|
| Kebele | 8,000 |
| Government Office | 12,000 |
| Public Institution | 10,000 |
| Health Facility | 15,000 |
| Education Institution | 12,000 |
| Micro Enterprise | 25,000 |
| Small Business | 50,000 |
| Medium Business | 150,000 |
| Market | 15,000 |
| Private Company | 20,000 |
| NGO | 25,000 |
| Bank | 18,000 |
| Factory | 20,000 |
| Embassy | 30,000 |

**Rural Sector Rates (ETB/month):**
| Sector | Estimated Income |
|--------|-----------------|
| Woreda | 6,000 |
| Farming | 18,000 |
| Pastoral | 15,000 |
| Agro Activity | 20,000 |
| Cooperative | 25,000 |
| Local Market | 12,000 |
| Labor | 8,000 |
| Informal Work | 10,000 |
| Self Employed | 15,000 |
| Rural School | 10,000 |
| Health Post | 9,000 |

**Smart Matching Priority:**
1. Sector Match (highest)
2. Occupation Match
3. Business Type Match
4. Membership Type Default (fallback)

### Excel Import Format

**Required Columns:** `Name, Gender, Phone, Email, Branch, Salary, Currency, EmploymentType, Occupation, BusinessType, Capital, Income`

**All Supported Columns:** Name, Gender, Age, Phone, Email, Cluster, Sector, Branch, Salary, Currency, EmploymentType, Occupation, Business Type, Capital, Income, RegistrationDate

---

## API Documentation

**Base URL:**
```
Development: http://localhost:5000/api
Production: https://yourdomain.com/api
```

**Authentication:** All protected routes require `Authorization: Bearer <token>`.

### Authentication Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login | No |
| GET | `/api/auth/me` | Get current user | Yes |
| GET | `/api/auth/users` | Get all users | Admin |

#### Register
```http
POST /api/auth/register
Content-Type: application/json
{
  "username": "string",
  "email": "string",
  "password": "string (min 6 chars)",
  "fullName": "string",
  "role": "admin|operator|viewer"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json
{
  "email": "string",
  "password": "string"
}
// Response: { success, data: { token, user } }
```

### Members Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/members` | Create member | Admin, Operator |
| GET | `/api/members` | Get members (paginated) | Yes |
| GET | `/api/members/:id` | Get single member | Yes |
| PUT | `/api/members/:id` | Update member | Admin, Operator |
| DELETE | `/api/members/:id` | Delete member | Admin |
| POST | `/api/members/bulk` | Bulk create members | Admin, Operator |
| GET | `/api/members/stats` | Get member statistics | Yes |

**Query Parameters:** `page`, `limit`, `search`, `cluster`, `sector`, `branch`, `membershipType`, `status`, `paymentStatus`, `minSalary`, `maxSalary`, `dateFrom`, `dateTo`, `minAge`, `maxAge`

#### Create Member
```http
POST /api/members
Authorization: Bearer <token>
Content-Type: application/json
{
  "fullName": "string",
  "gender": "Male|Female",
  "phone": "string",
  "email": "string",
  "nationalId": "string",
  "address": { "region": "Dire Dawa", "city": "string", "woreda": "string" },
  "branch": "string",
  "cluster": "Urban|Rural|N/A",
  "sector": "string",
  "membershipType": "Salary-Based|Non-Salary|Business|Investor|Student|Wing|Special",
  "financial": {
    "salary": number,
    "employmentType": "Government|Private|NGO|Embassy",
    "currency": "ETB|USD",
    "allowances": number
  },
  "wing": { "wingType": "Women|Youth", "parentMemberId": "string" }
}
// Response includes memberId, contribution (monthlyFee, percentage, annualFee, hqShare, branchShare), netSalary
```

### Payments Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/payments` | Record payment | Admin, Operator |
| GET | `/api/payments` | Get payments | Yes |
| GET | `/api/payments/:id` | Get single payment | Yes |
| GET | `/api/payments/member/:memberId` | Get payments by member | Yes |
| POST | `/api/payments/bulk` | Bulk payments | Admin, Operator |

#### Create Payment
```http
POST /api/payments
Authorization: Bearer <token>
Content-Type: application/json
{
  "member": "member_id",
  "amount": number,
  "currency": "ETB|USD",
  "frequency": "Monthly|Quarterly|Semi-Annual|Annual",
  "method": "Cash|Bank Transfer|Mobile Money|Check",
  "receivedBy": "string",
  "period": { "month": 1-12, "year": number },
  "notes": "string"
}
// Response includes payment + receipt (receiptId)
```

### Receipts Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/receipts` | Get receipts | Yes |
| GET | `/api/receipts/:id` | Get single receipt | Yes |
| GET | `/api/receipts/id/:receiptId` | Get by receipt ID | Yes |
| GET | `/api/receipts/:id/download` | Download PDF | Yes |
| GET | `/api/receipts/:id/pdf` | Get PDF data | Yes |
| PUT | `/api/receipts/:id/void` | Void receipt | Admin |

### Reports Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/reports/monthly-revenue` | Monthly revenue report | Yes |
| GET | `/api/reports/yearly-revenue` | Yearly revenue report | Yes |
| GET | `/api/reports/hq-branch` | HQ vs Branch distribution | Yes |
| GET | `/api/reports/defaulters` | Defaulter report | Yes |
| GET | `/api/reports/export` | Export all data | Yes |

**Query Parameters:** `month` (1-12), `year` (2024-2026)

### Dashboard Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/dashboard/stats` | Dashboard statistics | Yes |
| GET | `/api/dashboard/growth` | Growth rate | Yes |

### Import Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/import` | Import from Excel | Admin, Operator |
| GET | `/api/import/template` | Get import template | Yes |

### Settings Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/settings` | Get settings | Yes |
| PUT | `/api/settings` | Update settings | Admin |
| POST | `/api/settings/recalculate` | Recalculate all members | Admin |
| POST | `/api/settings/branches` | Add branch | Admin |
| PUT | `/api/settings/branches/:branchId` | Update branch | Admin |
| DELETE | `/api/settings/branches/:branchId` | Delete branch | Admin |

### Backup Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/backup/create` | Create database backup | Admin |
| POST | `/api/backup/export-json` | Export data as JSON | Yes |
| GET | `/api/backup/list` | List all backups | Admin |
| DELETE | `/api/backup/delete` | Delete a backup | Admin |
| POST | `/api/backup/clean` | Clean old backups | Admin |

### Role-Based Access Control

| Endpoint | Admin | Operator | Viewer |
|----------|-------|----------|--------|
| Auth (Login/Register) | ✅ | ✅ | ✅ |
| Members (CRUD) | ✅ | ✅ (No Delete) | ✅ (Read Only) |
| Payments (CRUD) | ✅ | ✅ | ✅ (Read Only) |
| Receipts (Read) | ✅ | ✅ | ✅ |
| Receipts (Void) | ✅ | ❌ | ❌ |
| Reports (Read) | ✅ | ✅ | ✅ |
| Dashboard (Read) | ✅ | ✅ | ✅ |
| Settings (Read) | ✅ | ✅ | ✅ |
| Settings (Update) | ✅ | ❌ | ❌ |
| Import | ✅ | ✅ | ❌ |
| Backup | ✅ | ❌ | ❌ |

### Error Responses

```json
400: { "success": false, "message": "Validation error" }
401: { "success": false, "message": "Not authorized, token failed" }
403: { "success": false, "message": "Not authorized to access this resource" }
404: { "success": false, "message": "Resource not found" }
500: { "success": false, "message": "Internal Server Error" }
```

---

## New Features (v2.1.0)

*Date: April 14, 2026*

### 1. Age Field
- `age` field on Member model (0–150 range)
- Age column in Members table
- Min/Max Age filters
- Import from Excel with Age column

### 2. Date Range Filter
- `dateFrom` / `dateTo` query params on `/api/members`
- Date pickers in filter panel
- Reg. Date column in Members table

### 3. Sector Filter
- Sector dropdown in filter panel (25+ options, Urban/Rural grouped)
- Backend `sector` query parameter

### 4. Auto-Calculated Estimated Income from Excel Import
When importing without an Income value, the system auto-calculates based on:
1. **Sector** (e.g., Government Office → 12,000 ETB)
2. **Occupation** (e.g., Doctor → 25,000 ETB)
3. **Business Type** (e.g., Retail → 30,000 ETB)
4. **Membership Type** (fallback default)

### Updated Members Table (19 columns)
ID, Name, **Age** (NEW), Cluster, Sector, Branch, Type, Gross Salary, Pension, Tax, %, Fee, Currency, Net Salary, **Reg. Date** (NEW), Status, Payment, Actions

### Enhanced Filter Panel (10 filters)
- Cluster, **Sector** (NEW), Branch, Membership Type
- **Date From** (NEW), **Date To** (NEW), **Min Age** (NEW), **Max Age** (NEW)
- Status, Payment Status

---

## What's New (v2.0.0)

*Date: April 14, 2026*

### 13 Major Additions

1. **Cluster/Sector Hierarchy** — Urban/Rural auto-classification, 25+ sectors
2. **PDF Receipt System** — Professional formatted PDF receipts with download
3. **Enhanced Dashboard** — Urban vs Rural pie chart, Members by Sector bar chart
4. **Backup System** — Database backup/restore, JSON export, backup management
5. **SMS Notifications** — Placeholder for Twilio/Africa's Talking
6. **Multi-Language Support** — English/Amharic i18n framework
7. **Receipt Modal** — View, print, download receipts from UI
8. **Enhanced Member Management** — Cluster/sector fields, grouped dropdowns
9. **29 Sample Members** — All Urban and Rural sectors, every membership type
10. **Enhanced Settings** — Branch management with cluster/sector
11. **Advanced Filtering** — Cluster, sector, combinatorial filters
12. **API Enhancements** — New backup, PDF download, cluster/sector endpoints
13. **Complete Documentation** — SETUP_GUIDE, API_DOCUMENTATION, CHANGELOG

### Before vs After

| Feature | Before | After |
|---------|--------|-------|
| Sample Members | 12 | **29** |
| Sectors Supported | Basic | **25+** |
| Receipt Format | Data only | **PDF Download** |
| Cluster Support | None | **Auto-Detection** |
| Backup System | None | **Full System** |
| SMS Support | None | **Ready (3 providers)** |
| Multi-Language | None | **EN/AM Framework** |
| Dashboard Charts | 4 | **6** |
| Documentation | Basic | **Complete** |

### New Files Created

**Backend:** `utils/receiptPDF.js`, `utils/smsService.js`, `utils/backupService.js`, `utils/i18n.js`, `controllers/backupController.js`, `routes/backupRoutes.js`

**Frontend:** `components/ReceiptModal.tsx`

---

## Changelog

### [2.0.0] - 2026-04-14

#### Major Features
- **Cluster/Sector Hierarchy:** Added `cluster` (Urban/Rural/N/A) and `sector` fields with 25+ sectors; auto-detection of cluster based on sector
- **PDF Receipt Generation:** Professional PDF receipts via pdfkit, download endpoint
- **Enhanced Dashboard Analytics:** Urban vs Rural pie chart, Members by Sector bar chart
- **Backup System:** Database backup, JSON export, list/manage/clean backups
- **SMS Notification Service:** Twilio and Africa's Talking support (placeholder, disabled by default)
- **Multi-Language Support:** English and Amharic translation frameworks

#### Backend Changes
- **Models:** Member.js (cluster, sector), Setting.js (enhanced branches)
- **Controllers:** memberController (cluster/sector handling, filtering), dashboardController (cluster/sector stats), receiptController (PDF generation)
- **New Utilities:** classificationEngine, receiptPDF, smsService, backupService, i18n
- **Dependencies:** pdfkit

#### Frontend Changes
- **New:** ReceiptModal.tsx
- **Updated:** Members.tsx (cluster/sector columns, cluster filter), Dashboard.tsx (new charts), MemberModal.tsx (cluster/sector dropdowns), Settings.tsx (branch cluster/sector fields)

#### Seed Data
- 29 sample members (was 12), covering all Urban/Rural sectors and all membership types

### [1.0.0] - Previous Release
- Basic member CRUD, auto-classification engine, contribution calculation
- Payment tracking, basic receipt generation, Excel import/export
- Dashboard analytics, financial reports, role-based access control, dark mode

---

## Testing Checklist

### Authentication
- [ ] Login with `admin@mcms.ddu` / `admin123`
- [ ] Login as operator, verify restricted access
- [ ] Login as viewer, verify read-only access

### Members Management
- [ ] View 29 sample members with cluster/sector columns
- [ ] Test all filters: Cluster, Sector, Branch, Membership Type, Status, Payment Status
- [ ] Search by name, member ID, phone
- [ ] Add member with all fields including cluster/sector
- [ ] Edit member, verify calculations update
- [ ] Delete member
- [ ] Export to Excel
- [ ] Import from Excel (download template, fill, upload)

### Dashboard
- [ ] Verify stat cards (total members, active, revenue, etc.)
- [ ] Urban vs Rural pie chart renders
- [ ] Members by Sector bar chart renders
- [ ] Members by Branch chart renders
- [ ] Top 10 Contributors list
- [ ] Payment trend line chart

### Payments & Receipts
- [ ] Record payment (select member, amount auto-fills)
- [ ] Receipt auto-generated with unique ID
- [ ] View receipt in modal
- [ ] Download PDF receipt
- [ ] Print receipt

### Reports
- [ ] Monthly Revenue Report with charts
- [ ] Yearly Revenue Report with monthly breakdown
- [ ] HQ vs Branch Distribution (20/80 split)
- [ ] Defaulter Report with outstanding amounts
- [ ] Export All Data to Excel

### Settings
- [ ] Edit contribution rules
- [ ] Manage branches (add/edit/delete with cluster/sector)
- [ ] System settings (org name, notification toggles)
- [ ] Recalculate All members

### Feature Scenarios

**Scenario 1: Government Employee Registration**
- Register with 15,000 ETB salary → Type: Salary-Based, Government, 3%, 450 ETB
- Verify net salary: Gross 15,000 - Pension (7%: 1,050) - Tax - Contribution (450) = Final Net

**Scenario 2: Business Member**
- Small business with 200,000 ETB → Type: Business, Sub-Type: Small, Fee: 10 ETB

**Scenario 3: Investor**
- 8,000,000 ETB capital → Type: Investor, Fee: 1,000 ETB

**Scenario 4: Rural Farmer**
- Farmer in rural area → Type: Non-Salary, Sub-Type: Farmer, Cluster: Rural, Sector: Farming, Fee: 5 ETB

**Scenario 5: Payment & Receipt**
- Record payment → Status changes to Paid, receipt auto-generated, PDF download works

**Scenario 6: Defaulter Detection**
- Unpaid member appears in Defaulter Report with outstanding amount

**Scenario 7: Excel Import**
- Import 10 members with various types, verify auto-classification and calculations

---

## Troubleshooting

### MySQL Connection Error
- Ensure MySQL/MariaDB service is running (XAMPP or Windows Services)
- Verify `DB_USER` and `DB_PASSWORD` in `backend/.env`
- Ensure `membership_fee_db` database exists

### Port Already in Use
```bash
# Change PORT in backend/.env
PORT=5001

# Change frontend port in frontend/vite.config.ts
server: { port: 5174 }
```

### CORS Error
- Ensure `FRONTEND_URL` in `backend/.env` matches your frontend URL

### Can't Login
```bash
cd backend
npm run seed
```

### PDF Not Downloading
- Check browser pop-up blocker
- Allow downloads from localhost
- Check backend logs for errors

### Import Fails
- Verify Excel file format (.xlsx, .xls, or .csv)
- Check required columns: Name, Phone, Cluster, Sector, Branch
- Ensure no duplicate phone numbers
- Verify salary values are numbers

---

## Security

- **JWT Authentication** — Token-based secure access (30d expiry)
- **Role-Based Access Control** — Admin, Operator, Viewer
- **Password Hashing** — bcrypt for secure password storage
- **Input Validation** — Server-side validation on all endpoints
- **CORS Protection** — Configured allowed origins
- **No Payment Without Receipt** — Enforced business rule

### Security Notes
1. Change default passwords after first login
2. Change `JWT_SECRET` in production (use a strong random string)
3. Update `FRONTEND_URL` for production (add all allowed origins)
4. Database: enable authentication, regular backups

---

## License

Developed for **Dire Dawa City Administration Finance Bureau** internal use.

---

**Version:** 2.1.0  
**Status:** Production Ready ✅  
**Developed with ❤️ for Dire Dawa City Administration Finance Bureau**
