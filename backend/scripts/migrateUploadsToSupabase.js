/**
 * Migration Script: Migrate Local Uploads to Supabase Cloud Storage
 *
 * 1. Uploads existing files in ./uploads to Supabase Storage bucket 'cura-uploads'
 * 2. Updates Supabase public.users avatarUrl to point to cloud URLs
 * 3. Updates Supabase public.nutrition_logs imageUrl to point to cloud URLs
 * 4. Cleans up local disk image files in ./uploads
 *
 * Usage: node backend/scripts/migrateUploadsToSupabase.js
 */

const fs = require('fs');
const path = require('path');
const config = require('../config/env');
const logger = require('../utils/logger');
const { supabase, supabaseAdmin, getStorageClient, isSupabaseConfigured } = require('../services/supabaseService');

const BUCKET_NAME = config.supabase.storageBucket || 'cura-uploads';
const uploadsDir = path.resolve(__dirname, '../../uploads');

async function migrate() {
  console.log('=== Cura+ Local to Supabase Cloud Storage Migration ===\n');

  if (!isSupabaseConfigured) {
    console.error('❌ Supabase is not configured. Check SUPABASE_URL and SUPABASE_KEY in backend/.env');
    process.exit(1);
  }

  const client = getStorageClient();

  // 1. Verify bucket exists
  console.log(`Checking Supabase Storage bucket: "${BUCKET_NAME}"...`);
  const { data: bucket, error: bucketError } = await client.storage.getBucket(BUCKET_NAME);

  if (!bucket) {
    console.log(`Bucket "${BUCKET_NAME}" does not exist yet.`);
    const creatorClient = supabaseAdmin || client;
    const { data: newBucket, error: createError } = await creatorClient.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 10485760,
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    });

    if (createError) {
      console.error(`❌ Could not create bucket: ${createError.message}`);
      console.log('\n👉 ACTION REQUIRED:');
      console.log('1. Go to Supabase Dashboard -> Storage -> Create a new public bucket named "cura-uploads".');
      console.log('   OR');
      console.log('2. Run backend/database/setup_storage.sql in your Supabase SQL Editor.');
      console.log('   OR');
      console.log('3. Add SUPABASE_SERVICE_ROLE_KEY to backend/.env\n');
      process.exit(1);
    }
    console.log(`✅ Created bucket "${BUCKET_NAME}" successfully!\n`);
  } else {
    console.log(`✅ Bucket "${BUCKET_NAME}" is active.\n`);
  }

  // 2. Scan local uploads folder
  if (!fs.existsSync(uploadsDir)) {
    console.log('No local uploads directory found. Nothing to migrate.');
    return;
  }

  const files = fs.readdirSync(uploadsDir).filter(f => f !== '.gitkeep' && !f.startsWith('.'));
  console.log(`Found ${files.length} local files in ./uploads:`, files);

  if (files.length === 0) {
    console.log('No local images to migrate.');
    return;
  }

  const urlMapping = {}; // local path -> cloud url

  for (const filename of files) {
    const fullPath = path.join(uploadsDir, filename);
    const ext = path.extname(filename).toLowerCase();
    const isAvatar = filename.startsWith('avatar-');
    const folder = isAvatar ? 'avatars' : 'scans';
    const cloudPath = `${folder}/${filename}`;

    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif'
    };
    const contentType = mimeTypes[ext] || 'image/jpeg';
    const fileBuffer = fs.readFileSync(fullPath);

    console.log(`Uploading ${filename} -> ${BUCKET_NAME}/${cloudPath}...`);
    const { error: uploadError } = await client.storage
      .from(BUCKET_NAME)
      .upload(cloudPath, fileBuffer, {
        contentType,
        upsert: true
      });

    if (uploadError) {
      console.error(`  ⚠️ Failed to upload ${filename}:`, uploadError.message);
      continue;
    }

    const { data: urlData } = client.storage
      .from(BUCKET_NAME)
      .getPublicUrl(cloudPath);

    const publicUrl = urlData?.publicUrl || `${config.supabase.url}/storage/v1/object/public/${BUCKET_NAME}/${cloudPath}`;
    urlMapping[`/uploads/${filename}`] = publicUrl;
    console.log(`  ✅ Cloud URL: ${publicUrl}`);
  }

  // 3. Update public.users avatarUrl in Supabase
  console.log('\nChecking users with local avatar URLs...');
  const { data: users, error: usersErr } = await client
    .from('users')
    .select('id, name, email, avatarUrl');

  if (users) {
    for (const user of users) {
      if (user.avatarUrl && urlMapping[user.avatarUrl]) {
        const newUrl = urlMapping[user.avatarUrl];
        console.log(`Updating avatar for user "${user.name}" (${user.email}) -> ${newUrl}`);
        await client
          .from('users')
          .update({ avatarUrl: newUrl })
          .eq('id', user.id);
      }
    }
  }

  // 4. Update public.nutrition_logs imageUrl in Supabase
  console.log('\nChecking nutrition logs with local image URLs...');
  const { data: logs, error: logsErr } = await client
    .from('nutrition_logs')
    .select('id, name, imageUrl');

  if (logs) {
    for (const log of logs) {
      if (log.imageUrl && urlMapping[log.imageUrl]) {
        const newUrl = urlMapping[log.imageUrl];
        console.log(`Updating image for nutrition log "${log.name}" -> ${newUrl}`);
        await client
          .from('nutrition_logs')
          .update({ imageUrl: newUrl })
          .eq('id', log.id);
      }
    }
  }

  // 5. Clean up local files
  console.log('\nCleaning up local files from ./uploads...');
  for (const filename of files) {
    if (urlMapping[`/uploads/${filename}`]) {
      const fullPath = path.join(uploadsDir, filename);
      fs.unlinkSync(fullPath);
      console.log(`  Deleted local file: ${filename}`);
    }
  }

  console.log('\n🎉 Migration completed successfully! All images and profile pictures are now stored in Supabase Cloud Storage.');
}

migrate().catch(err => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
