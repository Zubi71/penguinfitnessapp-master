# Database Setup Instructions

## Issue: Training days table not found

The error you're seeing indicates that the `training_days` table doesn't exist in your Supabase database yet.

## Quick Fix:

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Run the Schema Creation**
   - Copy the contents of `supabase/complete_training_schema.sql`
   - Paste it into the SQL Editor
   - Click "Run"

## Alternative: Manual Table Creation

If you prefer, you can run this minimal SQL to create just the required table:

```sql
-- Create training_days table
CREATE TABLE IF NOT EXISTS training_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id UUID REFERENCES training_programs(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  day_number INTEGER NOT NULL,
  day_name TEXT NOT NULL,
  description TEXT,
  is_rest_day BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(cycle_id, week_number, day_number)
);

-- Enable RLS
ALTER TABLE training_days ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Trainers can manage their own training days" ON training_days
  FOR ALL USING (auth.uid() = trainer_id);
```

## After running the SQL:

1. Refresh your browser
2. Try creating a training day again
3. The improved error messages will help debug any remaining issues

## Need help?

The application now has better error logging. Check the browser console (F12) for detailed error messages that will help identify any remaining issues.
