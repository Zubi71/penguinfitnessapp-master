# Exercise Library Setup Instructions

## New Feature: Exercise Search and Library

This update adds a searchable exercise library with over 100 predefined exercises that trainers can use when creating training programs.

## Setup Required

### 1. Run the Exercise Library Migration

You need to run the SQL migration to create the exercise library table and populate it with exercises.

#### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy the entire contents of `supabase/migrations/create_exercise_library.sql`
6. Paste it into the SQL editor
7. Click "Run" (or press Ctrl+Enter)

#### Option B: Using Supabase CLI
If you have Supabase CLI installed:
```bash
supabase db push
```

### 2. Verify Installation

After running the migration, you should see:
- A new `exercise_library` table in your database
- 100+ exercises populated in the table
- Categories like: Chest, Back, Shoulders, Arms, Legs, Calves, Core

## How It Works

### For Trainers:
1. When adding exercises to a training day, trainers now see two options:
   - **Search Library**: Search from 100+ predefined exercises
   - **Custom Exercise**: Create a custom exercise manually

2. **Search Features**:
   - Search by exercise name (e.g., "push-ups", "squats")
   - Filter by category (Chest, Back, Shoulders, etc.)
   - See muscle groups, equipment, and default sets/reps
   - Auto-populate form fields when selecting an exercise

3. **Exercise Categories Available**:
   - 🔵 **Chest**: Push-ups, bench press, flyes, etc.
   - 🔴 **Back**: Pull-ups, rows, deadlifts, lat pulldowns, etc.
   - 🟡 **Shoulders**: Overhead press, lateral raises, etc.
   - 🟢 **Arms**: Bicep curls, tricep dips, etc.
   - 🟤 **Legs**: Squats, lunges, leg press, etc.
   - ⚪ **Calves**: Calf raises, calf press, etc.
   - 🟣 **Core**: Planks, crunches, Russian twists, etc.

### Exercise Data Included:
- Exercise name and variations
- Category and subcategory
- Equipment needed
- Primary muscle groups
- Default sets, reps, and rest time
- Machine exercises for gym equipment

## Benefits

1. **Faster Workout Creation**: Trainers can quickly find and add exercises
2. **Consistency**: Standardized exercise names and parameters
3. **Professional**: Comprehensive library covers all major movements
4. **Flexible**: Still allows custom exercises when needed
5. **Equipment Variety**: Supports bodyweight, free weights, machines, and resistance bands

## File Locations

- Migration file: `supabase/migrations/create_exercise_library.sql`
- API endpoint: `app/api/exercises/search/route.ts`
- Search component: `components/exercises/ExerciseSearch.tsx`
- Updated page: `app/trainer/.../page.tsx`

## Troubleshooting

If you encounter issues:

1. **Table already exists error**: The migration includes `IF NOT EXISTS` clauses, so it's safe to run multiple times
2. **Permission errors**: Make sure you're using the Supabase dashboard with admin access
3. **Search not working**: Check that the API route is properly deployed
4. **No exercises showing**: Verify the exercise_library table was populated with data

## Adding More Exercises

To add more exercises to the library:

1. Use the Supabase dashboard to insert new rows into `exercise_library` table
2. Or modify the migration file and re-run it
3. Or create an admin interface for managing exercises (future enhancement)

## API Usage

The search API endpoint supports these parameters:
- `q`: Search query (exercise name)
- `category`: Filter by category
- `limit`: Maximum results (default: 20)

Example: `/api/exercises/search?q=push&category=Chest&limit=10`
