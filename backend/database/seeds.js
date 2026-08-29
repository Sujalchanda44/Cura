/**
 * HealthSync AI - Database Initialization
 * Manages clean database startup and removes stale demo accounts
 */

const memoryDb = require('./memoryStore');
const logger = require('../utils/logger');

async function seedDatabase() {
  try {
    // Clear local in-memory store
    memoryDb.clear();

    const { supabase, isSupabaseConfigured } = require('../services/supabaseService');
    if (isSupabaseConfigured) {
      try {
        // Clean up any legacy demo test accounts so database is 100% clean for real users
        await supabase.from('users').delete().in('email', [
          'admin@healthsync.ai',
          'john@healthsync.ai',
          'elena@curaplus.health',
          'google.user@example.com'
        ]);
        logger.info('Cleaned up legacy demo accounts from Supabase.');
      } catch (err) {
        logger.warn('Supabase demo accounts cleanup note:', err.message);
      }
    }

    logger.success('Live database ready for fresh user registration and login.');
  } catch (error) {
    logger.error('Error during database initialization:', error);
  }
}

module.exports = { seedDatabase };
