// Diagnostic script - run in browser console to check API connectivity
(async function diagnoseMySubHub() {
  console.log('🔍 MySubHub Diagnostic Tool\n');
  
  const API_BASE = window.MYSUBHUB_API || 'https://mslxnegbtstpdwauugmq.supabase.co/functions/v1/mainbot';
  
  // Check 1: API Health
  console.log('1️⃣ Checking API health...');
  try {
    const healthRes = await fetch(`${API_BASE}/health`);
    const health = await healthRes.json();
    console.log('✅ Health check:', health);
  } catch (e) {
    console.error('❌ Health check failed:', e.message);
    console.log('   → Backend might not be deployed or URL is wrong');
  }
  
  // Check 2: Telegram initData
  console.log('\n2️⃣ Checking Telegram WebApp...');
  const TG = window.Telegram?.WebApp;
  if (!TG) {
    console.error('❌ Telegram WebApp SDK not loaded');
  } else if (!TG.initData) {
    console.error('❌ No initData - not running in Telegram context');
    console.log('   → This is normal if testing outside Telegram');
  } else {
    console.log('✅ Telegram WebApp initialized');
    console.log('   initData length:', TG.initData.length);
  }
  
  // Check 3: Auth endpoint
  console.log('\n3️⃣ Checking authentication...');
  try {
    const authRes = await fetch(`${API_BASE}/api/auth/validate`, {
      headers: {
        'x-telegram-initdata': TG?.initData || '',
        'Content-Type': 'application/json'
      }
    });
    const auth = await authRes.json();
    if (auth.error) {
      console.error('❌ Auth failed:', auth.error);
      console.log('   → Check if backend is validating initData correctly');
    } else {
      console.log('✅ Auth successful, user:', auth.user?.first_name);
    }
  } catch (e) {
    console.error('❌ Auth request failed:', e.message);
  }
  
  // Check 4: Subscriptions endpoint
  console.log('\n4️⃣ Checking subscriptions endpoint...');
  try {
    const subsRes = await fetch(`${API_BASE}/api/subscriptions/my`, {
      headers: {
        'x-telegram-initdata': TG?.initData || '',
        'Content-Type': 'application/json'
      }
    });
    console.log('   Status:', subsRes.status);
    const subs = await subsRes.json();
    if (subs.error) {
      console.error('❌ Subscriptions error:', subs.error);
    } else {
      console.log('✅ Subscriptions loaded:', subs.length, 'items');
    }
  } catch (e) {
    console.error('❌ Subscriptions request failed:', e.message);
  }
  
  // Check 5: Channels endpoint
  console.log('\n5️⃣ Checking channels endpoint...');
  try {
    const channelsRes = await fetch(`${API_BASE}/api/channels/my`, {
      headers: {
        'x-telegram-initdata': TG?.initData || '',
        'Content-Type': 'application/json'
      }
    });
    console.log('   Status:', channelsRes.status);
    const channels = await channelsRes.json();
    if (channels.error) {
      console.error('❌ Channels error:', channels.error);
    } else {
      console.log('✅ Channels loaded:', channels.length, 'items');
    }
  } catch (e) {
    console.error('❌ Channels request failed:', e.message);
  }
  
  // Check 6: Referrals endpoint
  console.log('\n6️⃣ Checking referrals endpoint...');
  try {
    const refRes = await fetch(`${API_BASE}/api/referrals/stats`, {
      headers: {
        'x-telegram-initdata': TG?.initData || '',
        'Content-Type': 'application/json'
      }
    });
    console.log('   Status:', refRes.status);
    const ref = await refRes.json();
    if (ref.error) {
      console.error('❌ Referrals error:', ref.error);
    } else {
      console.log('✅ Referrals loaded, balance:', ref.currentBalance);
    }
  } catch (e) {
    console.error('❌ Referrals request failed:', e.message);
  }
  
  console.log('\n📋 Summary:');
  console.log('If you see ❌ errors, check:');
  console.log('1. Backend is deployed and running');
  console.log('2. API_BASE URL is correct in app.js');
  console.log('3. Database schema has been applied');
  console.log('4. Environment variables are set (BOT_TOKEN, SUPABASE_URL, etc.)');
  console.log('5. Check backend logs for detailed errors');
})();
