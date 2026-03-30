# EDMS - Setup & Operations Guide

This guide provides step-by-step instructions to initialize the Electronic Document Management System (EDMS) on your local machine and the daily workflow to run it.

---

## 📋 Prerequisites

Before starting, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **npm** (comes with Node.js)

---

## 🛠️ Initial Setup (First Time Only)

### 1. Database Initialization
Open your PostgreSQL terminal (psql) or use a GUI like pgAdmin/DBeaver:

1. **Create the Database:**
   ```sql
   CREATE DATABASE edms_db;
   ```

2. **Run Schema & Seed:**
   Navigate to the project root in your terminal and run:
   ```bash
   # Apply tables
   psql -d edms_db -f server/sql/schema.sql
   
   # Apply initial super admin
   psql -d edms_db -f server/sql/seed.sql
   ```
   *(Note: Ensure `psql` is in your system PATH. If on Windows, you might need to provide the full path to `psql.exe` or use pgAdmin's Query Tool).*

### 2. Backend Configuration
1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file (copy from `.env.example` if it exists):
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/edms_db
   JWT_SECRET=your_super_secret_random_string_here
   JWT_EXPIRES_IN=8h
   PORT=4000
   NODE_ENV=development
   UPLOAD_DIR=./uploads
   ```
   *(Replace `YOUR_PASSWORD` with your actual PostgreSQL password).*

### 3. Frontend Configuration
1. Navigate to the `client` directory:
   ```bash
   cd ../client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Ensure `.env` exists with the correct API URL:
   ```env
   VITE_API_BASE_URL=http://localhost:4000/api/v1
   ```

---

## 🚀 Daily Flow (To Run the App)

To start the application every day, you need to run **both** the backend and the frontend servers.

### Step 1: Start the Backend
Open a terminal in the `server` directory:
```bash
cd server
npm run dev
```
*Wait for: `Server running on port 4000` and `Database connected`.*

### Step 2: Start the Frontend
Open a **new** terminal window/tab in the `client` directory:
```bash
cd client
npm run dev
```
*The app will be available at: `http://localhost:5173`*

---

## 🔐 Default Credentials

Use these to log in for the first time as Super Admin:

- **Email:** `superadmin@edms.local`
- **Password:** `Admin@1234`

---

## 📂 Project Structure Overview

- `/server`: Express.js API, Database logic, and Uploads.
- `/client`: React.js (Vite) frontend application.
- `/specs`: Project requirements and implementation logs.
- `/Dev/Guide`: This documentation.

## ⚠️ Common Troubleshooting

- **Database Connection Error:** Ensure PostgreSQL service is running and your password in `server/.env` is correct.
- **Port 4000/5173 Busy:** Ensure no other instances of the app are running.
- **401 Unauthorized:** Your token might have expired. Log out and log back in.
