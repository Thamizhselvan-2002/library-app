# 📚 Libraria — Library Management System

Full-stack LMS built with React, Node.js, Express, and MongoDB Atlas.
Features OTP-based email verification, JWT auth, fine management, and automated due-date reminders.

---

## 🏗 Project Structure

```
library-app/
├── backend/
│   ├── server.js                  ← Express app entry point
│   ├── .env                       ← Environment variables (fill this in)
│   ├── models/
│   │   ├── User.js                ← User schema (OTP fields, fine tracking)
│   │   ├── Book.js                ← Book schema (copies, availability)
│   │   └── Transaction.js         ← Borrow/reserve/return records + fines
│   ├── routes/
│   │   ├── auth.js                ← Register, login, OTP verify/resend
│   │   ├── books.js               ← CRUD for books (admin add/remove)
│   │   ├── transactions.js        ← Borrow, reserve, return, fine payment
│   │   └── users.js               ← Member list, stats overview
│   ├── middleware/
│   │   └── auth.js                ← JWT guard + adminOnly guard
│   ├── utils/
│   │   ├── otp.js                 ← Secure OTP generation + expiry helpers
│   │   ├── mailer.js              ← Nodemailer setup + HTML email templates
│   │   └── notifications.js       ← Due reminder + fine notice emails
│   └── jobs/
│       └── scheduler.js           ← node-cron daily reminder + fine checker
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js
        └── App.jsx                ← Full React app (auth + dashboard)
```

---

## ⚙️ Setup Instructions

### 1. Backend

```bash
cd library-app/backend
npm install
```

Open `.env` and configure:

```env
# ── Database ─────────────────────────────────
MONGO_URI=mongodb+srv://thamizhselvan694:Thamizhselvan008@cluster0.z6ywxok.mongodb.net/LMSDB
JWT_SECRET=secret123
PORT=5000

# ── Admin ─────────────────────────────────────
# Students cannot register as admin without this code
ADMIN_SECRET=ADMIN2024

# ── Fine System ───────────────────────────────
FINE_PER_DAY=5

# ── Gmail SMTP (for OTP emails) ───────────────
# Your Gmail address
EMAIL_USER=thamizhselvan694@gmail.com
# App Password — NOT your regular Gmail password
# How to get it: https://myaccount.google.com/apppasswords
# (Requires 2-Step Verification to be enabled on your Google account)
EMAIL_PASS=your_16_character_app_password
```

Start the backend:

```bash
npm run dev     # development with auto-reload (nodemon)
npm start       # production
```

Verify it's running:
```
http://localhost:5000/api/health
→ { "status": "ok", "db": "connected" }
```

---

### 2. Frontend

```bash
cd library-app/frontend
npm install
npm start       # opens at http://localhost:3000
```

The React app proxies all `/api/*` requests to `http://localhost:5000` automatically via the `"proxy"` field in `package.json`. No CORS issues in development.

---

## 🔐 Authentication — How It Works

### Registration (3 steps)

```
1. Fill form (name, email, phone, password, role)
        ↓
2. Backend validates → generates 6-digit OTP → emails it to user
        ↓
3. User enters OTP in the digit boxes → account created + JWT issued
```

> **Email is verified before the account is created.** An unverified pending record is saved, but the user cannot log in until OTP is confirmed.

### Login (2 steps)

```
1. Enter email + password → backend validates credentials
        ↓
2. If correct → OTP emailed → user enters OTP → JWT issued
```

### OTP Security Details

| Property | Value |
|----------|-------|
| Length | 6 digits |
| Generation | `crypto.randomBytes` (cryptographically secure) |
| Expiry | 10 minutes |
| Max wrong attempts | 5 (then locked, must resend) |
| Resend | Available any time during OTP step |
| Storage | Hashed in MongoDB, cleared after use |

### Admin Registration

- Select the **Admin** role tab on the register page
- Enter the **Admin Secret Code**: `ADMIN2024`
- Change this code in `.env` → `ADMIN_SECRET`

---

## 📋 Features by Role

