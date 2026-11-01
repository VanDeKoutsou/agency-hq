import { createClient } from '@supabase/supabase-js';
import { createMockClient } from './mockSupabase';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

const hasKeys = Boolean(url && key && !url.includes('YOUR-PROJECT'));

// Demo mode: αν δεν υπάρχουν κλειδιά Supabase (ή VITE_DEMO=true) η εφαρμογή τρέχει
// με τοπικά δεδομένα στον browser, χωρίς backend.
export const isDemo = import.meta.env.VITE_DEMO === 'true' || !hasKeys;
export const isConfigured = true;

export const supabase = isDemo
  ? createMockClient()
  : createClient(url, key, { realtime: { params: { eventsPerSecond: 10 } } });
