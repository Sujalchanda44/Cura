/**
 * HealthSync AI - Environment Configuration Manager
 */

const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5001,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'healthsync_default_access_secret_2026',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'healthsync_default_refresh_secret_2026',
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d'
  },
  security: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10
  },
  gemini: {
    apiKey: process.env.PRIMARY_AI_API_KEY || process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite'
  },
  secondaryAi: {
    apiKey: process.env.SECONDARY_AI_API_KEY || process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || '',
    provider: process.env.SECONDARY_AI_PROVIDER || 'groq',
    model: process.env.SECONDARY_AI_MODEL || 'llama-3.2-11b-vision-preview',
    baseUrl: process.env.SECONDARY_AI_BASE_URL || 'https://api.groq.com/openai/v1'
  },
  openFoodFacts: {
    baseUrl: process.env.OPENFOODFACTS_BASE_URL || 'https://world.openfoodfacts.org/api/v2'
  },
  upload: {
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 5,
    uploadDir: process.env.UPLOAD_DIR || './uploads'
  },
  supabase: {
    url: process.env.SUPABASE_URL || '',
    key: process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || ''
  }
};

module.exports = config;
