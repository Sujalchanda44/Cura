-- ==============================================================
-- Cura+ Supabase Database Schema DDL
-- Paste this script into your Supabase SQL Editor to create all tables
-- ==============================================================

-- Enable UUID generation extension
create extension if not exists "uuid-ossp";

-- 1. USERS TABLE
create table if not exists public.users (
    id text primary key, -- Supports custom text UUIDs/IDs from local system or auth
    name text not null,
    email text unique not null,
    password text,
    role text default 'user',
    "avatarUrl" text,
    "googleId" text,
    settings jsonb default '{"theme": "dark", "notificationsEnabled": true, "unitSystem": "metric"}'::jsonb,
    "isVerified" boolean default true,
    "createdAt" timestamp with time zone default now(),
    "updatedAt" timestamp with time zone default now()
);

-- 2. HEALTH PROFILES TABLE (Allergy Guard & Biometrics)
create table if not exists public.health_profiles (
    id uuid primary key default gen_random_uuid(),
    "userId" text unique references public.users(id) on delete cascade,
    "heightCm" numeric,
    height numeric,
    "weightKg" numeric,
    weight numeric,
    age integer,
    gender text,
    "bloodType" text,
    "activityLevel" text,
    "healthGoal" text,
    "healthGoals" text[],
    allergies text[],
    "dietaryRestrictions" text[],
    "medicalConditions" text[],
    "medicalConditionsEncrypted" text,
    "isOnboarded" boolean default true,
    bmi numeric,
    "bmiCategory" text,
    bmr numeric,
    tdee numeric,
    targets jsonb,
    "createdAt" timestamp with time zone default now(),
    "updatedAt" timestamp with time zone default now()
);

-- 3. HEALTH METRICS TABLE (Daily logs)
create table if not exists public.health_metrics (
    id uuid primary key default gen_random_uuid(),
    "userId" text references public.users(id) on delete cascade,
    date text not null, -- format: YYYY-MM-DD
    steps integer default 0,
    "targetSteps" integer default 8000,
    "waterMl" integer default 0,
    "targetWaterMl" integer default 2500,
    "sleepHours" numeric default 0,
    "targetSleepHours" numeric default 8,
    "activeCaloriesBurnt" integer default 0,
    "workoutMinutes" integer default 0,
    "weightKg" numeric,
    "heartRateAvg" integer default 70,
    "createdAt" timestamp with time zone default now(),
    "updatedAt" timestamp with time zone default now(),
    unique("userId", date)
);

-- 4. NUTRITION LOGS TABLE (Meal logs)
create table if not exists public.nutrition_logs (
    id uuid primary key default gen_random_uuid(),
    "userId" text references public.users(id) on delete cascade,
    date text not null,
    "mealType" text default 'snack',
    name text not null,
    calories numeric default 0,
    protein numeric default 0,
    carbs numeric default 0,
    fat numeric default 0,
    fiber numeric default 0,
    ingredients text[],
    barcode text,
    "imageUrl" text,
    "createdAt" timestamp with time zone default now(),
    "updatedAt" timestamp with time zone default now()
);

-- 5. NOTIFICATIONS & REMINDERS TABLE
create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),
    "userId" text references public.users(id) on delete cascade,
    title text not null,
    type text not null,
    dosage text,
    time text not null, -- format: "08:30"
    days text[],
    "isActive" boolean default true,
    notes text,
    "createdAt" timestamp with time zone default now(),
    "updatedAt" timestamp with time zone default now()
);

-- 6. HEALTH REPORTS TABLE
create table if not exists public.reports (
    id uuid primary key default gen_random_uuid(),
    "userId" text references public.users(id) on delete cascade,
    type text not null, -- 'weekly' | 'monthly'
    "periodStart" text not null,
    "periodEnd" text not null,
    summary text,
    "healthScoreAverage" numeric,
    "nutritionAverage" jsonb,
    "activityAverage" jsonb,
    "aiInsights" text[],
    "generatedAt" timestamp with time zone default now(),
    "createdAt" timestamp with time zone default now(),
    "updatedAt" timestamp with time zone default now()
);
