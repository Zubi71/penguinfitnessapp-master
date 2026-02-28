# Fix for Training Data Access Issue

## Problem
The client can't access training days and exercises because of missing RLS (Row Level Security) policies.

## Solution
Run these SQL commands in your Supabase SQL Editor:

```sql
-- Add client access policies for training data
-- This allows clients to view their assigned training programs and exercises

-- Add client access policy for training_programs
CREATE POLICY "Clients can view their assigned programs" ON training_programs
  FOR SELECT USING (auth.uid() = client_id);

-- Add client access policy for training_days
CREATE POLICY "Clients can view training days for their programs" ON training_days
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM training_programs 
      WHERE training_programs.id = training_days.cycle_id 
      AND training_programs.client_id = auth.uid()
    )
  );

-- Add client access policy for exercises
CREATE POLICY "Clients can view exercises for their training days" ON exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM training_days 
      JOIN training_programs ON training_programs.id = training_days.cycle_id
      WHERE training_days.id = exercises.training_day_id 
      AND training_programs.client_id = auth.uid()
    )
  );
```

## How to Apply
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the SQL commands above
4. Run the commands
5. Refresh your application

## What This Does
- Allows clients to view their assigned training programs
- Allows clients to view training days for their programs
- Allows clients to view exercises for their training days
- Maintains security by only allowing access to data assigned to the authenticated client

## Alternative: Use Supabase CLI
If you have Supabase CLI installed, you can run:
```bash
supabase db reset --linked
```
Then apply the migration files.
