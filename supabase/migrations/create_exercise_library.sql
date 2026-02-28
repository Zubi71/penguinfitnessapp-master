-- Create exercise library table for predefined exercises
CREATE TABLE IF NOT EXISTS exercise_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  equipment TEXT,
  muscle_groups TEXT[],
  description TEXT,
  instructions TEXT,
  default_sets INTEGER DEFAULT 3,
  default_reps TEXT,
  default_rest_time TEXT DEFAULT '60s',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_exercise_library_name ON exercise_library(name);
CREATE INDEX IF NOT EXISTS idx_exercise_library_category ON exercise_library(category);
CREATE INDEX IF NOT EXISTS idx_exercise_library_muscle_groups ON exercise_library USING GIN(muscle_groups);

-- Enable RLS
ALTER TABLE exercise_library ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - allow everyone to read exercise library
CREATE POLICY "Anyone can read exercise library" ON exercise_library
  FOR SELECT USING (true);

-- Only allow authenticated users to modify (admins/trainers can add new exercises)
CREATE POLICY "Authenticated users can manage exercise library" ON exercise_library
  FOR ALL USING (auth.role() = 'authenticated');

-- Insert predefined exercises
INSERT INTO exercise_library (name, category, subcategory, equipment, muscle_groups, default_reps, default_rest_time) VALUES
-- Chest Exercises
('Push-ups (standard)', 'Chest', 'Push-ups', 'Bodyweight', ARRAY['chest', 'triceps', 'shoulders'], '8-12', '60s'),
('Push-ups (wide)', 'Chest', 'Push-ups', 'Bodyweight', ARRAY['chest', 'shoulders'], '8-12', '60s'),
('Push-ups (diamond)', 'Chest', 'Push-ups', 'Bodyweight', ARRAY['chest', 'triceps'], '8-12', '60s'),
('Incline push-ups', 'Chest', 'Push-ups', 'Bodyweight', ARRAY['chest', 'shoulders'], '10-15', '60s'),
('Decline push-ups', 'Chest', 'Push-ups', 'Bodyweight', ARRAY['chest', 'shoulders'], '8-12', '60s'),
('Bench press (flat)', 'Chest', 'Press', 'Barbell/Dumbbell', ARRAY['chest', 'triceps', 'shoulders'], '8-12', '90s'),
('Bench press (incline)', 'Chest', 'Press', 'Barbell/Dumbbell', ARRAY['chest', 'shoulders'], '8-12', '90s'),
('Bench press (decline)', 'Chest', 'Press', 'Barbell/Dumbbell', ARRAY['chest', 'triceps'], '8-12', '90s'),
('Dumbbell press (flat)', 'Chest', 'Press', 'Dumbbell', ARRAY['chest', 'triceps', 'shoulders'], '8-12', '90s'),
('Dumbbell press (incline)', 'Chest', 'Press', 'Dumbbell', ARRAY['chest', 'shoulders'], '8-12', '90s'),
('Dumbbell press (decline)', 'Chest', 'Press', 'Dumbbell', ARRAY['chest', 'triceps'], '8-12', '90s'),
('Chest flyes (dumbbell)', 'Chest', 'Flyes', 'Dumbbell', ARRAY['chest'], '10-15', '60s'),
('Chest flyes (cable)', 'Chest', 'Flyes', 'Cable', ARRAY['chest'], '10-15', '60s'),
('Chest press machine', 'Chest', 'Machine', 'Machine', ARRAY['chest', 'triceps'], '8-12', '60s'),
('Incline chest press machine', 'Chest', 'Machine', 'Machine', ARRAY['chest', 'shoulders'], '8-12', '60s'),
('Decline chest press machine', 'Chest', 'Machine', 'Machine', ARRAY['chest', 'triceps'], '8-12', '60s'),
('Pec deck (machine fly)', 'Chest', 'Machine', 'Machine', ARRAY['chest'], '10-15', '60s'),
('Cable crossover', 'Chest', 'Cable', 'Cable', ARRAY['chest'], '10-15', '60s'),
('Resistance band chest press', 'Chest', 'Resistance Band', 'Resistance Band', ARRAY['chest', 'triceps'], '12-15', '45s'),
('Resistance band fly', 'Chest', 'Resistance Band', 'Resistance Band', ARRAY['chest'], '12-15', '45s'),

