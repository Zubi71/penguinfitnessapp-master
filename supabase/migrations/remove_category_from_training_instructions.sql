-- Remove category column from training_instructions table if it exists
-- This fixes the NOT NULL constraint error when creating instructions

-- First, check if the column exists and drop it
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'training_instructions' 
        AND column_name = 'category'
    ) THEN
        ALTER TABLE training_instructions DROP COLUMN category;
        RAISE NOTICE 'Category column removed from training_instructions table';
    ELSE
        RAISE NOTICE 'Category column does not exist in training_instructions table';
    END IF;
END $$;
