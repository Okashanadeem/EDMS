# EDMS Environment Configuration Guide

This guide explains every variable required in your `.env` files, why they are necessary, and how to generate or obtain their values.

---

## 📁 Server Configuration (`server/.env`)

The backend requires these variables to handle the database, security, and automated emails.

### 1. Database Configuration
*   **`DATABASE_URL`**: The connection string for your PostgreSQL database.
    *   **Format:** `postgresql://[user]:[password]@[host]:[port]/[database_name]`
    *   **Example:** `postgresql://postgres:Admin@123@localhost:5432/edms_db`

### 2. Security (JWT)
*   **`JWT_SECRET`**: A long, random string used to sign your login tokens. **Never share this.**
    *   **How to create:** Open your terminal and run this command to generate a secure 64-character string:
        ```bash
        node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
        ```
*   **`JWT_EXPIRES_IN`**: How long a user stays logged in before needing to re-login.
    *   **Recommended:** `8h` (8 hours) or `1d` (1 day).

### 3. Application Settings
*   **`PORT`**: The port your backend server runs on. Default is `4000`.
*   **`NODE_ENV`**: Set to `development` for local work or `production` for live servers.
*   **`UPLOAD_DIR`**: The folder where document attachments are saved. Default is `./uploads`.
*   **`MAX_FILE_SIZE_MB`**: Limits the size of uploaded files. Recommended: `10`.

### 4. SMTP Email Configuration (Automated Credentials)
These settings allow the system to email passwords to new officers automatically.

#### **Option A: For Development (using Mailtrap)**
[Mailtrap](https://mailtrap.io) is a "fake" SMTP server for testing. It catches emails without sending them to real addresses.
1.  Create a free account at Mailtrap.io.
2.  Go to "Inboxes" -> "SMTP Settings".
3.  Copy the Host, Port, Username, and Password.
    *   `SMTP_HOST=smtp.mailtrap.io`
    *   `SMTP_PORT=2525`
    *   `SMTP_USER=your_mailtrap_username`
    *   `SMTP_PASS=your_mailtrap_password`

#### **Option B: For Production (using Gmail)**
1.  Enable **2-Step Verification** on your Google Account.
2.  Search for **"App Passwords"** in your Google Account settings.
3.  Generate a new app password for "Mail".
4.  Copy the 16-character code.
    *   `SMTP_HOST=smtp.gmail.com`
    *   `SMTP_PORT=465`
    *   `SMTP_SECURE=true`
    *   `SMTP_USER=your_email@gmail.com`
    *   `SMTP_PASS=your_16_char_app_password`
    *   `SMTP_FROM="EDMS System" <your_email@gmail.com>`

---

## 📁 Client Configuration (`client/.env`)

The frontend only needs to know where the backend is located.

*   **`VITE_API_BASE_URL`**: The full URL to your backend API.
    *   **Standard:** `http://localhost:4000/api/v1`

---

## 🚀 Quick Setup Checklist

1.  [ ] Generate a `JWT_SECRET` using the Node.js command above.
2.  [ ] Ensure PostgreSQL is running and the `DATABASE_URL` is correct.
3.  [ ] Set up an SMTP provider (Mailtrap or Gmail) to enable automated emails.
4.  [ ] Restart both servers after making any changes to `.env` files.
