# Cura+ — AI-Powered Health Tracker

A full-stack, production-ready **health tracking platform** built with a **React + TypeScript** frontend and a **Node.js + Express** backend. Cura+ delivers personalised nutrition analysis, AI-powered food scanning, real-time health scoring, and a conversational AI health assistant — all backed by **Supabase** for persistence and storage with an automatic in-memory fallback for zero-config development.

> IBM Bob was used as an AI-powered development co-pilot throughout the development of Cura+. It assisted with code generation, debugging, feature implementation, UI/UX refinement, and iterative testing — helping the team move from requirements to working implementations faster while developers reviewed and controlled the final output.

---

## ✨ Key Features

- 🤖 **Dual AI Engine** — Google Gemini (primary) + Groq/LLaMA vision (secondary) for food image analysis and chat
- 🔍 **Smart Food Scanner** — barcode lookup via OpenFoodFacts, image-based meal recognition, allergen conflict detection
- 📊 **Real-Time Health Score** — composite 0–100 score across Nutrition (35 pts), Activity (25 pts), Sleep (20 pts), and Hydration (20 pts)
- 🛡️ **Allergy & Condition Safety Engine** — personalized clinical evaluation of every scanned or logged food item
- 📈 **Health Dashboard** — daily calorie tracking, macro rings, step counter, water intake, sleep logging, and weekly trend charts
- 📋 **Health Reports** — weekly and monthly summaries with downloadable PDF generation via PDFKit
- 💬 **AI Health Assistant** — conversational Gemini-powered chatbot aware of your health profile and goals
- 🌏 **Multilingual UI** — supports 10 Indian languages (English, Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi)
- 🌓 **Dark / Light Theme** — context-driven theme switching with Tailwind CSS
- 🏥 **Onboarding Flow** — guided clinical biometrics intake (height, weight, age, allergies, medical conditions, goals)
- 🔐 **Supabase Auth + JWT** — Supabase email/OAuth session management with custom JWT fallback
- ☁️ **Supabase Storage** — avatar and meal image uploads to cloud; automatic local uploads directory fallback
- 🗄️ **Dual Database Layer** — Supabase Postgres (primary) with thread-safe in-memory store (zero-config fallback)

---

## 🏗️ Architecture Overview

```
Cura+ Monorepo
├── frontend/          # React 18 + TypeScript + Vite SPA
└── backend/           # Node.js + Express REST API (MVC)
```

### Frontend Stack
| Technology | Role |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite 5 | Build tool & dev server |
| React Router v6 | Client-side routing |
| Tailwind CSS 3 | Utility-first styling |
| Framer Motion | Animations |
| Recharts | Dashboard charts |
| Zustand | Global auth state |
| Axios | HTTP client |
| Supabase JS | Auth session & storage |
| Lucide React | Icon library |

### Backend Stack
| Technology | Role |
|---|---|
| Node.js + Express 4 | HTTP server & API framework |
| Supabase JS | Postgres DB & file storage |
| JSON Web Tokens | Stateless auth (access + refresh) |
| bcryptjs | Password hashing |
| Multer | In-memory file upload handling |
| PDFKit | Dynamic PDF report generation |
| Google Gemini API | Food vision analysis & AI chat |
| Groq / LLaMA Vision | Secondary multimodal AI fallback |
| OpenFoodFacts API | Barcode product lookup |
| dotenv | Environment configuration |

---

## 📁 Project Structure