-- Back Exercises
('Pull-ups (wide)', 'Back', 'Pull-ups', 'Bodyweight', ARRAY['back', 'biceps'], '5-10', '90s'),
('Pull-ups (chin-up)', 'Back', 'Pull-ups', 'Bodyweight', ARRAY['back', 'biceps'], '5-10', '90s'),
('Pull-ups (neutral grip)', 'Back', 'Pull-ups', 'Bodyweight', ARRAY['back', 'biceps'], '5-10', '90s'),
('Inverted rows', 'Back', 'Rows', 'Bodyweight', ARRAY['back', 'biceps'], '8-12', '60s'),
('Barbell rows', 'Back', 'Rows', 'Barbell', ARRAY['back', 'biceps'], '8-12', '90s'),
('Dumbbell rows', 'Back', 'Rows', 'Dumbbell', ARRAY['back', 'biceps'], '8-12', '60s'),
('Deadlifts (conventional)', 'Back', 'Deadlifts', 'Barbell', ARRAY['back', 'glutes', 'hamstrings'], '5-8', '120s'),
('Deadlifts (Romanian)', 'Back', 'Deadlifts', 'Barbell/Dumbbell', ARRAY['back', 'glutes', 'hamstrings'], '8-12', '90s'),
('T-bar rows', 'Back', 'Rows', 'T-Bar', ARRAY['back', 'biceps'], '8-12', '90s'),
('Lat pulldown', 'Back', 'Machine', 'Cable Machine', ARRAY['back', 'biceps'], '8-12', '60s'),
('Lat pulldown (wide grip)', 'Back', 'Machine', 'Cable Machine', ARRAY['back', 'biceps'], '8-12', '60s'),
('Lat pulldown (reverse grip)', 'Back', 'Machine', 'Cable Machine', ARRAY['back', 'biceps'], '8-12', '60s'),
('Seated row machine', 'Back', 'Machine', 'Cable Machine', ARRAY['back', 'biceps'], '8-12', '60s'),
('Seated row (close grip)', 'Back', 'Machine', 'Cable Machine', ARRAY['back', 'biceps'], '8-12', '60s'),
('Seated row (wide grip)', 'Back', 'Machine', 'Cable Machine', ARRAY['back', 'biceps'], '8-12', '60s'),
('Assisted pull-up machine', 'Back', 'Machine', 'Machine', ARRAY['back', 'biceps'], '8-12', '60s'),
('Cable row machine', 'Back', 'Machine', 'Cable Machine', ARRAY['back', 'biceps'], '8-12', '60s'),
('Back extension machine', 'Back', 'Machine', 'Machine', ARRAY['back', 'glutes'], '10-15', '60s'),
('Resistance band rows', 'Back', 'Resistance Band', 'Resistance Band', ARRAY['back', 'biceps'], '12-15', '45s'),
('Band pulldowns', 'Back', 'Resistance Band', 'Resistance Band', ARRAY['back', 'biceps'], '12-15', '45s'),

