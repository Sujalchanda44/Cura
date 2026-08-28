/**
 * HealthSync AI - Comprehensive API Sanity & Integration Test Suite
 */

const http = require('http');
const app = require('../app');
const { seedDatabase } = require('../../database/seeds');

let server;
let baseUrl;
let adminToken = '';
let userToken = '';
let refreshToken = '';

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

async function runTests() {
  console.log('\n=============================================');
  console.log('🧪 Starting HealthSync AI Sanity Tests');
  console.log('=============================================\n');

  try {
    await seedDatabase();

    // Start ephemeral test server
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        console.log(`Test server running on port ${port}\n`);
        resolve();
      });
    });

    // 1. Health Check
    console.log('1. Testing System Health API:');
    const health = await request('/api/health');
    assert(health.status === 200 && health.data.success === true, 'GET /api/health responds with 200 OK');

    // 2. Authentication
    console.log('\n2. Testing Authentication & JWT Tokens:');
    // Login as Admin
    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@healthsync.ai', password: 'Admin@123456' }
    });
    assert(adminLogin.status === 200, 'Admin login successful');
    assert(adminLogin.data.data.user.role === 'admin', 'Admin role verified');
    adminToken = adminLogin.data.data.tokens.accessToken;

    // Login as Demo User
    const userLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'john@healthsync.ai', password: 'User@123456' }
    });
    assert(userLogin.status === 200, 'User login successful');
    userToken = userLogin.data.data.tokens.accessToken;
    refreshToken = userLogin.data.data.tokens.refreshToken;

    // Register a new User
    const registerRes = await request('/api/auth/register', {
      method: 'POST',
      body: { name: 'Sarah Connor', email: `sarah_${Date.now()}@test.com`, password: 'Password@123' }
    });
    assert(registerRes.status === 201, 'User registration returns 201 Created');

    // Token Refresh
    const refreshRes = await request('/api/auth/refresh-token', {
      method: 'POST',
      body: { refreshToken }
    });
    assert(refreshRes.status === 200 && refreshRes.data.data.accessToken, 'Refresh token generates new access token');

    // 3. User Profile
    console.log('\n3. Testing User Profile:');
    const profileRes = await request('/api/profile', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(profileRes.status === 200 && profileRes.data.data.email === 'john@healthsync.ai', 'GET /api/profile works');

    // 4. Health Profile & Biometrics
    console.log('\n4. Testing Health Profile & Biometric Calculations:');
    const hpGet = await request('/api/health-profile', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(hpGet.status === 200, 'GET /api/health-profile retrieves calculated metrics');
    assert(hpGet.data.data.bmi > 0, `Computed BMI: ${hpGet.data.data.bmi} (${hpGet.data.data.bmiCategory})`);
    assert(hpGet.data.data.bmr > 0, `Computed BMR: ${hpGet.data.data.bmr} kcal`);
    assert(hpGet.data.data.tdee > 0, `Computed TDEE: ${hpGet.data.data.tdee} kcal`);

    // 5. Dashboard & Health Score
    console.log('\n5. Testing Dashboard & Health Score Engine:');
    const dashSummary = await request('/api/dashboard/summary', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(dashSummary.status === 200, 'GET /api/dashboard/summary returns calorie & macro breakdown');

    const healthScore = await request('/api/dashboard/health-score', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(healthScore.status === 200, `Health score computed: ${healthScore.data.data.overallScore}/100 (${healthScore.data.data.status})`);

    const weeklyReport = await request('/api/dashboard/weekly-report', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(weeklyReport.status === 200 && weeklyReport.data.data.dailyBreakdown.length === 7, '7-Day trend report generated');

    // 6. Food Scanner & Allergens
    console.log('\n6. Testing Food Scanner & OpenFoodFacts Service:');
    const barcodeRes = await request('/api/food/scan-barcode', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { barcode: '3017620422003' }
    });
    assert(barcodeRes.status === 200, 'Barcode lookup returns product & allergen analysis');

    const allergenCheck = await request('/api/food/check-allergens', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { ingredients: ['Peanuts', 'Sugar', 'Cocoa butter'] }
    });
    assert(allergenCheck.status === 200 && allergenCheck.data.data.hasConflict === true, 'Allergen detection correctly flagged Peanut allergy conflict');

    // 7. AI Assistant
    console.log('\n7. Testing AI Assistant (Gemini Integration):');
    const aiChat = await request('/api/ai/chat', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { message: 'What is a good post-workout snack for muscle recovery?' }
    });
    assert(aiChat.status === 200 && aiChat.data.data.aiResponse, 'AI Chat endpoint returns structured response');

    const aiAdvice = await request('/api/ai/health-advice', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(aiAdvice.status === 200, 'AI Health Advice endpoint returns personalized tips');

    // 8. Notifications & Reminders
    console.log('\n8. Testing Notification & Medicine Reminders:');
    const medReminder = await request('/api/notifications/medicine-reminder', {
      method: 'POST',
      headers: { Authorization: `Bearer ${userToken}` },
      body: { title: 'Vitamin D3', dosage: '2000 IU', time: '09:00', days: ['Daily'], notes: 'Take with morning meal' }
    });
    assert(medReminder.status === 201, 'POST /api/notifications/medicine-reminder created');

    const notifs = await request('/api/notifications', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(notifs.status === 200 && notifs.data.data.length >= 2, 'GET /api/notifications lists active reminders');

    // 9. PDF Report Export
    console.log('\n9. Testing PDF Export Engine:');
    const pdfRes = await request('/api/reports/download-pdf', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(pdfRes.status === 200, 'GET /api/reports/download-pdf returns 200 OK');
    assert(pdfRes.headers.get('content-type') === 'application/pdf', 'Response Content-Type is application/pdf');
    assert(pdfRes.buffer.byteLength > 1000, `PDF generated successfully (size: ${pdfRes.buffer.byteLength} bytes)`);

    // 10. Role-Based Access Control (Admin)
    console.log('\n10. Testing Role-Based Authorization (RBAC):');
    // Non-admin user should be blocked from /api/admin/users
    const forbiddenRes = await request('/api/admin/users', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    assert(forbiddenRes.status === 403, 'Standard user blocked with 403 Forbidden on Admin endpoint');

    // Admin user should succeed
    const adminUsersRes = await request('/api/admin/users', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminUsersRes.status === 200 && adminUsersRes.data.data.length >= 2, 'Admin user successfully retrieved paginated users');

    const adminAnalytics = await request('/api/admin/analytics', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminAnalytics.status === 200 && adminAnalytics.data.data.overview.totalRegisteredUsers >= 2, 'Admin platform analytics retrieved');

    console.log('\n=============================================');
    console.log('🎉 ALL 20+ API TESTS PASSED SUCCESSFULLY!');
    console.log('=============================================\n');

    server.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test Suite Failed:', error.message);
    if (server) server.close();
    process.exit(1);
  }
}

runTests();
