# Fix User Registration Database Error

## Problem
The error "Database error creating new user" occurs when trying to register new users. This is caused by Row Level Security (RLS) policies that are too restrictive and prevent user creation.

## Root Cause
1. **RLS Policies Too Restrictive**: The current RLS policies prevent users from inserting records into `user_roles` and other tables
2. **Missing Permissions**: Authenticated users don't have the necessary permissions to create their own records
3. **Service Role Issues**: The service role key might not be properly configured

## Solution

### Step 1: Apply RLS Policy Fixes
Run the SQL script to fix the RLS policies:

```sql
-- Run this in your Supabase SQL editor
\i supabase/fix_user_registration_rls.sql
```

This script will:
- Fix policies for `user_roles` table
- Fix policies for `client_signups` table  
- Fix policies for `trainers` table
- Fix policies for `instructors` table (if exists)
- Grant necessary permissions to authenticated users

### Step 2: Verify Environment Variables
Ensure these environment variables are set in your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Important**: The `SUPABASE_SERVICE_ROLE_KEY` is required for user registration to work properly.

### Step 3: Test Service Role
Test if your service role key is working:

```bash
# Visit this URL in your browser
http://localhost:3001/api/test-service-role
```

You should see:
```json
{
  "success": true,
  "message": "Service role key is working properly",
  "userCount": X,
  "canAccessDatabase": true
}
```

### Step 4: Test User Registration
After applying the fixes, try registering a new user. The registration should now work without the "Database error creating new user" error.

## What the Fix Does

### 1. **user_roles Table**
- Users can view their own role
- Users can insert their own role (for self-registration)
- Admins can manage all roles

### 2. **client_signups Table**
- Clients can view their own data
- Clients can insert their own data (for self-registration)
- Admins can manage all clients

### 3. **trainers Table**
- Trainers can view their own data
- Trainers can insert their own data (for self-registration)
- Admins can manage all trainers

### 4. **Permissions**
- Grants necessary permissions to authenticated users
- Allows service role to bypass RLS for admin operations

## Troubleshooting

### If registration still fails:

1. **Check Supabase logs** for specific error messages
2. **Verify service role key** is correct and has admin privileges
3. **Check table structure** - ensure required tables exist
4. **Test with simple user creation** first

### Common Issues:

1. **Service role key missing**: Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`
2. **RLS still enabled**: Ensure the fix script ran successfully
3. **Table permissions**: Check if tables have proper grants
4. **Foreign key constraints**: Ensure referenced tables exist

## Verification

After applying the fix, you should be able to:

✅ **Register new clients** without database errors  
✅ **Register new trainers** without database errors  
✅ **Create user roles** automatically during registration  
✅ **Access user data** based on proper RLS policies  

## Next Steps

1. Apply the RLS fix script
2. Test user registration
3. Verify feedback page works (should already be fixed)
4. Monitor for any remaining issues

The user registration should now work properly, and the feedback page should also function without the previous attendance errors.

