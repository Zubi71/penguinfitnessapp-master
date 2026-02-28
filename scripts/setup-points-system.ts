import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// This script sets up the points and rewards system in your Supabase database
// Run this once to create the necessary tables

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for admin operations

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupPointsSystem() {
  console.log('Setting up points and rewards system...')

  try {
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'setup_points_system.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')

    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`Found ${statements.length} SQL statements to execute`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`)
        
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' })
        
        if (error) {
          console.error(`Error executing statement ${i + 1}:`, error)
          console.error('Statement:', statement)
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`)
        }
      }
    }

    console.log('✅ Points and rewards system setup completed!')

    // Verify the tables were created
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['client_points', 'points_transactions', 'client_rewards', 'stripe_payments', 'community_event_participants'])

    if (tablesError) {
      console.error('Error checking tables:', tablesError)
    } else {
      console.log('Created tables:', tables?.map(t => t.table_name))
    }

  } catch (error) {
    console.error('Error setting up points system:', error)
  }
}

// Run the setup
setupPointsSystem()
  .then(() => {
    console.log('Setup completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Setup failed:', error)
    process.exit(1)
  })
