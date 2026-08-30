# CURA AI — Health Tracker 

A scalable, clean **Node.js & Express** backend for **CURA AI**, an AI-powered Health Tracker platform. Designed following **MVC architecture**, with JWT Authentication, Role-Based Access Control (RBAC), Google Gemini AI integration, OpenFoodFacts Barcode Scanner, and dynamic PDF Report generation.

IBM Bob was used as an AI-powered development assistant during the development of Cura+, helping the team accelerate the implementation, debugging, and refinement of different parts of the application.

The main workflow involved providing IBM Bob with project requirements, existing code, and desired functionality. Based on these inputs, it assisted in generating and modifying code, identifying potential errors, improving implementation, and suggesting solutions during development.

Key development activities included:

Code Generation: Assisted in creating components and implementing functionality based on project requirements.
Code Debugging: Helped identify errors and suggest fixes when features were not working as expected.
Feature Development: Supported the implementation and refinement of different Cura+ features and user workflows.
Code Improvement: Suggested cleaner and more efficient approaches to existing implementations.
Development Assistance: Helped the team understand unfamiliar code, APIs, libraries, and implementation approaches.
UI/UX Refinement: Assisted with improving the structure and user experience of the web interface.
Testing & Iteration: Supported an iterative workflow where generated code was tested, reviewed, corrected, and integrated into the project.

Overall, IBM Bob functioned as a development co-pilot, helping the team move from requirements and ideas to working implementations more quickly while allowing the developers to review and control the final code. It was particularly useful for reducing development time, troubleshooting issues, and experimenting with new features for Cura+.

> **Zero Database Setup Needed**: Runs immediately with a thread-safe in-memory store and pre-configured seed accounts.

---

## 📁 Project File Structure

```text
.
├── server/                     # Backend (Node.js + Express)
│   ├── config/                 # Environment variables & system constants
│   ├── controllers/            # Request handlers (Auth, Dashboard, AI, Food, Admin...)
│   ├── middleware/             # JWT auth, RBAC, Multer uploads, Validation, Error handlers
│   ├── models/                 # User, HealthProfile, NutritionLog, Metrics, Reminders
│   ├── routes/                 # Express API route definitions mounted under /api
│   ├── services/               # Gemini AI, OpenFoodFacts, HealthScore, PDFKit Generator
│   ├── utils/                  # Response formatters, logger, JWT helper, BMI/BMR formulas
│   ├── tests/                  # Automated API sanity & integration test suite
│   ├── app.js                  # Express app setup and middleware configuration
│   ├── server.js               # Server bootstrap & HTTP listener
│   ├── package.json            # Node dependencies and scripts
│   └── .env.example            # Environment variables template
│
├── database/                   # In-memory database store & seed data
│   ├── memoryStore.js          # In-memory database engine
│   ├── seeds.js                # Default seed accounts (Admin & User)
│   └── README.md               # Database persistence & future MongoDB guide
│
├── docs/                       # Comprehensive documentation & API specs
│   ├── api-documentation.md    # Complete REST API reference
│   ├── postman_collection.json # 1-Click ready Postman test collection
│   └── architecture.md         # MVC architecture, RBAC, & Health Score algorithm
│
└── README.md                   # Project overview & quickstart guide
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v24.x)
- **npm**: v9+

### 2. Installation
Navigate into the `server` directory and install dependencies:
```bash
cd server
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env` (pre-configured defaults work out-of-the-box):
```bash
cp .env.example .env
```
*(Optional: Add your `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/) for live Gemini AI responses. If omitted, built-in intelligent simulated responses are used).*

### 4. Start the Server
```bash
# Start server in standard mode
npm start

# Or start in watch mode for development
npm run dev
```

Server will start at:
- **Base URL**: `http://localhost:5000/api`
- **Health Check**: `http://localhost:5000/api/health`

---

## 🧪 Automated Testing