```text
.
├── backend/
│   ├── config/
│   │   ├── env.js               # Centralised environment config (Supabase, JWT, AI keys, upload limits)
│   │   └── constants.js         # HTTP status codes, activity levels, health goals, gender enums
│   ├── controllers/
│   │   ├── authController.js    # Register, login, refresh token, logout
│   │   ├── userController.js    # Profile CRUD, avatar upload, password change
│   │   ├── healthProfileController.js  # Biometrics save/get/delete, BMI/BMR/TDEE/Macros computation
│   │   ├── dashboardController.js      # Daily summary, weekly/monthly reports
│   │   ├── healthDashboardController.js # Health score endpoint
│   │   ├── scannerController.js        # Universal food scanner (image/barcode/text)
│   │   ├── foodController.js           # Food image upload, barcode scan, allergen check, AI recommendation
│   │   ├── aiController.js             # Gemini chat, health advice, meal recommendation
│   │   ├── chatController.js           # Conversational AI chat session handler
│   │   ├── recommendationController.js # Personalised meal & lifestyle recommendations
│   │   ├── reportController.js         # Weekly/monthly reports, PDF download
│   │   ├── notificationController.js   # Medicine & health reminders CRUD
│   │   └── adminController.js          # User management, platform analytics (admin-only)
│   ├── middleware/
│   │   ├── authMiddleware.js    # JWT verification & Supabase session validation
│   │   ├── roleMiddleware.js    # RBAC guard (admin / user roles)
│   │   ├── uploadMiddleware.js  # Multer memory-storage wrapper (JPEG/PNG/WEBP/HEIC, 5 MB default)
│   │   ├── validateMiddleware.js # Request body validation helpers
│   │   └── errorMiddleware.js  # Global 404 & error response handlers
│   ├── models/
│   │   ├── User.js              # User CRUD (Supabase-first, memory fallback)
│   │   ├── HealthProfile.js     # Health profile + BMI/BMR/TDEE/Macros calculation + AES medical data encryption
│   │   ├── NutritionLog.js      # Daily meal logging
│   │   ├── HealthMetric.js      # Daily steps, water, sleep, active calories
│   │   ├── Notification.js      # Reminders model
│   │   └── Report.js            # Compiled health reports
│   ├── routes/
│   │   ├── index.js             # Central router, mounts all sub-routers under /api
│   │   ├── authRoutes.js        # /api/auth/*
│   │   ├── userRoutes.js        # /api/user|users|profile/*
│   │   ├── healthProfileRoutes.js # /api/health-profile/*
│   │   ├── dashboardRoutes.js   # /api/dashboard/*
│   │   ├── healthDashboardRoutes.js # /api/health/*
│   │   ├── scannerRoutes.js     # /api/scanner/*
│   │   ├── foodRoutes.js        # /api/food/*
│   │   ├── aiRoutes.js          # /api/ai/*
│   │   ├── chatRoutes.js        # /api/chat/*
│   │   ├── recommendationRoutes.js # /api/recommendations/*
│   │   ├── reportRoutes.js      # /api/reports/*
│   │   ├── notificationRoutes.js # /api/notifications/*
│   │   └── adminRoutes.js       # /api/admin/*
│   ├── services/
│   │   ├── supabaseService.js   # Supabase anon + service-role client factory
│   │   ├── supabaseStorageService.js # Avatar & meal image upload/delete to Supabase Storage
│   │   ├── geminiService.js     # Google Gemini text & vision API wrapper
│   │   ├── openFoodFactsService.js # OpenFoodFacts barcode product lookup
│   │   ├── foodAnalysisGateway.js # Orchestrates Gemini + Groq vision + OpenFoodFacts
│   │   ├── allergySafetyEngine.js # Allergen & medical condition conflict detection engine
│   │   └── healthScoreService.js  # 4-pillar health score algorithm (Nutrition/Activity/Sleep/Hydration)
│   ├── utils/
│   │   ├── healthCalculators.js # BMI, BMR (Mifflin-St Jeor), TDEE, macro targets
│   │   ├── responseHandler.js   # Standardised success/error JSON responses
│   │   ├── logger.js            # Console logger utility
│   │   ├── cryptoHelper.js      # AES encryption/decryption for sensitive medical fields
│   │   └── jwtHelper.js         # JWT sign/verify helpers
│   ├── database/
│   │   ├── memoryStore.js       # Thread-safe in-memory datastore (zero-config fallback)
│   │   ├── seeds.js             # Pre-seeded admin and standard user accounts
│   │   ├── supabase_schema.sql  # Complete Supabase Postgres DDL (paste into SQL editor)
│   │   └── setup_storage.sql    # Supabase Storage bucket & RLS policy setup SQL
│   ├── tests/
│   │   ├── api-sanity.test.js           # Full API integration test suite (20+ endpoints)
│   │   ├── health-score-diet-impact.test.js # Health score algorithm unit tests
│   │   └── supabase-storage.test.js     # Supabase Storage upload/delete tests
│   ├── scripts/                         # One-off setup & migration scripts
│   ├── app.js                           # Express app setup (CORS, parsers, static, routes)
│   ├── server.js                        # HTTP server bootstrap
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── apiClient.ts     # Axios instance with base URL & auth token interceptor
│   │   │   ├── authApi.ts       # Auth API calls (login, register, logout)
│   │   │   ├── healthApi.ts     # Dashboard, metrics, notifications API calls
│   │   │   ├── scannerApi.ts    # Food scanner API calls
│   │   │   ├── chatApi.ts       # AI chat API calls
│   │   │   ├── userApi.ts       # User profile API calls
│   │   │   └── supabase.ts      # Supabase client (auth session)
│   │   ├── components/
│   │   │   ├── AvatarUploadModal.tsx  # Avatar crop & upload modal
│   │   │   ├── GoalEditModal.tsx      # Health goal editing modal
│   │   │   ├── Logo.tsx               # Cura+ brand logo
│   │   │   ├── MarkdownRenderer.tsx   # Safe markdown-to-HTML renderer for AI responses
│   │   │   └── ui/                    # Reusable UI primitives (Button, Card, Input, Badge)
│   │   ├── contexts/
│   │   │   ├── AuthProvider.tsx   # Global auth state (user, session, login, logout, onboarding)
│   │   │   ├── ThemeContext.tsx   # Dark/light theme state
│   │   │   └── LanguageContext.tsx # i18n context (10 Indian languages)
│   │   ├── hooks/
│   │   │   ├── useAuth.ts         # Auth context consumer hook
│   │   │   └── useProfile.ts      # User profile data hook
│   │   ├── layouts/
│   │   │   ├── DashboardLayout.tsx # Sidebar nav + outlet for authenticated pages
│   │   │   ├── AuthLayout.tsx      # Centered card layout for auth pages
│   │   │   └── LandingLayout.tsx   # Public marketing page layout
│   │   ├── pages/
│   │   │   ├── Landing.tsx         # Public marketing/landing page
│   │   │   ├── Auth.tsx            # Combined login/register page
│   │   │   ├── Onboarding.tsx      # Multi-step health profile setup wizard
│   │   │   ├── Dashboard.tsx       # Main health dashboard (score, macros, steps, water, sleep)
│   │   │   ├── Scanner.tsx         # AI food scanner (image upload, barcode, allergen results)
│   │   │   ├── ProductAnalysis.tsx # Detailed product nutritional analysis page
│   │   │   ├── AIAssistant.tsx     # Conversational AI health chatbot
│   │   │   ├── Reports.tsx         # Weekly/monthly health reports
│   │   │   ├── Profile.tsx         # User profile view & edit
│   │   │   └── Settings.tsx        # App settings (theme, language, notifications, account)
│   │   ├── routes/
│   │   │   ├── ProtectedRoute.tsx   # Redirects unauthenticated users to /auth
│   │   │   ├── GuestRoute.tsx       # Redirects logged-in users away from auth pages
│   │   │   └── OnboardingRoute.tsx  # Enforces onboarding completion before dashboard access
│   │   ├── services/
│   │   │   ├── auth.ts     # Supabase auth service (signIn, signUp, OAuth, password reset)
│   │   │   ├── profile.ts  # User & health profile CRUD service
│   │   │   └── health.ts   # Health metrics service
│   │   ├── store/
│   │   │   └── authStore.ts # Zustand auth store (token persistence)
│   │   └── App.tsx          # Root app with route definitions and context providers
│   ├── index.html
│   ├── vite.config.ts       # Vite config (@ alias, /uploads proxy to backend :5001)
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── docs/
│   ├── api-documentation.md   # Complete REST API reference
│   ├── architecture.md        # MVC architecture, RBAC, health score algorithm
│   └── postman_collection.json # Ready-to-import Postman collection
│
└── README.md
```

