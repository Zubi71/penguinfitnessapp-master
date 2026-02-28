# Test Database Connection

After running the SQL fixes, test the connection:

## Step 1: Run the SQL Scripts

1. **Run `fix-rls-permissions.sql`** in Supabase SQL Editor
2. **Run `add-sample-data.sql`** in Supabase SQL Editor (optional)

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

## Step 3: Test the App

1. **Go to Dashboard → Community Events**
2. **Try creating a new event**
3. **Check browser console** - no more 403 errors

## If Still Getting Errors

1. **Check browser console** for specific error messages
2. **Verify you're logged in as trainer/admin**
3. **Make sure the SQL scripts ran successfully**

The 403 "permission denied for table users" error should be resolved!
