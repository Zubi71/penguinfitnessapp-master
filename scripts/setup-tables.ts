import { createClient } from '@supabase/supabase-js'

// This script sets up the trainer tables in your Supabase database
// Run this once to create the necessary tables

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for admin operations

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupTrainerTables() {
  console.log('Setting up trainer tables...')

  // Read the SQL file and execute it
  const sqlCommands = `
    -- Create clients table for trainer page
    CREATE TABLE IF NOT EXISTS clients (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_clients_trainer_id ON clients(trainer_id);
    CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
    CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

    -- Enable Row Level Security
    ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

    -- Create training cycles table
    CREATE TABLE IF NOT EXISTS training_cycles (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      client_id TEXT NOT NULL,
      trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      start_date DATE NOT NULL,
      end_date DATE,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'paused')),
      weeks INTEGER DEFAULT 4,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_training_cycles_client_id ON training_cycles(client_id);
    CREATE INDEX IF NOT EXISTS idx_training_cycles_trainer_id ON training_cycles(trainer_id);

    -- Enable RLS for training cycles
    ALTER TABLE training_cycles ENABLE ROW LEVEL SECURITY;
  `

  try {
    // Execute SQL commands
    const { error } = await supabase.rpc('exec_sql', { sql: sqlCommands })
    
    if (error) {
      console.error('Error creating tables:', error)
      return
    }

    console.log('Trainer tables created successfully!')

    // Create RLS policies
    await createPolicies()

  } catch (error) {
    console.error('Error setting up tables:', error)
  }
}

async function createPolicies() {
  console.log('Creating RLS policies...')

  const policies = [
    {
      table: 'clients',
      policy: 'Trainers can view their own clients',
      definition: 'FOR SELECT USING (auth.uid() = trainer_id)'
    },
    {
      table: 'clients', 
      policy: 'Trainers can insert their own clients',
      definition: 'FOR INSERT WITH CHECK (auth.uid() = trainer_id)'
    },
    {
      table: 'clients',
      policy: 'Trainers can update their own clients', 
      definition: 'FOR UPDATE USING (auth.uid() = trainer_id)'
    },
    {
      table: 'clients',
      policy: 'Trainers can delete their own clients',
      definition: 'FOR DELETE USING (auth.uid() = trainer_id)'
    },
    {
      table: 'training_cycles',
      policy: 'Trainers can manage their training cycles',
      definition: 'FOR ALL USING (auth.uid() = trainer_id)'
    }
  ]

  for (const policy of policies) {
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `CREATE POLICY IF NOT EXISTS "${policy.policy}" ON ${policy.table} ${policy.definition};`
      })
      
      if (error) {
        console.error(`Error creating policy for ${policy.table}:`, error)
      } else {
        console.log(`✓ Created policy: ${policy.policy}`)
      }
    } catch (error) {
      console.error(`Error creating policy for ${policy.table}:`, error)
    }
  }

  console.log('RLS policies setup complete!')
}

// Run the setup
setupTrainerTables()
