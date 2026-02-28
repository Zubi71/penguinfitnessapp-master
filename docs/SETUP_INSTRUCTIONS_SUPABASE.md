# Database Setup Instructions

## Required Steps to Fix Training Day Errors

You're getting database errors because the required tables don't exist yet. Follow these steps:

### 1. Open Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Log in to your account
3. Select your project

### 2. Run the Database Schema
1. In your Supabase dashboard, click on **"SQL Editor"** in the left sidebar
2. Click **"New Query"**
3. Copy the entire contents of the file `complete_training_schema.sql`
4. Paste it into the SQL editor
5. Click **"Run"** button (or press Ctrl+Enter)

### 3. Add Status Completion Feature (IMPORTANT)
1. After running the main schema, run the additional script:
2. Copy the contents of `add_training_day_status.sql`
3. Paste it into a new SQL query and run it
4. This adds completion tracking to training days

### 4. Verify Tables Were Created
After running the scripts, you should see these tables in your database:
- `training_programs` (already exists)
- `training_days` (newly created with status fields)
- `exercises` (newly created)

### 5. Check Tables in Database
1. Click on **"Table Editor"** in the left sidebar
2. You should see all three tables listed
3. Click on `training_days` table to verify it has these columns:
   - `status` (with values: 'pending', 'completed')
   - `completed_at` (timestamp)

### 6. Test the Application
Once the tables are created:
1. Go back to your application
2. Try creating a training cycle
3. Try adding days to a week
4. Try marking days as completed
5. The errors should be resolved

## New Features Added

### Day Completion Status
- Trainers can mark training days as completed
- Completion date is tracked
- Visual indicators show completed vs pending days
- Week completion status based on all days being completed

## If You Still Get Errors

If you continue to see errors after running the schema:

1. **Check RLS Policies**: Make sure you're logged in as a trainer
2. **Verify User Role**: Ensure your user has the 'trainer' role in the database
3. **Check Browser Console**: Look for more detailed error messages
4. **Contact Support**: If the issue persists, check your Supabase project logs

## File Locations
- Main schema: `supabase/complete_training_schema.sql`
- Status fields: `supabase/add_training_day_status.sql`
