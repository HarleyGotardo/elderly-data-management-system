import { supabase, supabaseAdmin } from '../config/supabase.js';

// Test function to verify Supabase connection
export async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test public client
    const { data, error } = await supabase
      .from('lgu')
      .select('id, name, province')
      .limit(5);
    
    if (error) {
      console.error('Public client error:', error);
      return false;
    }
    
    console.log('✅ Public client connected successfully');
    console.log('Sample LGUs:', data);
    
    // Test admin client
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('lgu')
      .select('*', { count: 'exact' });
    
    if (adminError) {
      console.error('Admin client error:', adminError);
      return false;
    }
    
    console.log('✅ Admin client connected successfully');
    console.log('Total LGUs:', adminData.length);
    
    return true;
  } catch (err) {
    console.error('Connection test failed:', err);
    return false;
  }
}
