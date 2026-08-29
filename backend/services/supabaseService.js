const { createClient } = require('@supabase/supabase-js');
const config = require('../config/env');
const logger = require('../utils/logger');

const supabaseUrl = config.supabase.url;
const supabaseKey = config.supabase.key;

let supabase = null;
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

module.exports = {
  supabase,
  isSupabaseConfigured
};
