// set up Supabase

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// stop if we don't have the settings
if (!url || !anonKey) {
  throw new Error(
    'Missing Supabase settings. Copy .env.example to .env, fill it in, then restart the dev server.'
  )
}

// anon key is public, real security is in the database rules
export const supabase = createClient(url, anonKey)
