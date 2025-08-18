import { supabase } from '../lib/supabase';

// Centralized admin notification utility
export async function sendAdminNotification(
  title: string,
  message: string,
  type: 'info' | 'alert' | 'reminder' = 'info',
  priority: 'high' | 'medium' | 'low' = 'medium',
  actionUrl?: string,
  actionText?: string,
  metadata?: any
): Promise<boolean> {
  try {
    console.log('🔔 Sending admin notification:', { title, type, priority });
    
    // Get admin user ID using multiple methods
    let adminUserId = await getAdminUserId();
    
    if (!adminUserId) {
      console.error('❌ Could not find admin user ID');
      return false;
    }
    
    // Create the notification
    const notificationData = {
      user_id: adminUserId,
      title,
      message,
      type,
      priority,
      read: false,
      action_url: actionUrl,
      action_text: actionText,
      metadata: metadata || {}
    };
    
    console.log('📤 Creating admin notification:', notificationData);
    
    const { data: result, error } = await supabase
      .from('user_notifications')
      .insert([notificationData])
      .select();
      
    if (error) {
      console.error('❌ Failed to create admin notification:', error);
      return false;
    }
    
    console.log('✅ Admin notification created successfully:', result);
    return true;
    
  } catch (error) {
    console.error('❌ Error in sendAdminNotification:', error);
    return false;
  }
}

// Get admin user ID using multiple methods
async function getAdminUserId(): Promise<string | null> {
  // Method 1: Check localStorage first
  let adminUserId = localStorage.getItem('admin_user_id');
  if (adminUserId) {
    console.log('✅ Found admin ID in localStorage:', adminUserId);
    return adminUserId;
  }
  
  // Method 2: Try to find admin user in database
  try {
    const { data: adminUser, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'youssef.arafat09@gmail.com')
      .maybeSingle();
      
    if (adminUser && !error) {
      adminUserId = adminUser.id;
      console.log('✅ Found admin user via database lookup:', adminUserId);
      // Store for future use
      localStorage.setItem('admin_user_id', adminUserId);
      return adminUserId;
    }
  } catch (error) {
    console.log('⚠️ Database lookup failed:', error);
  }
  
  // Method 3: Try auth admin API (if available)
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (!error && users) {
      const adminUser = users.find(u => u.email === 'youssef.arafat09@gmail.com');
      if (adminUser) {
        adminUserId = adminUser.id;
        console.log('✅ Found admin user via auth API:', adminUserId);
        localStorage.setItem('admin_user_id', adminUserId);
        return adminUserId;
      }
    }
  } catch (error) {
    console.log('⚠️ Auth API lookup failed:', error);
  }
  
  // Method 4: Hardcoded fallback (REPLACE WITH ACTUAL ADMIN USER ID)
  console.log('⚠️ Using hardcoded fallback admin ID');
  return 'f47ac10b-58cc-4372-a567-0e02b2c3d479'; // Replace with actual admin user ID
}

// Check if current user is admin
export function isCurrentUserAdmin(userEmail?: string): boolean {
  return userEmail === 'youssef.arafat09@gmail.com';
}

// Get admin user ID for the current session
export async function getCurrentAdminUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user && isCurrentUserAdmin(user.email)) {
    // Store admin ID for notifications
    localStorage.setItem('admin_user_id', user.id);
    return user.id;
  }
  
  return null;
}