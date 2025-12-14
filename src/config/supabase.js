// For use in renderer process only
// In main process, we'll use dynamic imports
let supabase = null;
let supabaseAdmin = null;

// Initialize Supabase clients
export async function initializeSupabase() {
  if (supabase) return supabase;
  
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    // Supabase configuration from environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-ref.supabase.co';
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'your-publishable-key';
    const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY || 'your-service-key';

    // Public client (for LGU operations)
    supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Admin client (for admin operations)
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    return { supabase, supabaseAdmin };
  } catch (error) {
    console.error('Failed to initialize Supabase:', error);
    throw error;
  }
}

// Export getters
export async function getSupabase() {
  if (!supabase) await initializeSupabase();
  return supabase;
}

export async function getSupabaseAdmin() {
  if (!supabaseAdmin) await initializeSupabase();
  return supabaseAdmin;
}

// Helper function to get LGU-specific client
export async function getLGUClient(lguId) {
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-ref.supabase.co';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'your-publishable-key';
  
  // Create client with custom headers for RLS
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        'x-lgu-id': lguId
      }
    }
  });
}

// Export configuration
export const config = {
  url: import.meta.env.VITE_SUPABASE_URL || 'https://your-project-ref.supabase.co',
  anonKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'your-publishable-key',
  serviceKey: import.meta.env.VITE_SUPABASE_SERVICE_KEY || 'your-service-key'
};
