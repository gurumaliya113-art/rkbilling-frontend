import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Browser Supabase client — used ONLY for Realtime subscriptions
 * (notifications, live sales). All data mutations go through the secured API.
 */
export const supabase = url && anon ? createClient(url, anon, {
  auth: { persistSession: false },
  realtime: { params: { eventsPerSecond: 10 } },
}) : null;
