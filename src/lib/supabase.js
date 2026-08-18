// ===================================================================
// SUPABASE SETUP - Database connection
// ===================================================================

import { createClient } from '@supabase/supabase-js'

// ===================================================================
// CONFIGURATION & VALIDATION
// ===================================================================

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Missing Supabase settings. Copy .env.example to .env, fill it in, then restart the dev server.'
  )
}

// ===================================================================
// INITIALIZE CLIENT
// ===================================================================

export const supabase = createClient(url, anonKey)