---

## 🚀 Quickstart

### Prerequisites
| Requirement | Version |
|---|---|
| Node.js | v18+ (tested on v24.x) |
| npm | v9+ |
| Supabase project | Optional (auto-falls-back to in-memory store) |
| Google Gemini API key | Optional (uses simulated responses if omitted) |

---

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

---

### 2. Environment Configuration

**Backend** — create `backend/.env` (copy from `.env.example` if present):
```env
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# JWT
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# AI (Primary: Google Gemini)
PRIMARY_AI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.1-flash-lite

# AI (Secondary: Groq vision fallback)
SECONDARY_AI_API_KEY=your_groq_api_key
SECONDARY_AI_PROVIDER=groq
SECONDARY_AI_MODEL=llama-3.2-11b-vision-preview

# Supabase (optional — omit to use in-memory store)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_STORAGE_BUCKET=cura-uploads
```

**Frontend** — create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5001
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

### 3. Database Setup (Supabase — optional)

If you have a Supabase project, run the schema scripts in order in the **Supabase SQL Editor**:
1. `backend/database/supabase_schema.sql` — creates all tables (users, health\_profiles, nutrition\_logs, health\_metrics, notifications, reports)
2. `backend/database/setup_storage.sql` — creates the storage bucket and RLS policies for avatar/meal image uploads

