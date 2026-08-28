# HealthSync AI — REST API Documentation

Base URL: `http://localhost:5000/api`

All protected endpoints require the HTTP Authorization header:
```http
Authorization: Bearer <YOUR_ACCESS_TOKEN>
```

---

## 1. Authentication (`/api/auth`)

### 1.1 Register User
- **Endpoint**: `POST /api/auth/register`
- **Access**: Public
- **Request Body**:
```json
{
  "name": "Sarah Connor",
  "email": "sarah@example.com",
  "password": "Password@123",
  "role": "user"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "statusCode": 201,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "c71a39bf-...",
      "name": "Sarah Connor",
      "email": "sarah@example.com",
      "role": "user",
      "avatarUrl": null,
      "isVerified": true
    },
    "tokens": {
      "accessToken": "eyJhbGci...",
      "refreshToken": "eyJhbGci...",
      "tokenType": "Bearer"
    }
  }
}
```

### 1.2 Login
- **Endpoint**: `POST /api/auth/login`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "john@healthsync.ai",
  "password": "User@123456"
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "tokens": {
      "accessToken": "eyJhbG...",
      "refreshToken": "eyJhbG...",
      "tokenType": "Bearer"
    }
  }
}
```

### 1.3 Refresh Token
- **Endpoint**: `POST /api/auth/refresh-token`
- **Access**: Public
- **Request Body**:
```json
{
  "refreshToken": "eyJhbGciOi..."
}
```

### 1.4 Logout
- **Endpoint**: `POST /api/auth/logout`
- **Access**: Public

---

## 2. User Profile (`/api/profile`)

### 2.1 Get Current Profile
- **Endpoint**: `GET /api/profile`
- **Access**: Authenticated (`Bearer <token>`)

### 2.2 Update Profile
- **Endpoint**: `PUT /api/profile`
- **Request Body**:
```json
{
  "name": "Johnathan Doe"
}
```

### 2.3 Upload Avatar
- **Endpoint**: `POST /api/profile/avatar`
- **Content-Type**: `multipart/form-data`
- **Form Field**: `avatar` (Image file: JPEG, PNG, WEBP)

### 2.4 Change Password
- **Endpoint**: `PUT /api/profile/change-password`
- **Request Body**:
```json
{
  "currentPassword": "User@123456",
  "newPassword": "NewSecurePassword@123"
}
```

---

## 3. Health Profile & Biometrics (`/api/health-profile`)

### 3.1 Create or Update Health Profile
- **Endpoint**: `POST /api/health-profile` or `PUT /api/health-profile`
- **Request Body**:
```json
{
  "heightCm": 178,
  "weightKg": 74,
  "age": 28,
  "gender": "male",
  "activityLevel": "moderately_active",
  "healthGoal": "lose_weight",
  "allergies": ["Peanuts", "Shellfish"],
  "dietaryRestrictions": ["Low Lactose"],
  "medicalConditions": ["Mild Asthma"]
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Health profile saved successfully",
  "data": {
    "heightCm": 178,
    "weightKg": 74,
    "bmi": 23.4,
    "bmiCategory": "Normal weight",
    "bmr": 1718,
    "tdee": 2663,
    "targets": {
      "dailyCalories": 2163,
      "macros": {
        "protein": { "grams": 133, "calories": 532, "percentage": 25 },
        "carbs": { "grams": 272, "calories": 1090, "percentage": 50 },
        "fat": { "grams": 60, "calories": 541, "percentage": 25 }
      },
      "waterMl": 2590,
      "steps": 8000,
      "sleepHours": 8
    }
  }
}
```

---

## 4. Dashboard & Health Scoring (`/api/dashboard`)

### 4.1 Daily Summary
- **Endpoint**: `GET /api/dashboard/summary?date=YYYY-MM-DD`
- Returns calorie deficit/surplus, remaining macros, steps, water, sleep, and logged meals.

### 4.2 Health Score
- **Endpoint**: `GET /api/dashboard/health-score`
- Returns 0–100 score, grade (A, B, C, D), and breakdown for Nutrition (30%), Activity (30%), Sleep (20%), and Hydration (20%).

### 4.3 Weekly Report
- **Endpoint**: `GET /api/dashboard/weekly-report`
- Aggregated 7-day averages and daily trend breakdowns.

### 4.4 Monthly Report
- **Endpoint**: `GET /api/dashboard/monthly-report`
- 30-day logging consistency rate and goal milestone forecast.

---

## 5. Food Scanner & Nutrition (`/api/food`)

### 5.1 Upload Food Image
- **Endpoint**: `POST /api/food/upload-image`
- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `foodImage` (File)
  - `mealType` ("breakfast" | "lunch" | "dinner" | "snack")
  - `autoLog` ("true" | "false")
  - `textHint` (Optional meal description)

### 5.2 Scan Barcode
- **Endpoint**: `POST /api/food/scan-barcode`
- **Request Body**:
```json
{
  "barcode": "3017620422003"
}
```

### 5.3 Check Allergens
- **Endpoint**: `POST /api/food/check-allergens`
- **Request Body**:
```json
{
  "ingredients": ["Peanuts", "Sugar", "Cocoa"]
}
```

### 5.4 Nutrition Analysis
- **Endpoint**: `POST /api/food/nutrition-analysis`
- **Request Body**:
```json
{
  "mealDescription": "2 eggs sunny side up with whole wheat toast and half an avocado"
}
```

### 5.5 AI Food Recommendation
- **Endpoint**: `POST /api/food/ai-recommendation`
- **Request Body**:
```json
{
  "mealType": "dinner"
}
```

---

## 6. AI Health Assistant (`/api/ai`)

### 6.1 Chat with Gemini
- **Endpoint**: `POST /api/ai/chat`
- **Request Body**:
```json
{
  "message": "What should I eat before my 5km morning run?"
}
```

### 6.2 Get Health Advice
- **Endpoint**: `GET /api/ai/health-advice`
- Analyzes live user metrics, hydration levels, and health score to provide 3 prioritized daily recommendations.

### 6.3 Meal Recommendation
- **Endpoint**: `POST /api/ai/meal-recommendation`
- **Request Body**:
```json
{
  "mealType": "dinner",
  "targetCalories": 550
}
```

---

## 7. Reports & PDF Export (`/api/reports`)

### 7.1 Generate Weekly Report
- **Endpoint**: `POST /api/reports/weekly`

### 7.2 Generate Monthly Report
- **Endpoint**: `POST /api/reports/monthly`

### 7.3 Download Formatted PDF Report
- **Endpoint**: `GET /api/reports/download-pdf`
- **Response**: Binary PDF file (`Content-Type: application/pdf`).

---

## 8. Notifications & Reminders (`/api/notifications`)

### 8.1 List Reminders
- **Endpoint**: `GET /api/notifications`

### 8.2 Create Medicine Reminder
- **Endpoint**: `POST /api/notifications/medicine-reminder`
- **Request Body**:
```json
{
  "title": "Omega-3 Fish Oil",
  "dosage": "1 Capsule (1000mg)",
  "time": "08:30",
  "days": ["Mon", "Wed", "Fri"],
  "notes": "Take with breakfast"
}
```

### 8.3 Create Health Reminder
- **Endpoint**: `POST /api/notifications/health-reminder`
- **Request Body**:
```json
{
  "title": "Evening Stretch & Hydrate",
  "type": "water",
  "time": "20:00",
  "days": ["Daily"],
  "notes": "Drink 300ml water and 10 min mobility stretch"
}
```

### 8.4 Toggle Reminder
- **Endpoint**: `PATCH /api/notifications/:id/toggle`

### 8.5 Delete Reminder
- **Endpoint**: `DELETE /api/notifications/:id`

---

## 9. Admin Operations (`/api/admin`)
*Requires `role: "admin"`*

### 9.1 List Users
- **Endpoint**: `GET /api/admin/users?page=1&limit=10&search=john`

### 9.2 Platform Analytics
- **Endpoint**: `GET /api/admin/analytics`

### 9.3 Update User Role
- **Endpoint**: `PATCH /api/admin/users/:id/role`
- **Request Body**:
```json
{
  "role": "admin"
}
```

### 9.4 Delete User
- **Endpoint**: `DELETE /api/admin/users/:id`
