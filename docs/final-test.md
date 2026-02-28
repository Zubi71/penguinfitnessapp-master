# Final Test Guide

After running the SQL fixes, test everything:

## Step 1: Run the SQL Script

1. **Copy and paste `fix-all-policies.sql`** into Supabase SQL Editor
2. **Click "Run"** - this will drop all existing policies and recreate them
3. **Verify no errors** in the output

## Step 2: Test the API

Visit: `http://localhost:3000/api/community-events`

**Expected Response:**
```json
{
  "events": [
    {
      "id": "...",
      "title": "Morning Yoga Session",
      "description": "...",
      "event_date": "2024-01-XX",
      "start_time": "07:00:00",
      "end_time": "08:00:00",
      "location": "Main Studio",
      "event_type": "workshop",
      "difficulty_level": "all",
      "price": "15.00",
      "status": "active",
      "is_featured": false,
      "created_by": "...",
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

## Step 3: Test the Dashboard

1. **Go to Dashboard → Community Events**
2. **Try creating a new event**
3. **Check browser console** - should see no errors

## Step 4: Test the Client Page

1. **Go to Client → Community Events**
2. **Try registering for an event**
3. **Check browser console** - should see no errors

## Expected Results

✅ **No more 403 errors**  
✅ **No more "permission denied for table users"**  
✅ **No more Dialog warnings**  
✅ **Can create events as trainer/admin**  
✅ **Can view events as client**  
✅ **Can register for events as client**  

## If Still Having Issues

1. **Check browser console** for specific error messages
2. **Verify you're logged in with correct role** (trainer/admin for dashboard, client for client page)
3. **Make sure the SQL script ran successfully**
4. **Try refreshing the page** after running the SQL

All permission issues should now be resolved!
