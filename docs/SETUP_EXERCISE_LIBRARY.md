# Exercise Library Database Setup

## Issue: Cannot fetch exercises

The exercise library feature requires a database migration to be run. Here's how to set it up:

## Quick Setup Steps:

### 1. Open Supabase Dashboard
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click on **"SQL Editor"** in the left sidebar

### 2. Run the Migration
1. Click **"New Query"**
2. Copy the **entire contents** of the file: `supabase/migrations/create_exercise_library.sql`
3. Paste it into the SQL editor
4. Click **"Run"** (or press Ctrl+Enter)

### 3. Verify Setup
After running the migration, you should see:
- A new `exercise_library` table created
- 100+ exercises automatically inserted
- Categories like Chest, Back, Shoulders, Arms, Legs, Core, Calves

### 4. Test the Feature
1. Go back to your training day page
2. Click "Add Exercise"
3. Try searching for exercises like "push-ups", "squats", or "bench press"

## What This Adds:

✅ **Searchable Exercise Library**: 100+ predefined exercises
✅ **Smart Search**: Search by name, filter by category
✅ **Auto-Complete**: Pre-filled sets, reps, and rest times
✅ **Professional**: Covers all major muscle groups and equipment
✅ **Flexible**: Still allows custom exercises

## Categories Included:
- 🔵 **Chest** (20 exercises): Push-ups, bench press, flyes, etc.
- 🔴 **Back** (20 exercises): Pull-ups, rows, deadlifts, lat pulldowns
- 🟡 **Shoulders** (15 exercises): Overhead press, lateral raises, etc.
- 🟢 **Arms** (22 exercises): Bicep curls, tricep dips, etc.
- 🟤 **Legs** (22 exercises): Squats, lunges, leg press, etc.
- ⚪ **Calves** (8 exercises): Calf raises, calf press, etc.
- 🟣 **Core** (17 exercises): Planks, crunches, Russian twists, etc.

## Troubleshooting:

**If you get permission errors:**
- Make sure you're logged into Supabase with admin access
- Use the SQL Editor, not the Table Editor

**If exercises still don't load:**
1. Check browser console for errors (F12 → Console)
2. Test the API at: `/api/exercises/test`
3. Verify the `exercise_library` table exists in your database

**If you need help:**
- Check the database logs in Supabase dashboard
- Ensure your internet connection is stable
- Try refreshing the page after running the migration

## Migration File Location:
```
supabase/migrations/create_exercise_library.sql
```

This file contains all the SQL commands needed to set up the complete exercise library feature.
