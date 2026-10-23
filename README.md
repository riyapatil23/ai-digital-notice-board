# ApexCampus AI — Digital Notice Board & Circular Simplifier

A complete production-grade MERN stack application designed for college and university campuses. ApexCampus AI connects Administrators, Faculty, and Students through automated notice analysis powered by **Google Gemini AI**, high-precision document text parsing and image OCR, a **real MongoDB notification system**, and instant **Socket.IO** real-time delivery.

---

## 1. Project Overview & Architecture

### Core Capabilities:
- **Genuine AI Integration**: Google Gemini (`@google/generative-ai`) extracts structured titles, departments, categories, priority, dates, deadlines, target audience, venues, action items, and student-friendly explanations.
- **Multimodal Document Ingestion**: Supports PDF circulars (`pdf-parse`) and photos/scans of notices (`tesseract.js` local OCR).
- **In-App Notification Engine**: Real MongoDB `Notification` collection tracking notifications for:
  - New notice publications
  - High-priority urgent notices
  - Deadline countdowns (7 days, 3 days, 1 day, due today)
  - Connection requests and acceptances
  - AI processing start, completion, and failure alerts
- **Real-Time Delivery**: Socket.IO broadcasts events instantaneously to student and admin notification bells without page refreshes, backed by a 30-second polling fallback.
- **Automated Deadline Reminders**: Scheduled `node-cron` daemon continuously evaluates upcoming cut-offs and generates reminder notifications with deduplication protection.
- **Multilingual Support**: Real-time translation into **Hindi**, **Marathi**, and **Gujarati**, with MongoDB document-level caching.
- **Original vs AI Simplified Toggle**: Notice view allows instant toggling between source document/image preview and AI-simplified action cards.
- **Personal AI Summarizer ("Ask AI / Summarize Notice")**: Dedicated student tool to paste circular text or pick an existing notice and receive immediate answers to 6 key operational questions.

### Ports:
- **Frontend**: `http://localhost:3000` (strict Vite port)
- **Backend**: `http://localhost:5000`

---

## 2. End-to-End Processing Flows

### Notice → AI → Database → Notification Flow:
```
Admin / Teacher
      ↓
Upload Notice (PDF, JPG, PNG, WEBP)
      ↓
Express Backend (/api/notices)
      ↓
PDF Text Parsing (pdf-parse) OR Local Image OCR (tesseract.js)
      ↓
Text Cleaning & Sanitization
      ↓
Google Gemini AI Engine (gemini-3.5-flash-lite / gemini-3.5-flash)
      ↓
Structured JSON Extraction (Summary, Points, Priority, Dates, Deadlines, Actions)
      ↓
Persist Notice Document in MongoDB Atlas
      ↓
Determine Target Students (Connected or All Enrolled)
      ↓
Create MongoDB Notifications (NEW_NOTICE, IMPORTANT_NOTICE, DEADLINE, AI_PROCESSING)
      ↓
Socket.IO Event Emission (`new_notification`, `notification_count_updated`)
      ↓
Student Real-Time Notification Bell (🔔 badge count increments live)
      ↓
Student Opens Notice → Original Document / AI Simplified View Toggle
```

---

## 3. Technology Stack

- **Frontend**: React 19, Vite (strict port 3000), Tailwind CSS, React Router v7, Lucide Icons, Axios, Socket.IO Client
- **Backend**: Node.js, Express 5, Mongoose, Socket.IO, node-cron, Multer, bcryptjs, JSON Web Tokens (JWT)
- **Database**: MongoDB Atlas Cluster
- **AI Engine**: Google Gemini API (`@google/generative-ai`), candidate models: `gemini-3.5-flash-lite`, `gemini-3.5-flash`, `gemini-3.8-flash`
- **File & OCR Processing**: `pdf-parse`, `tesseract.js` (with local English trained data)

---

## 4. Environment Setup

### Backend `.env` (`server/.env`):
```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
AI_API_KEY=your_gemini_api_key
AI_PROVIDER=gemini
CLIENT_URL=http://localhost:3000
```

