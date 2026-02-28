# Community Events Feature Setup

This document describes the community events feature that allows trainers/admins to create events and clients to view and register for them.

## Overview

The community events feature consists of:
- Database tables for storing events and participants
- API endpoints for CRUD operations and registration
- Admin/Trainer dashboard for managing events
- Client dashboard for viewing and registering for events

## Database Schema

### Tables Created

1. **community_events** - Stores event information
2. **community_event_participants** - Stores user registrations for events

### Key Fields

**community_events:**
- `id` - Unique identifier
- `title` - Event title
- `description` - Event description
- `event_date` - Date of the event
- `start_time` / `end_time` - Event timing
- `location` - Event location
- `max_participants` - Maximum number of participants (optional)
- `current_participants` - Current number of registered participants
- `event_type` - Type of event (community, workshop, challenge, social, competition)
- `difficulty_level` - Difficulty level (beginner, intermediate, advanced, all)
- `price` - Event price (can be free)
- `status` - Event status (active, draft, cancelled, completed)
- `is_featured` - Whether the event is featured
- `created_by` - User who created the event

**community_event_participants:**
- `id` - Unique identifier
- `event_id` - Reference to the event
- `user_id` - Reference to the user
- `status` - Registration status (registered, attended, no_show, cancelled)
- `registration_date` - When the user registered

## API Endpoints

### Main Events API
- `GET /api/community-events` - List all events (with filters)
- `POST /api/community-events` - Create a new event (trainer/admin only)

### Individual Event API
- `GET /api/community-events/[id]` - Get event details
- `PUT /api/community-events/[id]` - Update event (creator only)
- `DELETE /api/community-events/[id]` - Delete event (creator only)

### Registration API
- `POST /api/community-events/[id]/register` - Register for an event
- `DELETE /api/community-events/[id]/register` - Cancel registration

## Pages Created

### Admin/Trainer Dashboard
- **Location:** `/app/dashboard/community-events/page.tsx`
- **Features:**
  - View all events (including drafts and cancelled)
  - Create new events with detailed form
  - Edit existing events
  - Delete events
  - View participant counts
  - Mark events as featured

### Client Dashboard
- **Location:** `/app/client/community-events/page.tsx`
- **Features:**
  - View active events only
  - Search and filter events
  - Register for events
  - Cancel registrations
  - View event details in modal
  - See registration status

## Navigation

### Admin/Trainer Navigation
Added to the main dashboard navigation:
- Icon: Calendar Plus
- Label: "Community Events"
- Roles: admin, trainer

### Client Navigation
Added to the client layout navigation:
- Icon: Users
- Label: "Community Events"
- Accessible from client dashboard

## Setup Instructions

1. **Run Database Migration:**
   ```sql
   -- Execute the contents of supabase/community_events_schema.sql
   ```

2. **Verify API Endpoints:**
   - Test creating an event as a trainer/admin
   - Test viewing events as a client
   - Test registration functionality

3. **Check Navigation:**
   - Verify community events appears in trainer/admin navigation
   - Verify community events appears in client navigation

## Features

### Event Management (Trainer/Admin)
- ✅ Create events with title, description, date, time, location
- ✅ Set event type (community, workshop, challenge, social, competition)
- ✅ Set difficulty level (beginner, intermediate, advanced, all)
- ✅ Set price (can be free)
- ✅ Set maximum participants (optional)
- ✅ Mark events as featured
- ✅ Set event status (active, draft, cancelled, completed)
- ✅ Edit existing events
- ✅ Delete events
- ✅ View all events including drafts

### Event Discovery (Clients)
- ✅ View active events only
- ✅ Search events by title, description, or location
- ✅ Filter by event type
- ✅ Filter by difficulty level
- ✅ View event details in modal
- ✅ See participant counts and limits
- ✅ Register for events
- ✅ Cancel registrations
- ✅ See registration status

### Security & Permissions
- ✅ Row Level Security (RLS) policies
- ✅ Only trainers/admins can create events
- ✅ Only event creators can edit/delete events
- ✅ Users can only see their own registrations
- ✅ Event creators can see all participants for their events

## Usage Examples

### Creating an Event (Trainer)
1. Navigate to Dashboard → Community Events
2. Click "Create Event"
3. Fill in event details
4. Set event type and difficulty
5. Set price (if any)
6. Click "Create Event"

### Registering for an Event (Client)
1. Navigate to Client Portal → Community Events
2. Browse available events
3. Use filters to find specific events
4. Click "Register" on desired event
5. View registration confirmation

### Managing Events (Trainer)
1. Navigate to Dashboard → Community Events
2. View all created events
3. Click edit icon to modify event
4. Click delete icon to remove event
5. Monitor participant counts

## Future Enhancements

Potential improvements for the community events feature:
- Email notifications for event updates
- Calendar integration
- Event reminders
- Photo/image uploads for events
- Event categories and tags
- Recurring events
- Waitlist functionality
- Event reviews and ratings
- Social sharing
- Event templates for quick creation
