# Trainer Availability Feature Setup Guide

This guide explains how to set up the trainer availability feature that allows trainers to set their weekly availability and admins to view available trainers by day and time.

## Features

1. **Trainer View**: Trainers can set their availability for each day of the week using time ranges:
   - Enter time ranges like "5-7" (5 PM - 7 PM) or "8-9" (8 PM - 9 PM)
   - Add multiple time slots per day (e.g., "5-7" and "8-9")
   - Times default to PM if no period is specified
   - Support for formats: "5-7", "5 PM - 7 PM", "9-11 AM", etc.

2. **Admin View**: Admins can search for trainers available at specific days and times, and view all trainer schedules.

## Database Setup

### Step 1: Run the Database Schema

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the entire contents of `supabase/trainer_availability_schema.sql`
5. Click **Run** (or press Ctrl+Enter)

This will create:
- `trainer_availability` table
- Required indexes
- RLS (Row Level Security) policies
- Triggers for automatic timestamp updates

### Step 2: Run the Migration to Time Ranges (if table already exists)

If you already have the `trainer_availability` table with the old schema (constraint_type/constraint_time), run the migration:

1. In **SQL Editor**, create a **New Query**
2. Copy and paste the entire contents of `supabase/trainer_availability_migration_to_ranges.sql`
3. Click **Run**

This will:
- Add `start_time` and `end_time` columns
- Migrate existing data from constraint_type/constraint_time to time ranges
- Allow multiple time slots per day

### Step 3: Verify Table Creation

1. Go to **Table Editor** in Supabase Dashboard
2. You should see the `trainer_availability` table
3. Verify it has these columns:
   - `id` (UUID, Primary Key)
   - `trainer_id` (UUID, Foreign Key to trainers)
   - `day_of_week` (TEXT: Monday-Sunday)
   - `start_time` (TIME, nullable) - Start of availability range
   - `end_time` (TIME, nullable) - End of availability range
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

## Usage

### For Trainers

1. Log in as a trainer
2. Navigate to **Trainer Dashboard** → Click **My Availability** in Quick Actions, or use the sidebar navigation
3. For each day of the week:
   - Click **Add Slot** to add a time range
   - Enter time range in format like "5-7" or "5 PM - 7 PM"
   - Examples: "5-7" (5 PM - 7 PM), "8-9" (8 PM - 9 PM), "9-11 AM" (9 AM - 11 AM)
   - You can add multiple time slots per day
   - Click **Save** to save each slot
   - Click the **X** button to remove a slot

### For Admins

1. Log in as an admin
2. Navigate to **Dashboard** → **Trainer Availability** (in sidebar)
3. To search for available trainers:
   - Select a day of the week
   - Enter a time in 12-hour format (e.g., "5:00 PM")
   - Click **Search**
   - View the list of trainers available at that time
4. Scroll down to see all trainer schedules organized by day

## Example Scenarios

### Example 1: Trainer Jackson
- **Monday**: 5-7 (5 PM - 7 PM)
- **Tuesday**: 3-5 (3 PM - 5 PM)

### Example 2: Trainer Rayner
- **Monday**: 4-6 (4 PM - 6 PM)
- **Wednesday**: 1-2 PM (1 PM - 2 PM)
- **Saturday**: Free all day (no time range)
- **Sunday**: Free all day (no time range)

### Admin Search
- **Day**: Monday
- **Time**: 5:00 PM
- **Result**: Both Jackson (5-7) and Rayner (4-6) are shown as available since 5 PM falls within their ranges

## API Endpoints

### GET `/api/trainer-availability`
- **Trainers**: Returns their own availability
- **Admins**: Returns all trainer availability
- **Query Parameters**:
  - `day_of_week` (optional): Filter by day
  - `time` (optional, admin only): Filter by time (HH:MM format)

### POST `/api/trainer-availability`
- **Trainers only**: Create or update availability
- **Body**:
  ```json
  {
    "day_of_week": "Monday",
    "start_time": "17:00:00",
    "end_time": "19:00:00"
  }
  ```
  - `start_time` and `end_time` are in 24-hour format (HH:MM:SS)
  - Both can be null for "free all day"
  - `id` can be included to update existing slot

### DELETE `/api/trainer-availability/[id]`
- **Trainers only**: Delete a specific availability slot by ID

## Time Format

- **Input**: Time ranges in formats like:
  - "5-7" (defaults to PM: 5 PM - 7 PM)
  - "5 PM - 7 PM" (explicit 12-hour format)
  - "9-11 AM" (morning hours)
  - "5:00-7:00 PM" (with minutes)
- **Storage**: 24-hour format in database (e.g., "17:00:00", "19:00:00")
- **Display**: Converted back to 12-hour format for user display (e.g., "5:00 PM - 7:00 PM")

## Security

- RLS policies ensure trainers can only manage their own availability
- Admins can view all trainer availability
- API routes verify user authentication and roles

## Troubleshooting

### "Trainer profile not found" error
- Ensure the user has a record in the `trainers` table
- Verify the `user_id` in the `trainers` table matches the authenticated user

### Availability not showing in admin search
- Verify the time format is correct (12-hour format)
- Check that the trainer has set availability for that day
- Ensure the search time falls within the trainer's time range (e.g., searching for 5 PM will find trainers with ranges like "4-6" or "5-7")

### RLS Policy Errors
- Ensure RLS is enabled on the `trainer_availability` table
- Verify the policies were created correctly in the migration script
- Check that the user has the correct role in the `user_roles` table

