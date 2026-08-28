# HealthSync AI — Architecture & Engineering Specification

## 1. Architectural Overview

HealthSync AI backend is built on a clean **Model-View-Controller (MVC)** layered pattern, separating HTTP request parsing, business logic, algorithmic computation, and data persistence.

```
Client (HTTP/REST) 
      │
      ▼
Express Router (`server/routes/`)
      │
      ├─► Middleware: RateLimiter / Cors / BodyParsers
      ├─► Middleware: JWT Authentication (`authMiddleware.js`)
      ├─► Middleware: Role-Based Access Control (`roleMiddleware.js`)
      ├─► Middleware: Request Validation (`validateMiddleware.js`)
      │
      ▼
Controllers (`server/controllers/`)
      │
      ├─► Services (`server/services/`)
      │     ├─► GeminiService (AI NLP & Vision)
      │     ├─► OpenFoodFactsService (Barcode & Nutrition API)
      │     ├─► HealthScoreService (Algorithm 0-100)
      │     ├─► PdfService (PDFKit Document Builder)
      │     └─► ReminderService (Notifications)
      │
      ├─► Mathematical Utilities (`server/utils/healthCalculators.js`)
      │     └─► Mifflin-St Jeor BMR, TDEE, BMI, Macros
      │
      ▼
Models (`server/models/`)
      │
      ▼
Data Persistence (`database/memoryStore.js` / Future Mongoose Schemas)
```

---

## 2. Role-Based Access Control (RBAC)

HealthSync AI implements secure Role-Based Authorization using signed JSON Web Tokens (JWT).

| Role | Permissions |
|---|---|
| `user` | Manage own health profile, log meals, track metrics, chat with Gemini AI, download health reports, manage medicine reminders. |
| `admin` | Full user access + platform management (`/api/admin/users`), analytics & system metrics (`/api/admin/analytics`), role assignment, user deactivation. |

### Auth Security Flow:
1. **Access Token** (`15 minutes` lifespan): Transmitted in `Authorization: Bearer <token>` for fast stateless API authentication.
2. **Refresh Token** (`7 days` lifespan): Stored in database whitelist to securely issue new access tokens without requiring re-login.

---

## 3. Health Score Algorithm Specification

The **HealthScoreService** produces a real-time score between `0` and `100` categorized into 4 core pillars:

$$ \text{Total Health Score} = \text{Nutrition (30\%)} + \text{Activity (30\%)} + \text{Sleep (20\%)} + \text{Hydration (20\%)} $$

1. **Nutrition (30 pts)**:
   - Calorie Target Compliance: Logged calories within 15% of daily target = +18 pts.
   - Protein Target Fulfillment: Actual protein vs target protein ratio = +12 pts.
2. **Physical Activity (30 pts)**:
   - Step Count Ratio: Logged steps vs goal (e.g. 8,000 steps) = +20 pts.
   - Active Energy Burn: $\ge 400\text{ kcal}$ burned = +10 pts.
3. **Sleep Quality (20 pts)**:
   - Optimal sleep (7–9 hours) = 20 pts.
   - Suboptimal (6–7 or 9–10 hours) = 14 pts.
4. **Hydration (20 pts)**:
   - Daily water intake vs recommended $35\text{ml} / \text{kg}$ target = 20 pts.

---

## 4. AI Integration (Google Gemini)

- **Gemini Assistant (`geminiService.js`)**: Evaluates user biometrics, BMI, dietary restrictions, and logged meals to provide context-aware fitness and nutrition advice.
- **Resilient Fallback Engine**: If no `GEMINI_API_KEY` is configured in `.env`, the engine falls back to deterministic rule-based advice generation, guaranteeing zero API downtime.
