// Test Supabase directly in renderer process
import { getLGUClient } from '/src/config/supabase.js';

async function testSupabaseRenderer() {
  try {
    console.log('Testing Supabase in renderer...');
    
    const supabase = await getLGUClient('default');
    
    const { data, error } = await supabase
      .from('lgu')
      .select('id, name')
      .limit(3);
    
    if (error) {
      console.error('Supabase error:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Supabase works in renderer!', data);
    return { success: true, data };
  } catch (err) {
    console.error('Renderer error:', err);
    return { success: false, error: err.message };
  }
}

// Export for use in browser
window.testSupabaseRenderer = testSupabaseRenderer;
