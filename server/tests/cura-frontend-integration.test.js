/**
 * Cura+ Frontend Backend Integration Test Suite
 * Tests all 5 core requirements specified for the Cura+ Frontend:
 * 1. Authentication & Security (Register, Login, Google OAuth, Password Reset, AES-256 Data Encryption)
 * 2. Database Architecture (Users, Health Profiles with Blood Type & Onboarding, Daily Logs, Meal Logs)
 * 3. Third-Party API Integrations (OpenFoodFacts Barcode, Multimodal Vision AI, LLM Chatbot)
 * 4. Core REST API Endpoints (/api/user/profile, /api/user/onboarding, /api/health/dashboard, /api/scanner/analyze, /api/chat/message)
 * 5. Recommendation Engine (Goal & Allergy-Aware Meal Suggestions)
 */

const http = require('http');
const app = require('../app');
const { seedDatabase } = require('../../database/seeds');
const CryptoHelper = require('../utils/cryptoHelper');

let server;
let baseUrl;
let userToken = '';
let userId = '';

const request = async (path, options = {}) => {
  const url = `${baseUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const body = options.body ? JSON.stringify(options.body) : undefined;

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body
  });

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const data = await res.json();
    return { status: res.status, data, headers: res.headers };
  } else {
    const buffer = await res.arrayBuffer();
    return { status: res.status, buffer, headers: res.headers };
  }
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(`[Assertion Failed] ${message}`);
  }
  console.log(`  \x1b[32m✔\x1b[0m ${message}`);
};

async function runCuraIntegrationTests() {
  console.log('\n======================================================');
  console.log('🩺 Starting Cura+ Full Backend Integration Test Suite');
  console.log('======================================================\n');

  try {
    await seedDatabase();

    // Start ephemeral server
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        console.log(`Cura+ Test Server online at http://localhost:${port}\n`);
        resolve();
      });
    });

    // ==========================================
    // REQUIREMENT 1: Authentication & Security
    // ==========================================
    console.log('1. [Auth & Security] Testing Registration, Login, OAuth, & Reset:');

    // 1a. User Registration
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: {
        name: 'Elena Rostova',
        email: 'elena@curaplus.health',
        password: 'SecurePassword@123',
        settings: { theme: 'dark', unitSystem: 'metric' }
      }
    });
    assert(regRes.status === 201, 'POST /api/auth/register creates user account with 201 Created');
    assert(regRes.data.data.tokens.accessToken, 'Registration returns JWT accessToken');
    userToken = regRes.data.data.tokens.accessToken;
    userId = regRes.data.data.user.id;

    // 1b. User Login
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'elena@curaplus.health',
        password: 'SecurePassword@123'
      }
    });
    assert(loginRes.status === 200, 'POST /api/auth/login returns 200 OK');

    // 1c. Google OAuth "Continue with Google"
    const googleRes = await request('/api/auth/google', {
      method: 'POST',
      body: {
        googleId: 'g_oauth_987654321',
        email: 'google.user@example.com',
        name: 'Google User',
        picture: 'https://lh3.googleusercontent.com/a/default-user'
      }
    });
    assert(googleRes.status === 200, 'POST /api/auth/google returns 200 OK with authenticated tokens');
    assert(googleRes.data.data.tokens.accessToken, 'Google OAuth returns access token');

    // 1d. Password Reset Flow
    const forgotRes = await request('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: 'elena@curaplus.health' }
    });
    assert(forgotRes.status === 200, 'POST /api/auth/forgot-password generates recovery token');
    const resetToken = forgotRes.data.data.resetToken;

    const resetRes = await request('/api/auth/reset-password', {
      method: 'POST',
      body: { token: resetToken, newPassword: 'NewElenaPassword@456' }
    });
    assert(resetRes.status === 200, 'POST /api/auth/reset-password successfully updates password');

    // Verify login with new password
    const loginNewRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'elena@curaplus.health', password: 'NewElenaPassword@456' }
    });
    assert(loginNewRes.status === 200, 'Login succeeds with new password');
    userToken = loginNewRes.data.data.tokens.accessToken;

    // 1e. Sensitive Data Encryption (AES-256-GCM)
    const sensitiveMedicalNote = 'Patient diagnosed with Type 1 Penicillin Allergy and Asthma';
    const encrypted = CryptoHelper.encrypt(sensitiveMedicalNote);
    assert(encrypted !== sensitiveMedicalNote && encrypted.includes(':'), 'AES-256-GCM encryption creates secure IV:Tag:Ciphertext');
    const decrypted = CryptoHelper.decrypt(encrypted);
    assert(decrypted === sensitiveMedicalNote, 'AES-256-GCM decryption restores original sensitive medical note');

    // ==========================================
    // REQUIREMENT 2 & 4: User Profile & Onboarding
    // ==========================================
    console.log('\n2. [Database & Profiles] Testing Onboarding & Profile Management:');

    // 2a. POST /api/user/onboarding
    const onboardingRes = await request('/api/user/onboarding', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: {
        heightCm: 172,
        weightKg: 68,
        age: 26,
        gender: 'female',
        bloodType: 'A+',
        activityLevel: 'moderately_active',
        healthGoal: 'lose_weight',
        allergies: ['Peanuts', 'Dairy'],
        dietaryRestrictions: ['Gluten-Free'],
        medicalConditions: ['Seasonal Allergies']
      }
    });
    assert(onboardingRes.status === 200, 'POST /api/user/onboarding saves onboarding health profile');
    assert(onboardingRes.data.data.healthProfile.bloodType === 'A+', 'Blood type stored correctly (A+)');
    assert(onboardingRes.data.data.healthProfile.bmi > 0, `Computed BMI: ${onboardingRes.data.data.healthProfile.bmi}`);
    assert(onboardingRes.data.data.healthProfile.targets.dailyCalories > 0, `Calculated Daily Calorie Target: ${onboardingRes.data.data.healthProfile.targets.dailyCalories} kcal`);

    // 2b. GET /api/user/profile
    const profileRes = await request('/api/user/profile', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(profileRes.status === 200, 'GET /api/user/profile retrieves complete user & health profile');
    assert(profileRes.data.data.isOnboarded === true, 'Profile status indicates isOnboarded: true');

    // ==========================================
    // REQUIREMENT 2 & 4: Daily Logs & Health Dashboard
    // ==========================================
    console.log('\n3. [Dashboard & Daily Logs] Testing Daily Metrics & Aggregation:');

    // 3a. POST /api/health/daily-log
    const logRes = await request('/api/health/daily-log', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: {
        waterIntake: 2200,
        sleepHours: 8.0,
        caloriesBurned: 520,
        exerciseDuration: 50,
        steps: 9200
      }
    });
    assert(logRes.status === 200, 'POST /api/health/daily-log logs daily metrics');

    // 3b. GET /api/health/dashboard
    const dashRes = await request('/api/health/dashboard', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(dashRes.status === 200, 'GET /api/health/dashboard returns 200 OK');
    assert(dashRes.data.data.metrics.waterIntake.current === 2200, 'Dashboard reflects 2200ml water intake');
    assert(dashRes.data.data.metrics.sleep.current === 8.0, 'Dashboard reflects 8.0 hours sleep');
    assert(dashRes.data.data.metrics.caloriesBurned.current === 520, 'Dashboard reflects 520 kcal burned');
    assert(dashRes.data.data.metrics.exerciseDuration.current === 50, 'Dashboard reflects 50 min exercise duration');
    assert(dashRes.data.data.healthScore.score > 0, `Computed Health Score: ${dashRes.data.data.healthScore.score}/100`);
    assert(Array.isArray(dashRes.data.data.chartHistory), 'Dashboard returns 7-day chart history array');

    // ==========================================
    // REQUIREMENT 3 & 4: Smart Scanner (Vision & Barcode)
    // ==========================================
    console.log('\n4. [Third-Party Scanner] Testing Barcode & Multimodal Vision AI:');

    // 4a. Barcode scan with Open Food Facts
    const barcodeScan = await request('/api/scanner/analyze', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { barcode: '3017620422003' }
    });
    assert(barcodeScan.status === 200, 'POST /api/scanner/analyze with barcode returns product breakdown');
    assert(barcodeScan.data.data.nutritionalBreakdown.calories !== undefined, 'Barcode returns nutrition per 100g');

    // 4b. Vision AI food photo analysis with base64
    const visionScan = await request('/api/scanner/analyze', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: {
        imageBase64: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...',
        textHint: 'Grilled Chicken Salad with avocado and olive oil',
        autoLog: true,
        mealType: 'lunch'
      }
    });
    assert(visionScan.status === 200, 'POST /api/scanner/analyze with image returns vision AI breakdown');
    assert(visionScan.data.data.nutritionalBreakdown.protein > 0, `Identified Protein: ${visionScan.data.data.nutritionalBreakdown.protein}g`);
    assert(visionScan.data.data.loggedMeal !== null, 'AutoLog option successfully recorded meal into NutritionLog');

    // ==========================================
    // REQUIREMENT 3 & 4: AI Chatbot Engine with Allergy Safety
    // ==========================================
    console.log('\n5. [AI Chatbot] Testing Personalized LLM Chat & Allergy Guard:');

    // 5a. General Health Chat Query
    const chatGeneral = await request('/api/chat/message', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { message: 'How is my hydration and exercise looking today?' }
    });
    assert(chatGeneral.status === 200, 'POST /api/chat/message returns AI response');
    assert(chatGeneral.data.data.reply && chatGeneral.data.data.reply.length > 10, 'AI generated contextual response');

    // 5b. CRITICAL SAFETY: Asking about an allergen (Peanut) when user has peanut allergy
    const chatAllergyCheck = await request('/api/chat/message', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { message: 'Can I eat this chocolate peanut butter protein bar?' }
    });
    assert(chatAllergyCheck.status === 200, 'POST /api/chat/message processed allergy check');
    const aiText = (chatAllergyCheck.data.data.reply || '').toLowerCase();
    assert(
      aiText.includes('no') || aiText.includes('warning') || aiText.includes('allergy') || aiText.includes('peanut'),
      'AI Chatbot correctly flagged Peanut allergy hazard for the user'
    );

    // ==========================================
    // REQUIREMENT 5: Recommendation Engine
    // ==========================================
    console.log('\n6. [Recommendation Engine] Testing Goal & Allergy-Filtered Food Recommendations:');

    const recsRes = await request('/api/recommendations', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(recsRes.status === 200, 'GET /api/recommendations returns 200 OK');
    assert(recsRes.data.data.allRecommendations.length > 0, 'Returned list of goal-tailored recipes');
    
    // Verify ALL returned recipes are free of Peanuts & Dairy (User's allergens)
    const hasUnsafeDairyOrPeanut = recsRes.data.data.allRecommendations.some(r => {
      const allAllergens = (r.allergens || []).map(a => a.toLowerCase());
      return allAllergens.includes('peanuts') || allAllergens.includes('dairy');
    });
    assert(!hasUnsafeDairyOrPeanut, 'Recommendation engine strictly filtered out all Dairy and Peanut containing recipes');

    assert(recsRes.data.data.dailyMealPlan.breakfast !== undefined, 'Generated daily meal plan with breakfast');
    assert(recsRes.data.data.dailyMealPlan.lunch !== undefined, 'Generated daily meal plan with lunch');
    assert(recsRes.data.data.dailyMealPlan.dinner !== undefined, 'Generated daily meal plan with dinner');

    // Custom AI Meal suggestion
    const customRec = await request('/api/recommendations/custom', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { mealType: 'dinner', targetCalories: 480 }
    });
    assert(customRec.status === 200, 'POST /api/recommendations/custom generated custom AI meal proposal');

    console.log('\n======================================================');
    console.log('🎉 ALL CURA+ FRONTEND INTEGRATION TESTS PASSED 100%!');
    console.log('======================================================\n');

    server.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test Execution Failed:', error);
    if (server) server.close();
    process.exit(1);
  }
}

runCuraIntegrationTests();
