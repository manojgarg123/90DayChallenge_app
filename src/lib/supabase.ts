import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
export const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY

export const isMissingConfig = !supabaseUrl || !supabaseAnonKey

// Clear any auth tokens previously stored in localStorage.
// We use sessionStorage now so sessions end when the browser tab is closed.
if (typeof window !== 'undefined') {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sb-') && key.includes('-auth-token')) {
      localStorage.removeItem(key)
    }
  })
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // sessionStorage clears when the browser tab is closed (new session = new login).
    // localStorage (the default) persists forever across browser restarts.
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
  },
})

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      challenges: {
        Row: {
          id: string
          user_id: string
          title: string
          goal_description: string
          start_date: string
          end_date: string
          status: 'active' | 'completed' | 'abandoned'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['challenges']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['challenges']['Insert']>
      }
    }
  }
}
