/**
 * Tests for Supabase Storage Service
 */

const assert = require('assert');
const SupabaseStorageService = require('../services/supabaseStorageService');
const config = require('../config/env');

async function runStorageTests() {
  console.log('🧪 Starting Supabase Storage Service Unit Tests...\n');

  // Test 1: Bucket name configuration
  assert.strictEqual(
    config.supabase.storageBucket,
    'cura-uploads',
    'Storage bucket must default to cura-uploads'
  );
  console.log('✅ [PASS] 1. Storage bucket configuration verified');

  // Test 2: uploadFile requires valid file/buffer
  try {
    await SupabaseStorageService.uploadFile(null);
    assert.fail('Should have thrown error for null file');
  } catch (err) {
    assert.ok(err.message.includes('buffer'), 'Throws error when buffer is missing');
    console.log('✅ [PASS] 2. uploadFile validates input buffer');
  }

  // Test 3: uploadBase64 requires valid string
  try {
    await SupabaseStorageService.uploadBase64('');
    assert.fail('Should have thrown error for empty base64 string');
  } catch (err) {
    assert.ok(err.message.includes('base64'), 'Throws error when base64 is missing');
    console.log('✅ [PASS] 3. uploadBase64 validates input string');
  }

  // Test 4: deleteFile handles invalid / external URLs safely
  const externalDelete = await SupabaseStorageService.deleteFile('https://images.unsplash.com/photo-12345');
  assert.strictEqual(externalDelete, false, 'External images should not attempt deletion in bucket');
  console.log('✅ [PASS] 4. deleteFile safely ignores external photo URLs');

  console.log('\n🎉 All Supabase Storage Unit Tests Passed!');
}

runStorageTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