-- Shoulder Exercises
('Pike push-ups', 'Shoulders', 'Push-ups', 'Bodyweight', ARRAY['shoulders', 'triceps'], '8-12', '60s'),
('Handstand push-ups', 'Shoulders', 'Push-ups', 'Bodyweight', ARRAY['shoulders', 'triceps'], '3-8', '90s'),
('Overhead press (barbell)', 'Shoulders', 'Press', 'Barbell', ARRAY['shoulders', 'triceps'], '8-12', '90s'),
('Overhead press (dumbbell)', 'Shoulders', 'Press', 'Dumbbell', ARRAY['shoulders', 'triceps'], '8-12', '90s'),
('Arnold press', 'Shoulders', 'Press', 'Dumbbell', ARRAY['shoulders', 'triceps'], '8-12', '90s'),
('Lateral raises', 'Shoulders', 'Raises', 'Dumbbell', ARRAY['shoulders'], '12-15', '45s'),
('Front raises', 'Shoulders', 'Raises', 'Dumbbell', ARRAY['shoulders'], '12-15', '45s'),
('Rear delt flyes', 'Shoulders', 'Flyes', 'Dumbbell', ARRAY['shoulders'], '12-15', '45s'),
('Upright rows', 'Shoulders', 'Rows', 'Barbell/Dumbbell', ARRAY['shoulders', 'traps'], '10-12', '60s'),
('Shoulder press machine', 'Shoulders', 'Machine', 'Machine', ARRAY['shoulders', 'triceps'], '8-12', '60s'),
('Cable lateral raises', 'Shoulders', 'Cable', 'Cable', ARRAY['shoulders'], '12-15', '45s'),
('Rear delt fly machine', 'Shoulders', 'Machine', 'Machine', ARRAY['shoulders'], '12-15', '45s'),
('Band lateral raises', 'Shoulders', 'Resistance Band', 'Resistance Band', ARRAY['shoulders'], '15-20', '30s'),
('Band front raises', 'Shoulders', 'Resistance Band', 'Resistance Band', ARRAY['shoulders'], '15-20', '30s'),
('Band overhead press', 'Shoulders', 'Resistance Band', 'Resistance Band', ARRAY['shoulders', 'triceps'], '12-15', '45s'),

-- Bicep Exercises
('Chin-ups', 'Arms', 'Biceps', 'Bodyweight', ARRAY['biceps', 'back'], '5-10', '90s'),
('Isometric towel curls', 'Arms', 'Biceps', 'Towel', ARRAY['biceps'], '30s hold', '60s'),
('Barbell curls', 'Arms', 'Biceps', 'Barbell', ARRAY['biceps'], '8-12', '60s'),
('Dumbbell curls (standard)', 'Arms', 'Biceps', 'Dumbbell', ARRAY['biceps'], '8-12', '60s'),
('Dumbbell curls (hammer)', 'Arms', 'Biceps', 'Dumbbell', ARRAY['biceps', 'forearms'], '8-12', '60s'),
('Dumbbell curls (concentration)', 'Arms', 'Biceps', 'Dumbbell', ARRAY['biceps'], '8-12', '60s'),
('Dumbbell curls (preacher)', 'Arms', 'Biceps', 'Dumbbell', ARRAY['biceps'], '8-12', '60s'),
('Zottman curls', 'Arms', 'Biceps', 'Dumbbell', ARRAY['biceps', 'forearms'], '8-12', '60s'),
('Cable curls', 'Arms', 'Biceps', 'Cable', ARRAY['biceps'], '10-15', '45s'),
('Cable bicep curls (low pulley)', 'Arms', 'Biceps', 'Cable', ARRAY['biceps'], '10-15', '45s'),
('Dual cable curls', 'Arms', 'Biceps', 'Cable', ARRAY['biceps'], '10-15', '45s'),
('Preacher curl machine', 'Arms', 'Biceps', 'Machine', ARRAY['biceps'], '8-12', '60s'),
('Resistance band curls', 'Arms', 'Biceps', 'Resistance Band', ARRAY['biceps'], '15-20', '30s'),

