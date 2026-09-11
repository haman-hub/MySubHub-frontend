// ============================================
// MySubHub v2 - Debug Script
// Run this in browser console to test features
// ============================================

console.log('🔍 MySubHub Debug Script Loaded');
console.log('================================');

// Test 1: Check Tutorial State
console.log('\n📚 TEST 1: Tutorial State');
console.log('Tutorial completed:', tutorialCompleted);
console.log('Current user:', currentUser ? 'Yes' : 'No');
console.log('Tutorial functions:', {
    startTutorial: typeof window.startTutorial === 'function' ? '✅' : '❌',
    nextTutorialStep: typeof window.nextTutorialStep === 'function' ? '✅' : '❌',
    skipTutorial: typeof window.skipTutorial === 'function' ? '✅' : '❌'
});

// Test 2: Manual Tutorial Trigger
console.log('\n🎓 TEST 2: Manual Tutorial Trigger');
console.log('To start tutorial manually, run:');
console.log('  tutorialCompleted = false;');
console.log('  startTutorial();');

// Test 3: Check Forward Channel Function
console.log('\n📤 TEST 3: Forward Channel Function');
console.log('forwardChannel function:', typeof window.forwardChannel === 'function' ? '✅' : '❌');

// Test 4: Test Forward Channel
console.log('\n🧪 TEST 4: Test Forward Channel');
console.log('To test forward channel, run:');
console.log('  forwardChannel("YOUR_CHANNEL_ID");');
console.log('Replace YOUR_CHANNEL_ID with an actual channel ID from your database');

// Test 5: Check API Connectivity
console.log('\n🌐 TEST 5: API Connectivity');
console.log('To test API, run:');
console.log('  apiFetch("/api/channels/my").then(data => console.log("Channels:", data)).catch(err => console.error("Error:", err));');

// Test 6: Reset Tutorial
console.log('\n🔄 TEST 6: Reset Tutorial');
console.log('To reset tutorial in database, run this SQL in Supabase:');
console.log('  UPDATE user_preferences SET tutorial_completed = false WHERE user_id = YOUR_TELEGRAM_ID;');

// Test 7: Check All Global Functions
console.log('\n✅ TEST 7: All Global Functions');
const functions = [
    'startTutorial', 'nextTutorialStep', 'prevTutorialStep', 'skipTutorial',
    'forwardChannel', 'openRating', 'openReport', 'openEditModal',
    'copyDeepLink', 'requestVerification', 'toggleTheme', 'switchPage'
];

functions.forEach(fn => {
    const exists = typeof window[fn] === 'function';
    console.log(`  ${fn}: ${exists ? '✅' : '❌'}`);
});

console.log('\n================================');
console.log('🎉 Debug script complete!');
console.log('Check the results above and follow the instructions to test each feature.');
