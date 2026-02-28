# Community Events Setup Guide

## 🚨 IMPORTANT: Follow these steps in order to fix the current errors

### Step 1: Database Setup

1. **Go to your Supabase Dashboard**
   - Navigate to your project
   - Go to the SQL Editor

2. **Run the Database Migration**
   - Copy the contents of `scripts/setup-community-events.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the script

3. **Verify Tables Created**
   - Go to Table Editor in Supabase
   - You should see two new tables:
     - `community_events`
     - `community_event_participants`

### Step 2: Test Database Connection

1. **Test the API endpoint**
   - Visit: `http://localhost:3000/api/test-community-events`
   - You should see a JSON response indicating if tables exist

2. **Expected Response:**
   ```json
   {
     "success": true,
     "tables": {
       "community_events": {
         "exists": true,
         "error": null
       },
       "community_event_participants": {
         "exists": true,
         "error": null
       }
     },
     "message": "Community events database test completed"
   }
   ```

### Step 3: Authentication Fixes Applied

The following fixes have been applied to resolve authentication issues:

1. **Updated `lib/auth-utils.ts`:**
   - Added community events routes to `STAFF_ROUTES`
   - Added client community events to `CLIENT_ROUTES`
   - Added event registration to `AUTHENTICATED_ROUTES`

2. **Updated `middleware.ts`:**
   - Fixed API route handling
   - Added proper authentication for protected API routes
   - Added test endpoint to public routes

3. **Updated `lib/server-auth-guard.ts`:**
   - Removed API route skipping
   - Now properly handles API authentication

### Step 4: Test the Feature

1. **Test as Trainer/Admin:**
   - Login as a trainer or admin
   - Navigate to Dashboard → Community Events
   - Try to create a new event
   - Verify you can see the events list

2. **Test as Client:**
   - Login as a client
   - Navigate to Client Portal → Community Events
   - Verify you can see active events
   - Try to register for an event

### Step 5: Troubleshooting

If you still see errors:

1. **Check Database Tables:**
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_name IN ('community_events', 'community_event_participants');
   ```

2. **Check RLS Policies:**
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename IN ('community_events', 'community_event_participants');
   ```

3. **Test Authentication:**
   - Visit `/api/auth/me` to verify your authentication status
   - Check browser console for any JavaScript errors

4. **Check Network Tab:**
   - Open browser dev tools
   - Go to Network tab
   - Try to access community events pages
   - Look for failed API requests

### Common Issues and Solutions

1. **"Error fetching events: {}"**
   - **Cause:** Database tables don't exist
   - **Solution:** Run the SQL migration script

2. **"Unauthorized" errors**
   - **Cause:** Authentication middleware issues
   - **Solution:** The middleware fixes have been applied

3. **"Event not found" errors**
   - **Cause:** No sample data
   - **Solution:** The migration script includes sample events

4. **RLS Policy errors**
   - **Cause:** Row Level Security policies not working
   - **Solution:** Check user role in `user_roles` table

### Verification Checklist

- [ ] Database tables created successfully
- [ ] Test endpoint returns success
- [ ] Trainer/Admin can access community events dashboard
- [ ] Trainer/Admin can create new events
- [ ] Client can access community events page
- [ ] Client can see active events
- [ ] Client can register for events
- [ ] No console errors in browser
- [ ] All API endpoints return proper responses

### Next Steps

Once the setup is complete:

1. **Customize Events:** Modify the sample events or create new ones
2. **Add Features:** Consider adding email notifications, calendar integration
3. **Styling:** Customize the UI to match your brand
4. **Testing:** Test with multiple users and different scenarios

### Support

If you encounter issues:

1. Check the browser console for detailed error messages
2. Verify your Supabase connection settings
3. Ensure your user has the correct role assigned
4. Test the database connection using the test endpoint

The community events feature should now work properly with the authentication fixes applied!
