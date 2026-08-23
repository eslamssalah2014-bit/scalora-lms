import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://cfwkcgxkbvsnhmgdauig.supabase.co';

// Public anon key for real-time WebSocket subscriptions
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmd2tjZ3hrYnZzbmhtZ2RhdWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg0ODgwMDAsImV4cCI6MjA1NDA2NDAwMH0.placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 20,
    },
  },
});
