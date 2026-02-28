import React from 'react'
import AccountManagement from './components/AccountManagement'
import { createClient } from '@/utils/supabase/server'

export default async function Account() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <AccountManagement user={user} />
}