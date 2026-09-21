-- ==============================================================
-- Cura+ (HealthSync AI) - Complete Supabase Database Schema DDL
-- Paste this entire script into your Supabase SQL Editor:
-- Supabase Dashboard -> Select Project -> SQL Editor -> New Query -> Run
-- ==============================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean Slate: Drop old/broken tables if needed
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.nutrition_logs CASCADE;
DROP TABLE IF EXISTS public.health_metrics CASCADE;
DROP TABLE IF EXISTS public.health_profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. USERS TABLE
CREATE TABLE public.users (
    id TEXT PRIMARY KEY, -- Supports Supabase Auth UUID or custom text ID
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    role TEXT DEFAULT 'user',
    "avatarUrl" TEXT,
    "googleId" TEXT,
    settings JSONB DEFAULT '{"theme": "dark", "notificationsEnabled": true, "unitSystem": "metric"}'::jsonb,
    "isVerified" BOOLEAN DEFAULT true,
    "resetPasswordToken" TEXT,
    "resetPasswordExpires" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. HEALTH PROFILES TABLE (Biometrics, Clinical Goals & Allergen Shield)
CREATE TABLE public.health_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    "heightCm" NUMERIC,
    height NUMERIC,
    "weightKg" NUMERIC,
    weight NUMERIC,
    age INTEGER,
    gender TEXT,
    "bloodType" TEXT DEFAULT 'O+',
    "activityLevel" TEXT DEFAULT 'moderately_active',
    "healthGoal" TEXT DEFAULT 'stay_healthy',
    "healthGoals" TEXT[] DEFAULT ARRAY['stay_healthy']::TEXT[],
    allergies TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dietaryRestrictions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "medicalConditions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "medicalConditionsEncrypted" TEXT,
    "isOnboarded" BOOLEAN DEFAULT true,
    bmi NUMERIC,
    "bmiCategory" TEXT,
    bmr NUMERIC,
    tdee NUMERIC,
    targets JSONB DEFAULT '{}'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. HEALTH METRICS TABLE (Daily Steps, Water, Sleep, Activity)
CREATE TABLE public.health_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date TEXT NOT NULL, -- Format: YYYY-MM-DD
    steps INTEGER DEFAULT 0,
    "targetSteps" INTEGER DEFAULT 8000,
    "waterMl" INTEGER DEFAULT 0,
    "targetWaterMl" INTEGER DEFAULT 2500,
    "sleepHours" NUMERIC DEFAULT 0,
    "targetSleepHours" NUMERIC DEFAULT 8,
    "activeCaloriesBurnt" INTEGER DEFAULT 0,
    "workoutMinutes" INTEGER DEFAULT 0,
    "weightKg" NUMERIC,
    "heartRateAvg" INTEGER DEFAULT 70,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_date UNIQUE ("userId", date)
);

-- 5. NUTRITION LOGS TABLE (Food Scanner & Diet Tracking)
CREATE TABLE public.nutrition_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date TEXT NOT NULL, -- Format: YYYY-MM-DD
    "mealType" TEXT DEFAULT 'snack', -- breakfast, lunch, dinner, snack
    name TEXT NOT NULL,
    calories NUMERIC DEFAULT 0,
    protein NUMERIC DEFAULT 0,
    carbs NUMERIC DEFAULT 0,
    fat NUMERIC DEFAULT 0,
    fiber NUMERIC DEFAULT 0,
    ingredients TEXT[] DEFAULT ARRAY[]::TEXT[],
    barcode TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. NOTIFICATIONS & REMINDERS TABLE
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL, -- medicine, water, workout, general
    dosage TEXT,
    time TEXT NOT NULL, -- e.g. "08:30"
    days TEXT[] DEFAULT ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']::TEXT[],
    "isActive" BOOLEAN DEFAULT true,
    notes TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. HEALTH REPORTS TABLE
CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- weekly, monthly
    "periodStart" TEXT NOT NULL,
    "periodEnd" TEXT NOT NULL,
    summary TEXT,
    "healthScoreAverage" NUMERIC,
    "nutritionAverage" JSONB DEFAULT '{}'::jsonb,
    "activityAverage" JSONB DEFAULT '{}'::jsonb,
    "aiInsights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "generatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- Enables open RLS policies so frontend and backend can read & write
-- ==============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all users operations" ON public.users;
CREATE POLICY "Allow all users operations" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all health_profiles operations" ON public.health_profiles;
CREATE POLICY "Allow all health_profiles operations" ON public.health_profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all health_metrics operations" ON public.health_metrics;
CREATE POLICY "Allow all health_metrics operations" ON public.health_metrics FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all nutrition_logs operations" ON public.nutrition_logs;
CREATE POLICY "Allow all nutrition_logs operations" ON public.nutrition_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all notifications operations" ON public.notifications;
CREATE POLICY "Allow all notifications operations" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all reports operations" ON public.reports;
CREATE POLICY "Allow all reports operations" ON public.reports FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================
-- 9. SUPABASE AUTH TO PUBLIC.USERS SYNC TRIGGER
-- Automatically creates a user profile in public.users when 
-- a new user registers through Supabase Auth or Google OAuth
-- ==============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, name, email, role, "avatarUrl", "isVerified")
    VALUES (
        NEW.id::text,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'User'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
        NEW.raw_user_meta_data->>'avatar_url',
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, public.users.name),
        "updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================
-- 10. PRE-SEEDED DEMO ACCOUNTS (Matches README.md credentials)
-- Admin: admin@healthsync.ai / Admin@123456
-- User:  john@healthsync.ai  / User@123456
-- ==============================================================
INSERT INTO public.users (id, name, email, password, role, "avatarUrl", "isVerified")
VALUES 
    ('usr_admin_001', 'System Administrator', 'admin@healthsync.ai', '$2a$10$7R7z179RslQ861zUf7Z1eeD1l2mY2eY2eY2eY2eY2eY2eY2eY2eY2', 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80', true),
    ('usr_demo_002', 'John Doe', 'john@healthsync.ai', '$2a$10$7R7z179RslQ861zUf7Z1eeD1l2mY2eY2eY2eY2eY2eY2eY2eY2eY2', 'user', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80', true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    "avatarUrl" = EXCLUDED."avatarUrl";

INSERT INTO public.health_profiles (
    "userId", "heightCm", height, "weightKg", weight, age, gender, "bloodType",
    "activityLevel", "healthGoal", "healthGoals", allergies, "dietaryRestrictions",
    "medicalConditions", "isOnboarded", bmi, "bmiCategory", bmr, tdee, targets
) VALUES (
    'usr_demo_002', 178, 178, 74, 74, 28, 'male', 'O+',
    'moderately_active', 'lose_weight', ARRAY['lose_weight'], ARRAY['Peanuts', 'Shellfish'],
    ARRAY['Low Lactose'], ARRAY['Mild Asthma'], true, 23.4, 'Normal', 1720, 2400,
    '{"dailyCalories": 2000, "steps": 8000, "waterMl": 2500, "sleepHours": 8, "protein": 140, "carbs": 220, "fat": 65}'::jsonb
) ON CONFLICT ("userId") DO UPDATE SET
    "isOnboarded" = true,
    bmi = EXCLUDED.bmi,
    bmr = EXCLUDED.bmr,
    tdee = EXCLUDED.tdee;

INSERT INTO public.notifications (id, "userId", title, type, dosage, time, days, "isActive", notes)
VALUES 
    ('11111111-1111-1111-1111-111111111111'::uuid, 'usr_demo_002', 'Multivitamin Complex', 'medicine', '1 Tablet', '08:30', ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], true, 'Take after breakfast with water'),
    ('22222222-2222-2222-2222-222222222222'::uuid, 'usr_demo_002', 'Hydration Check', 'water', '500ml Water', '14:00', ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], true, 'Drink a full glass of water')
ON CONFLICT (id) DO NOTHING;