### 👨‍🎓 Student
| Feature | Description |
|---------|-------------|
| Browse catalogue | Search by title, author, genre filter |
| Borrow books | 14-day loan period, blocked if unpaid fines exist |
| Reserve books | Reserve unavailable books for when they're returned |
| Return books | Fine calculated automatically if overdue |
| My Books | View current borrowed + reserved items |
| My History | Full transaction log with fine status |

### 🛡️ Admin
| Feature | Description |
|---------|-------------|
| Dashboard | Stats cards + genre chart + inventory donut + recent activity |
| Book Catalogue | View all books, add new, remove existing |
| Inventory | Edit total/available copies per book |
| Members | View all students, their activity and fines |
| Transactions | All borrow/return/reserve records, filter by status |
| Fine Management | Mark fines as paid |
| Manual Returns | Process any student's return directly |

---

## 💸 Fine System

- **Rate:** ₹5 per day overdue (set `FINE_PER_DAY` in `.env`)
- **Trigger:** Automatically calculated when a book is returned late
- **Formula:** `overdue_days × FINE_PER_DAY`
- **Block:** Students with unpaid fines cannot borrow new books
- **Payment:** Admin marks fines as paid in the Transactions page
- **Daily check:** Cron job at 9 AM recalculates and updates all overdue fines

---

## 📧 Email Notifications

All notifications are sent via Gmail SMTP using Nodemailer. **No paid services required.**

| Trigger | Email Sent |
|---------|-----------|
| Register | OTP verification email with 6-digit code |
| Login | OTP sign-in email with 6-digit code |
| Book due tomorrow | Reminder with book title, author, ISBN, due date |
| Book overdue | Fine notice with amount, days overdue, rate |

### Cron Schedule (auto-runs while server is on)

| Time | Job |
|------|-----|
| 8:00 AM daily | Find all books due tomorrow → send reminder emails |
| 9:00 AM daily | Find all overdue books → update fines → send fine notice emails |

### Gmail App Password Setup

1. Go to your Google Account → **Security**
2. Enable **2-Step Verification** (required)
3. Visit: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
4. App: **Mail** → Device: **Other** → name it "Libraria"
5. Copy the 16-character password (e.g. `abcdefghijklmnop`)
6. Paste into `.env` as `EMAIL_PASS` (no spaces)

> **Dev mode:** If `EMAIL_PASS` is not configured, OTPs are printed directly to the server terminal console so you can test without email.

---

## 🚀 Production Deployment

### Backend — Railway / Render / Fly.io

```bash
# In your hosting dashboard, set all .env variables
# Deploy the backend/ directory
# Start command: npm start
```

### Frontend — Vercel / Netlify

```bash
# 1. Update the API base URL in frontend/src/App.jsx (line 3):
const API = "https://your-backend-domain.com/api";

# 2. Build
npm run build

# 3. Deploy the build/ folder
```

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, vanilla CSS (no UI library) |
| Backend | Node.js 18+, Express 4 |
| Database | MongoDB Atlas (Mongoose ODM) |
| Auth | JWT (7-day expiry) + Email OTP (10-min expiry) |
| OTP Generation | Node.js `crypto` module (built-in, free) |
| Email | Nodemailer + Gmail SMTP (free) |
| Scheduler | node-cron (runs inside the server process) |
| Password Hashing | bcryptjs (12 salt rounds) |

---

## 🐛 Troubleshooting

| Problem | Fix |
|---------|-----|
| `Registration failed` 500 error | Check terminal for exact error. Usually MongoDB connection or missing `.env` values |
| OTP email not received | Check spam folder. Verify `EMAIL_USER` and `EMAIL_PASS` in `.env`. OTP is also printed to terminal |
| `Invalid admin secret` | Make sure you typed `ADMIN2024` exactly (case-sensitive) |
| `Outstanding fine` blocks borrow | Admin must mark the fine as paid in Transactions page first |
| MongoDB connection error | Check your IP is whitelisted in MongoDB Atlas → Network Access → Add `0.0.0.0/0` for dev |
| Frontend can't reach API | Make sure backend is running on port 5000. Check browser console for CORS errors |