-- Tricep Exercises
('Dips', 'Arms', 'Triceps', 'Bodyweight', ARRAY['triceps', 'chest'], '8-15', '60s'),
('Close-grip push-ups', 'Arms', 'Triceps', 'Bodyweight', ARRAY['triceps', 'chest'], '8-12', '60s'),
('Triceps kickbacks', 'Arms', 'Triceps', 'Dumbbell', ARRAY['triceps'], '10-15', '45s'),
('Skull crushers (EZ bar)', 'Arms', 'Triceps', 'EZ Bar', ARRAY['triceps'], '8-12', '60s'),
('Skull crushers (dumbbell)', 'Arms', 'Triceps', 'Dumbbell', ARRAY['triceps'], '8-12', '60s'),
('Overhead triceps extensions', 'Arms', 'Triceps', 'Dumbbell', ARRAY['triceps'], '8-12', '60s'),
('Triceps pushdowns (cable)', 'Arms', 'Triceps', 'Cable', ARRAY['triceps'], '10-15', '45s'),
('Overhead triceps extension (cable)', 'Arms', 'Triceps', 'Cable', ARRAY['triceps'], '10-15', '45s'),
('Dip machine', 'Arms', 'Triceps', 'Machine', ARRAY['triceps', 'chest'], '8-12', '60s'),
('Assisted dips', 'Arms', 'Triceps', 'Machine', ARRAY['triceps', 'chest'], '8-12', '60s'),
('Resistance band triceps extensions', 'Arms', 'Triceps', 'Resistance Band', ARRAY['triceps'], '15-20', '30s'),

-- Leg Exercises
('Squats', 'Legs', 'Squats', 'Bodyweight', ARRAY['quads', 'glutes'], '10-15', '60s'),
('Lunges (forward)', 'Legs', 'Lunges', 'Bodyweight', ARRAY['quads', 'glutes'], '10-12 each leg', '60s'),
('Lunges (reverse)', 'Legs', 'Lunges', 'Bodyweight', ARRAY['quads', 'glutes'], '10-12 each leg', '60s'),
('Lunges (walking)', 'Legs', 'Lunges', 'Bodyweight', ARRAY['quads', 'glutes'], '10-12 each leg', '60s'),
('Glute bridges', 'Legs', 'Glutes', 'Bodyweight', ARRAY['glutes', 'hamstrings'], '15-20', '45s'),
('Step-ups', 'Legs', 'Step-ups', 'Bodyweight', ARRAY['quads', 'glutes'], '10-12 each leg', '60s'),
('Wall sits', 'Legs', 'Isometric', 'Bodyweight', ARRAY['quads', 'glutes'], '30-60s hold', '60s'),
('Barbell back squat', 'Legs', 'Squats', 'Barbell', ARRAY['quads', 'glutes'], '8-12', '90s'),
('Front squat', 'Legs', 'Squats', 'Barbell', ARRAY['quads', 'core'], '8-12', '90s'),
('Dumbbell goblet squat', 'Legs', 'Squats', 'Dumbbell', ARRAY['quads', 'glutes'], '10-15', '60s'),
('Romanian deadlifts', 'Legs', 'Deadlifts', 'Barbell/Dumbbell', ARRAY['hamstrings', 'glutes'], '8-12', '90s'),
('Bulgarian split squats', 'Legs', 'Squats', 'Bodyweight/Dumbbell', ARRAY['quads', 'glutes'], '8-12 each leg', '60s'),
('Leg press', 'Legs', 'Machine', 'Machine', ARRAY['quads', 'glutes'], '10-15', '60s'),
('Hack squat machine', 'Legs', 'Machine', 'Machine', ARRAY['quads', 'glutes'], '10-15', '60s'),
('Smith machine squats', 'Legs', 'Machine', 'Smith Machine', ARRAY['quads', 'glutes'], '10-15', '60s'),
('Leg curl machine (lying)', 'Legs', 'Machine', 'Machine', ARRAY['hamstrings'], '10-15', '45s'),
('Leg curl machine (seated)', 'Legs', 'Machine', 'Machine', ARRAY['hamstrings'], '10-15', '45s'),
('Leg extension machine', 'Legs', 'Machine', 'Machine', ARRAY['quads'], '10-15', '45s'),
('Glute kickback machine', 'Legs', 'Machine', 'Machine', ARRAY['glutes'], '12-15 each leg', '45s'),
('Resistance band squats', 'Legs', 'Resistance Band', 'Resistance Band', ARRAY['quads', 'glutes'], '15-20', '45s'),
('Resistance band lunges', 'Legs', 'Resistance Band', 'Resistance Band', ARRAY['quads', 'glutes'], '12-15 each leg', '45s'),
('Band leg curls', 'Legs', 'Resistance Band', 'Resistance Band', ARRAY['hamstrings'], '15-20', '30s'),

