const { createClient } = require('@supabase/supabase-js');
const config = require('../config/env');
const logger = require('../utils/logger');

const supabaseUrl = config.supabase.url;
const supabaseKey = config.supabase.key;

let supabase = null;
let supabaseAdmin = null;
let isSupabaseConfigured = false;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false
      }
    });
    isSupabaseConfigured = true;
    logger.info('Supabase client initialized successfully!');
  } catch (err) {
    logger.error('Failed to initialize Supabase client:', err);
  }
} else {
  logger.warn('Supabase URL or Key not provided. Falling back to local In-Memory Database store.');
}

// Optional: Supabase Admin client with service_role privileges (bypasses RLS for backend storage & admin ops)
const serviceRoleKey = config.supabase.serviceRoleKey;
if (supabaseUrl && serviceRoleKey) {
  try {
    supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    logger.info('Supabase Admin (service_role) client initialized successfully!');
  } catch (err) {
    logger.warn('Failed to initialize Supabase Admin client:', err.message);
  }
}

/**
 * Returns the best available Supabase client for storage operations.
 * Prefers supabaseAdmin if configured to bypass RLS and allow bucket provisioning.
 */
const getStorageClient = () => {
  return supabaseAdmin || supabase;
};

module.exports = {
  supabase,
  supabaseAdmin,
  isSupabaseConfigured,
  getStorageClient
};