Run the automated integration test suite covering all 20+ endpoints:
```bash
npm test
```

---

## 🔑 Pre-Seeded Test Accounts

| Account Type | Email | Password | Role |
|---|---|---|---|
| **Admin User** | `admin@healthsync.ai` | `Admin@123456` | `admin` |
| **Standard User** | `john@healthsync.ai` | `User@123456` | `user` |

---

## 📡 REST API Endpoints Overview

| Module | Method | Endpoint | Description |
|---|---|---|---|
| **Auth** | `POST` | `/api/auth/register` | Register new user |
| | `POST` | `/api/auth/login` | Login and receive JWT access & refresh tokens |
| | `POST` | `/api/auth/refresh-token` | Generate new access token |
| | `POST` | `/api/auth/logout` | Revoke session |
| **Profile** | `GET` | `/api/profile` | Get user profile info |
| | `PUT` | `/api/profile` | Update profile |
| | `POST` | `/api/profile/avatar` | Upload avatar image (Multer) |
| | `PUT` | `/api/profile/change-password` | Change user password |
| **Health Profile** | `POST` / `PUT` | `/api/health-profile` | Save biometrics (calculates BMI, BMR, TDEE, Macros) |
| | `GET` | `/api/health-profile` | Get current health profile & target metrics |
| | `DELETE` | `/api/health-profile` | Delete health profile |
| **Dashboard** | `GET` | `/api/dashboard/summary` | Daily calorie deficit/surplus, macros, steps, sleep |
| | `GET` | `/api/dashboard/health-score` | Real-time 0–100 health score & breakdown |
| | `GET` | `/api/dashboard/weekly-report` | 7-day trend analysis |
| | `GET` | `/api/dashboard/monthly-report` | 30-day consistency report |
| **Food Scanner** | `POST` | `/api/food/upload-image` | Upload meal image for AI recognition & logging |
| | `POST` | `/api/food/scan-barcode` | OpenFoodFacts barcode lookup & allergen check |
| | `GET` | `/api/food/product/:barcode` | Get product details & Nutri-Score |
| | `POST` | `/api/food/check-allergens` | Cross-check ingredients against profile allergies |
| | `POST` | `/api/food/nutrition-analysis` | Text-based recipe nutrition analysis |
| | `POST` | `/api/food/ai-recommendation` | AI meal recommendation matching remaining calories |
| **AI Assistant** | `POST` | `/api/ai/chat` | Conversational Gemini AI health assistant |
| | `GET` | `/api/ai/health-advice` | Contextual health tips based on live metrics |
| | `POST` | `/api/ai/meal-recommendation` | Tailored AI meal plans |
| **Reports** | `POST` | `/api/reports/weekly` | Compile weekly health review |
| | `POST` | `/api/reports/monthly` | Compile monthly health review |
| | `GET` | `/api/reports/download-pdf` | Download dynamic PDF Health Report |
| **Notifications** | `GET` | `/api/notifications` | List scheduled reminders |
| | `POST` | `/api/notifications/medicine-reminder` | Create medicine schedule |
| | `POST` | `/api/notifications/health-reminder` | Create water/workout reminder |
| | `PATCH` | `/api/notifications/:id/toggle` | Activate / Deactivate reminder |
| | `DELETE` | `/api/notifications/:id` | Delete reminder |
| **Admin** | `GET` | `/api/admin/users` | List registered users (Paginated) |
| | `GET` | `/api/admin/analytics` | Platform statistics & health metrics |
| | `PATCH` | `/api/admin/users/:id/role` | Promote/demote user roles |
| | `DELETE` | `/api/admin/users/:id` | Delete user account |

For complete payload and response schemas, see [docs/api-documentation.md](file:///c:/Users/LENOVO/OneDrive/Desktop/Backend/docs/api-documentation.md) or import [docs/postman_collection.json](file:///c:/Users/LENOVO/OneDrive/Desktop/Backend/docs/postman_collection.json).
