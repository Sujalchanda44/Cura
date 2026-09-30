/**
 * Supabase Storage Service
 * Manages cloud storage uploads for user avatars/profile pictures (DP) and food scanner images.
 * Eliminates storing user files on the local device filesystem.
 */

const path = require('path');
const config = require('../config/env');
const logger = require('../utils/logger');
const { supabase, supabaseAdmin, getStorageClient, isSupabaseConfigured } = require('./supabaseService');

const BUCKET_NAME = config.supabase.storageBucket || 'cura-uploads';

class SupabaseStorageService {
  static bucketInitialized = false;

  /**
   * Ensure that the storage bucket exists and is public.
   * If supabaseAdmin is available, automatically provisions the bucket.
   */
  static async ensureBucket() {
    if (this.bucketInitialized) return true;
    if (!isSupabaseConfigured) {
      throw new Error('Supabase client is not configured. Please check SUPABASE_URL and SUPABASE_KEY in backend/.env');
    }

    const client = getStorageClient();

    try {
      const { data: bucket, error } = await client.storage.getBucket(BUCKET_NAME);
      if (bucket) {
        this.bucketInitialized = true;
        return true;
      }

      // If bucket was not found, attempt to create it
      if (error && (error.statusCode === '404' || error.message?.includes('not found') || error.code === 'BucketNotFound')) {
        logger.info(`Storage bucket "${BUCKET_NAME}" not found. Attempting to create...`);

        // If admin client exists, use it to create public bucket
        const creatorClient = supabaseAdmin || client;
        const { data: createdBucket, error: createErr } = await creatorClient.storage.createBucket(BUCKET_NAME, {
          public: true,
          fileSizeLimit: config.upload.maxFileSizeMb * 1024 * 1024,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
        });

        if (createErr) {
          logger.warn(`Could not auto-create bucket "${BUCKET_NAME}": ${createErr.message}. Ensure the bucket is created in Supabase Dashboard or run backend/database/setup_storage.sql.`);
          return false;
        }

        logger.info(`Storage bucket "${BUCKET_NAME}" created successfully.`);
        this.bucketInitialized = true;
        return true;
      }
    } catch (err) {
      logger.warn(`ensureBucket check warning for "${BUCKET_NAME}": ${err.message}`);
    }

    return false;
  }

  /**
   * Upload an in-memory buffer or Multer file directly to Supabase Storage
   * @param {Object} file - Multer file object or { buffer, mimetype, originalname }
   * @param {Object} options - { folder: 'avatars' | 'scans' | 'food', prefix: string, userId: string }
   * @returns {Promise<{ publicUrl: string, filePath: string, bucket: string }>}
   */
  static async uploadFile(file, options = {}) {
    if (!file || (!file.buffer && !file.path)) {
      throw new Error('No valid file buffer provided for cloud upload');
    }

    const client = getStorageClient();
    if (!client) {
      throw new Error('Supabase Storage client is not available');
    }

    await this.ensureBucket();

    // Determine extension
    let ext = '.jpg';
    if (file.originalname) {
      ext = path.extname(file.originalname).toLowerCase();
    } else if (file.mimetype) {
      const mimeExtMap = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
        'image/gif': '.gif',
        'image/heic': '.heic',
        'image/heif': '.heif'
      };
      ext = mimeExtMap[file.mimetype] || '.jpg';
    }

    const folder = options.folder || 'uploads';
    const prefix = options.prefix || (folder === 'avatars' ? 'avatar' : 'image');
    const userTag = options.userId ? `${options.userId.substring(0, 8)}-` : '';
    const uniqueId = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const fileName = `${prefix}-${userTag}${uniqueId}${ext}`;
    const filePath = `${folder}/${fileName}`;

    let buffer = file.buffer;
    if (!buffer && file.path) {
      const fs = require('fs');
      buffer = fs.readFileSync(file.path);
    }

    const contentType = file.mimetype || 'image/jpeg';

    const { data, error } = await client.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType,
        upsert: true,
        cacheControl: '3600'
      });

    if (error) {
      logger.error(`Supabase Storage upload error for ${filePath}:`, error);
      throw new Error(`Failed to upload to Supabase Storage: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = client.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    const publicUrl = urlData?.publicUrl || `${config.supabase.url}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;

    logger.info(`File uploaded successfully to Supabase Storage: ${filePath}`);

    return {
      publicUrl,
      filePath,
      bucket: BUCKET_NAME,
      fileName
    };
  }

  /**
   * Upload base64 encoded image directly to Supabase Storage
   * @param {string} base64String - Data URI (data:image/png;base64,...) or raw base64 string
   * @param {Object} options - { folder: 'avatars' | 'scans' | 'food', prefix: string, userId: string }
   * @returns {Promise<{ publicUrl: string, filePath: string, bucket: string }>}
   */
  static async uploadBase64(base64String, options = {}) {
    if (!base64String || typeof base64String !== 'string') {
      throw new Error('Valid base64 string is required');
    }

    let mimeType = 'image/jpeg';
    let rawBase64 = base64String;

    const matches = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (matches) {
      mimeType = matches[1];
      rawBase64 = matches[2];
    }

    const buffer = Buffer.from(rawBase64, 'base64');
    return this.uploadFile(
      {
        buffer,
        mimetype: mimeType,
        originalname: `upload.${mimeType.split('/')[1] || 'jpg'}`
      },
      options
    );
  }

  /**
   * Delete an object from Supabase Storage by its public URL or internal path
   * @param {string} fileUrlOrPath - Full public URL or path inside bucket
   */
  static async deleteFile(fileUrlOrPath) {
    if (!fileUrlOrPath || typeof fileUrlOrPath !== 'string') return false;

    // Check if it's a Supabase storage URL
    let relativePath = fileUrlOrPath;
    const bucketMarker = `/${BUCKET_NAME}/`;
    if (fileUrlOrPath.includes(bucketMarker)) {
      relativePath = fileUrlOrPath.substring(fileUrlOrPath.indexOf(bucketMarker) + bucketMarker.length);
    } else if (fileUrlOrPath.startsWith('http://') || fileUrlOrPath.startsWith('https://')) {
      // Remote URL that doesn't belong to our bucket
      return false;
    }

    const client = getStorageClient();
    if (!client) return false;

    try {
      const { error } = await client.storage
        .from(BUCKET_NAME)
        .remove([relativePath]);

      if (error) {
        logger.warn(`Failed to delete object from Supabase Storage (${relativePath}):`, error.message);
        return false;
      }

      logger.info(`Deleted object from Supabase Storage: ${relativePath}`);
      return true;
    } catch (err) {
      logger.warn(`Supabase Storage delete exception for ${relativePath}:`, err.message);
      return false;
    }
  }
}

module.exports = SupabaseStorageService;