> **Security Note:** Never commit `.env`. A sanitized template is provided in `server/.env.example`. Gemini API keys are strictly confined to the backend and never exposed to the client browser.

---

## 5. API Endpoints Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register student or admin/teacher
- `POST /api/auth/login` — Login and receive JWT token

### Notices (`/api/notices`) — Admin/Faculty
- `POST /api/notices` — Upload PDF/image, run Gemini analysis, save, and notify students
- `GET /api/notices` — Get published notices for current admin
- `GET /api/notices/:id/stats` — Get notice read receipts and student reach statistics
- `POST /api/notices/:id/retry-ai` — Retry AI processing if previous attempt failed

### Student Notice Board (`/api/student`)
- `GET /api/student/notices` — Fetch all notices (supports `category`, `priority`, `search`)
- `GET /api/student/notices/:id` — Fetch single notice detail
- `PUT /api/student/notices/:id/read` — Mark notice as read
- `GET /api/student/deadlines` — Get upcoming deadlines with countdown days
- `POST /api/student/notices/:id/translate` — Translate notice content (Marathi, Hindi, Gujarati)

### Personal AI Summarizer (`/api/personal`)
- `POST /api/personal/ask-ai` — Ask AI to answer 6 key questions from pasted text or notice
- `POST /api/personal/summarize` — Upload personal circular document/photo for private AI summary
- `GET /api/personal/history` — Get personal upload history
- `POST /api/personal/translate` — Translate personal summaries

### In-App Notifications (`/api/notifications`)
- `GET /api/notifications` — Fetch authenticated user's notifications
- `GET /api/notifications/unread-count` — Fast count of unread notifications
- `PATCH /api/notifications/:id/read` — Mark specific notification as read (strictly scoped to owner)
- `PATCH /api/notifications/read-all` — Mark all notifications as read for current user
- `DELETE /api/notifications/:id` — Delete notification (strictly scoped to owner)

### Connections (`/api/connections`)
- `GET /api/connections/admin/students` — Admin searches students
- `POST /api/connections/admin/request` — Admin sends connection request (triggers notification)
- `GET /api/connections/admin` — Admin views connection roster
- `GET /api/connections/student` — Student views connection invitations
- `PUT /api/connections/student/:id` — Student accepts/rejects request (triggers notification)

---

## 6. How to Run Locally

### Start Backend:
```bash
cd server
npm install
node server.js
```
*Backend runs on `http://localhost:5000` with Socket.IO and node-cron.*

### Start Frontend:
```bash
cd client
npm install
npm run dev
```
*Frontend runs strictly on `http://localhost:3000`.*

---

## 7. Verification & Automated Test Checklist

1. **Student Registration / Login**:
   - Register a student at `http://localhost:3000/register`.
   - Log in and verify student dashboard renders at `http://localhost:3000/student/dashboard`.
2. **Admin Login & Notice Upload**:
   - Log in as admin at `http://localhost:3000/login`.
   - Go to **Create Notice**, upload a PDF or JPG image.
   - Verify OCR/PDF parsing extracts text, Gemini produces structured summary, and notice saves to MongoDB.
3. **Real-time Notifications**:
   - Open student portal in a separate browser tab or window.
   - Admin publishes a notice: observe real-time toast and badge count update (`🔔 1`) without page reload.
   - High-priority notice triggers an additional urgent alert.
4. **Mark As Read & Dropdown**:
   - Click bell icon, view notification details, mark single or mark all as read.
   - Unread badge counter immediately clears.
5. **Original vs AI Simplified Toggle**:
   - Open notice detail. Switch between `Original` (embeds source file and extracted text) and `AI Simplified` (renders structured action card).
6. **Multi-lingual Translation**:
   - Switch language to हिन्दी (Hindi), मराठी (Marathi), or ગુજરાતી (Gujarati). Verify instant translation and MongoDB document caching.
7. **Ask AI / Summarizer**:
   - Visit `/student/ai-summarizer`, paste any notice circular text or pick an existing notice, and click "Ask AI". Verify answers to the 6 student questions.
8. **Deadline Scheduled Reminders**:
   - Verify `node-cron` evaluates upcoming deadlines and generates deduplicated alerts for students.