If Supabase is not configured, the backend automatically falls back to the thread-safe in-memory store with pre-seeded accounts.

---

### 4. Start the Application

**Backend:**
```bash
cd backend
npm start          # production mode
npm run dev        # watch mode (auto-restart on changes)
```
- API base: `http://localhost:5001/api`
- Health check: `http://localhost:5001/api/health`

**Frontend:**
```bash
cd frontend
npm run dev        # Vite dev server
npm run build      # TypeScript compile + production build
npm run preview    # Preview production build locally
```
- App URL: `http://localhost:5173`

---

## 🗄️ Database Layer

Cura+ uses a **dual-layer persistence strategy**:

| Layer | When Used | Details |
|---|---|---|
| **Supabase Postgres** | `SUPABASE_URL` + key provided | Persistent, production-grade relational store with RLS |
| **In-Memory Store** | No Supabase config | Thread-safe JS object store — data resets on server restart |

All models (`User`, `HealthProfile`, `NutritionLog`, etc.) transparently switch between layers — no code changes needed.

---

## 🧠 Health Score Algorithm

The health score engine (`backend/services/healthScoreService.js`) produces a **0–100 composite daily score** across four pillars:

| Pillar | Max Points | Key Inputs |
|---|---|---|
| **Nutrition & Food Quality** | 35 | Calorie adherence, macro targets, avg food health rating, allergen conflicts |
| **Physical Activity** | 25 | Step count vs target, active calories burnt |
| **Sleep Recovery** | 20 | Sleep hours (optimal: 7–9 hrs) |
| **Hydration Balance** | 20 | Water intake vs daily target |

Clinical modifiers:
- **Allergen conflict** → −15 pts from nutrition + additional per-conflict penalty
- **Medical condition conflict** → −6 pts per conflict
- **Harmful meal logged** → −8 pts per meal
- **Clean eating bonus** → up to +8 pts for allergen-safe, high-rated, condition-compatible meals

---

## 📡 API Endpoints

| Module | Method | Endpoint | Description |
|---|---|---|---|
| **Auth** | `POST` | `/api/auth/register` | Register new user |
| | `POST` | `/api/auth/login` | Login — returns JWT access & refresh tokens |
| | `POST` | `/api/auth/refresh-token` | Refresh access token |
| | `POST` | `/api/auth/logout` | Revoke session |
| **Profile** | `GET` | `/api/profile` | Get user profile |
| | `PUT` | `/api/profile` | Update profile |
| | `POST` | `/api/profile/avatar` | Upload avatar image |
| | `PUT` | `/api/profile/change-password` | Change password |
| **Health Profile** | `POST`/`PUT` | `/api/health-profile` | Save biometrics (auto-calculates BMI, BMR, TDEE, Macros) |
| | `GET` | `/api/health-profile` | Get health profile & targets |
| | `DELETE` | `/api/health-profile` | Delete health profile |
| **Dashboard** | `GET` | `/api/dashboard/summary` | Daily calorie, macro, steps, sleep summary |
| | `GET` | `/api/health` | Real-time 0–100 health score & breakdown |
| | `GET` | `/api/dashboard/weekly-report` | 7-day trend analysis |
| | `GET` | `/api/dashboard/monthly-report` | 30-day consistency report |
| **Scanner** | `POST` | `/api/scanner/analyze` | Universal scanner — image / barcode / text input |
| **Food** | `POST` | `/api/food/upload-image` | Upload meal image for AI recognition |
| | `POST` | `/api/food/scan-barcode` | OpenFoodFacts barcode lookup + allergen check |
| | `GET` | `/api/food/product/:barcode` | Get product details & Nutri-Score |
| | `POST` | `/api/food/check-allergens` | Cross-check ingredients against profile allergies |
| | `POST` | `/api/food/nutrition-analysis` | Text-based recipe nutrition analysis |
| | `POST` | `/api/food/ai-recommendation` | AI meal recommendation for remaining calories |
| **AI Assistant** | `POST` | `/api/ai/chat` | Gemini conversational health assistant |
| | `GET` | `/api/ai/health-advice` | Contextual health tips based on live metrics |
| | `POST` | `/api/ai/meal-recommendation` | Tailored AI meal plans |
| **Chat** | `POST` | `/api/chat` | Streaming-style chat session handler |
| **Reports** | `POST` | `/api/reports/weekly` | Compile weekly health review |
| | `POST` | `/api/reports/monthly` | Compile monthly health review |
| | `GET` | `/api/reports/download-pdf` | Download PDF health report |
| **Notifications** | `GET` | `/api/notifications` | List scheduled reminders |
| | `POST` | `/api/notifications/medicine-reminder` | Create medicine reminder |
| | `POST` | `/api/notifications/health-reminder` | Create water / workout reminder |
| | `PATCH` | `/api/notifications/:id/toggle` | Activate / deactivate reminder |
| | `DELETE` | `/api/notifications/:id` | Delete reminder |
| **Admin** | `GET` | `/api/admin/users` | List users (paginated) |
| | `GET` | `/api/admin/analytics` | Platform statistics & health metrics |
| | `PATCH` | `/api/admin/users/:id/role` | Promote / demote user role |
| | `DELETE` | `/api/admin/users/:id` | Delete user account |