-- Calf Exercises
('Standing calf raises', 'Calves', 'Calf Raises', 'Bodyweight', ARRAY['calves'], '15-20', '45s'),
('Seated calf raises', 'Calves', 'Calf Raises', 'Bodyweight', ARRAY['calves'], '15-20', '45s'),
('Weighted calf raises (dumbbell)', 'Calves', 'Calf Raises', 'Dumbbell', ARRAY['calves'], '12-15', '45s'),
('Weighted calf raises (barbell)', 'Calves', 'Calf Raises', 'Barbell', ARRAY['calves'], '12-15', '45s'),
('Calf raise machine (standing)', 'Calves', 'Machine', 'Machine', ARRAY['calves'], '12-15', '45s'),
('Calf raise machine (seated)', 'Calves', 'Machine', 'Machine', ARRAY['calves'], '12-15', '45s'),
('Leg press calf press', 'Calves', 'Machine', 'Leg Press Machine', ARRAY['calves'], '15-20', '45s'),
('Resistance band calf extension', 'Calves', 'Resistance Band', 'Resistance Band', ARRAY['calves'], '20-25', '30s'),

-- Core/Abs Exercises
('Crunches', 'Core', 'Crunches', 'Bodyweight', ARRAY['abs'], '15-25', '45s'),
('Planks (front)', 'Core', 'Planks', 'Bodyweight', ARRAY['abs', 'core'], '30-60s hold', '60s'),
('Planks (side)', 'Core', 'Planks', 'Bodyweight', ARRAY['abs', 'obliques'], '30-45s each side', '60s'),
('Leg raises', 'Core', 'Leg Raises', 'Bodyweight', ARRAY['abs', 'hip flexors'], '10-15', '45s'),
('Flutter kicks', 'Core', 'Dynamic', 'Bodyweight', ARRAY['abs', 'hip flexors'], '20-30', '45s'),
('Mountain climbers', 'Core', 'Dynamic', 'Bodyweight', ARRAY['abs', 'cardio'], '20-30', '45s'),
('Bicycle crunches', 'Core', 'Crunches', 'Bodyweight', ARRAY['abs', 'obliques'], '20-30', '45s'),
('Weighted sit-ups', 'Core', 'Sit-ups', 'Weight Plate', ARRAY['abs'], '10-15', '60s'),
('Russian twists', 'Core', 'Twists', 'Bodyweight/Weight', ARRAY['abs', 'obliques'], '20-30', '45s'),
('Dumbbell side bends', 'Core', 'Side Bends', 'Dumbbell', ARRAY['obliques'], '15-20 each side', '45s'),
('Cable crunches', 'Core', 'Machine', 'Cable', ARRAY['abs'], '15-20', '45s'),
('Cable rope crunch', 'Core', 'Machine', 'Cable', ARRAY['abs'], '15-20', '45s'),
('Ab roller', 'Core', 'Equipment', 'Ab Roller', ARRAY['abs', 'core'], '8-15', '60s'),
('Ab crunch machine', 'Core', 'Machine', 'Machine', ARRAY['abs'], '12-20', '45s'),
('Rotary torso machine', 'Core', 'Machine', 'Machine', ARRAY['obliques'], '12-15 each side', '45s'),
('Seated ab rotation machine', 'Core', 'Machine', 'Machine', ARRAY['obliques'], '12-15 each side', '45s'),
('Resistance band crunches', 'Core', 'Resistance Band', 'Resistance Band', ARRAY['abs'], '15-25', '30s');

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_exercise_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_exercise_library_updated_at 
BEFORE UPDATE ON exercise_library 
FOR EACH ROW EXECUTE FUNCTION update_exercise_library_updated_at();
