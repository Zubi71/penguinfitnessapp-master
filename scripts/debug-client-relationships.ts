import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugClientRelationships() {
  console.log('🔍 Debugging client relationships...')

  try {
    // 1. Check if the relationship table exists
    console.log('\n1. Checking if client_trainer_relationships table exists...')
    const { data: tableCheck, error: tableError } = await supabase
      .from('client_trainer_relationships')
      .select('count')
      .limit(1)

    if (tableError) {
      console.log('❌ Table does not exist or error:', tableError)
      
      // Create the table if it doesn't exist
      console.log('\n🛠️ Creating client_trainer_relationships table...')
      await createRelationshipTable()
    } else {
      console.log('✅ Table exists')
    }

    // 2. Check existing clients
    console.log('\n2. Checking existing clients...')
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, first_name, last_name, email, trainer_id')
      .limit(5)

    if (clientsError) {
      console.log('❌ Error fetching clients:', clientsError)
    } else {
      console.log('📋 Existing clients:', clients)
    }

    // 3. Check relationships
    console.log('\n3. Checking relationships...')
    const { data: relationships, error: relationshipsError } = await supabase
      .from('client_trainer_relationships')
      .select('*')
      .limit(5)

    if (relationshipsError) {
      console.log('❌ Error fetching relationships:', relationshipsError)
    } else {
      console.log('🔗 Existing relationships:', relationships)
    }

    // 4. Test the specific client that's failing
    const clientId = '7ef22c9c-96fe-425c-9ae4-a116c8cb3109'
    const trainerId = '56b74cd5-2ef5-4ae0-9d78-078fd7b11a07'
    
    console.log(`\n4. Testing specific client: ${clientId}`)
    console.log(`   Trainer ID: ${trainerId}`)

    // Check if client exists
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (clientError) {
      console.log('❌ Client not found:', clientError)
    } else {
      console.log('✅ Client found:', client)
    }

    // Check relationship
    const { data: relationship, error: relError } = await supabase
      .from('client_trainer_relationships')
      .select('*')
      .eq('client_id', clientId)
      .eq('trainer_id', trainerId)
      .single()

    if (relError) {
      console.log('❌ Relationship not found:', relError)
      
      // Create the relationship if it doesn't exist
      if (client) {
        console.log('🛠️ Creating missing relationship...')
        await createMissingRelationship(clientId, trainerId)
      }
    } else {
      console.log('✅ Relationship found:', relationship)
    }

  } catch (error) {
    console.error('❌ Debug error:', error)
  }
}

async function createRelationshipTable() {
  const sqlCommands = `
    -- Create the junction table for client-trainer relationships
    CREATE TABLE IF NOT EXISTS client_trainer_relationships (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
      trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
      is_primary BOOLEAN DEFAULT false,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
      notes TEXT,
      UNIQUE(client_id, trainer_id)
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_client_trainer_client_id ON client_trainer_relationships(client_id);
    CREATE INDEX IF NOT EXISTS idx_client_trainer_trainer_id ON client_trainer_relationships(trainer_id);
    CREATE INDEX IF NOT EXISTS idx_client_trainer_status ON client_trainer_relationships(status);
    CREATE INDEX IF NOT EXISTS idx_client_trainer_primary ON client_trainer_relationships(is_primary);

    -- Enable RLS
    ALTER TABLE client_trainer_relationships ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies
    CREATE POLICY IF NOT EXISTS "Trainers can view their client relationships" ON client_trainer_relationships
      FOR SELECT USING (auth.uid() = trainer_id);

    CREATE POLICY IF NOT EXISTS "Trainers can insert their client relationships" ON client_trainer_relationships
      FOR INSERT WITH CHECK (auth.uid() = trainer_id);

    CREATE POLICY IF NOT EXISTS "Trainers can update their client relationships" ON client_trainer_relationships
      FOR UPDATE USING (auth.uid() = trainer_id);

    CREATE POLICY IF NOT EXISTS "Trainers can delete their client relationships" ON client_trainer_relationships
      FOR DELETE USING (auth.uid() = trainer_id);
  `

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: sqlCommands })
    if (error) {
      console.log('❌ Error creating table:', error)
    } else {
      console.log('✅ Table created successfully')
    }
  } catch (error) {
    console.log('❌ Error in createRelationshipTable:', error)
  }
}

async function createMissingRelationship(clientId: string, trainerId: string) {
  try {
    const { data, error } = await supabase
      .from('client_trainer_relationships')
      .insert({
        client_id: clientId,
        trainer_id: trainerId,
        is_primary: true,
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      console.log('❌ Error creating relationship:', error)
    } else {
      console.log('✅ Relationship created:', data)
    }
  } catch (error) {
    console.log('❌ Error in createMissingRelationship:', error)
  }
}

// Run the debug
debugClientRelationships()
  .then(() => {
    console.log('\n🎉 Debug completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Debug failed:', error)
    process.exit(1)
  }) 