For complete request/response schemas see [`docs/api-documentation.md`](docs/api-documentation.md) or import [`docs/postman_collection.json`](docs/postman_collection.json).

---

## 🔑 Pre-Seeded Test Accounts

> Only available when running with the **in-memory store** (no Supabase configured).

| Account Type | Email | Password | Role |
|---|---|---|---|
| **Admin** | `admin@healthsync.ai` | `Admin@123456` | `admin` |
| **Standard User** | `john@healthsync.ai` | `User@123456` | `user` |

---

## 🧪 Testing

```bash
# Full API integration test suite (20+ endpoints)
cd backend && npm test

# Health score algorithm unit tests
node backend/tests/health-score-diet-impact.test.js

# Supabase Storage upload/delete tests
node backend/tests/supabase-storage.test.js
```

---

## 🌐 Frontend Routes

| Path | Component | Access |
|---|---|---|
| `/` | Landing page | Public |
| `/auth` / `/auth/login` / `/auth/register` | Auth (login + register) | Guest only |
| `/onboarding` | Health profile setup wizard | Authenticated, pre-onboarding |
| `/dashboard` | Health dashboard | Protected |
| `/scanner` | AI food scanner | Protected |
| `/product-analysis` | Product nutritional detail | Protected |
| `/ai-assistant` | AI health chatbot | Protected |
| `/reports` | Weekly/monthly health reports | Protected |
| `/profile` | User profile | Protected |
| `/settings` | App settings | Protected |

---

## 🚢 Deployment

### Backend (e.g. Render / Railway)
1. Set all required environment variables in your hosting dashboard
2. Set **Start Command**: `node server.js` (from `backend/` directory)
3. The backend automatically serves routes at both `/api/*` and `/*` for deployment flexibility

### Frontend (e.g. Vercel / Netlify)
1. Set `VITE_API_URL` to your deployed backend URL
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Build command: `npm run build` (from `frontend/` directory)
4. Publish directory: `frontend/dist`
5. The included `frontend/vercel.json` handles SPA routing rewrites

---

## 📄 Documentation

| Document | Description |
|---|---|
| [`docs/api-documentation.md`](docs/api-documentation.md) | Complete REST API reference with payloads & responses |
| [`docs/architecture.md`](docs/architecture.md) | MVC architecture, RBAC design, health score algorithm deep-dive |
| [`docs/postman_collection.json`](docs/postman_collection.json) | Import into Postman for one-click API testing |
| [`backend/database/supabase_schema.sql`](backend/database/supabase_schema.sql) | Postgres DDL for all tables |
| [`backend/database/setup_storage.sql`](backend/database/setup_storage.sql) | Supabase Storage bucket & RLS policy setup |
