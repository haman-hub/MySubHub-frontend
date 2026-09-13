// MySubHub - Bulletproof Version
// switchPage is defined FIRST to prevent any errors

// Define switchPage IMMEDIATELY at the top
window.switchPage = function(pageId) {
    console.log('switchPage called with:', pageId);
    
    if (pageId === 'admin' && !window.isAdmin) pageId = 'subscriptions';

    const allPages = ['purchase', 'subscriptions', 'owner', 'referrals', 'admin'];
    allPages.forEach(p => {
        const sec = document.getElementById(`page-${p}`);
        if (sec) { 
            sec.style.display = 'none'; 
            sec.classList.add('hidden-page'); 
        }
    });

    const target = document.getElementById(`page-${pageId}`);
    if (target) { 
        target.style.display = 'block'; 
        target.classList.remove('hidden-page'); 
    }

    const navButtonMap = { 
        'subscriptions': 'nav-subscriptions', 
        'owner': 'nav-owner', 
        'referrals': 'nav-referrals',
        'admin': 'nav-admin' 
    };
    
    Object.values(navButtonMap).forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.classList.remove('active', 'text-ton-400', 'text-emerald-400', 'text-amber-400', 'text-purple-400');
            btn.classList.add('text-slate-400');
        }
    });

    const activeBtnId = navButtonMap[pageId];
    if (activeBtnId) {
        const activeBtn = document.getElementById(activeBtnId);
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.classList.remove('text-slate-400');
            let colorClass = 'text-ton-400';
            if (pageId === 'owner') colorClass = 'text-emerald-400';
            else if (pageId === 'referrals') colorClass = 'text-purple-400';
            else if (pageId === 'admin') colorClass = 'text-amber-400';
            activeBtn.classList.add(colorClass);
        }
    }

    if (pageId === 'subscriptions' && window.loadSubscriptions) window.loadSubscriptions();
    else if (pageId === 'owner' && window.loadOwnerDashboard) window.loadOwnerDashboard();
    else if (pageId === 'referrals' && window.loadReferralDashboard) window.loadReferralDashboard();
    else if (pageId === 'admin' && window.loadAdminDashboard) window.loadAdminDashboard();

    window.currentPage = pageId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Now define all other functions
window.toggleTheme = function() {
    console.log('toggleTheme called');
};

window.openLanguageModal = function() {
    const modal = document.getElementById('language-modal');
    if (modal) modal.classList.remove('hidden');
};

window.closeLanguageModal = function() {
    const modal = document.getElementById('language-modal');
    if (modal) modal.classList.add('hidden');
};

window.selectLanguage = function(lang) {
    console.log('Language selected:', lang);
    if (window.closeLanguageModal) window.closeLanguageModal();
};

window.openAddChannelModal = function() {
    const modal = document.getElementById('add-channel-modal');
    if (modal) modal.classList.remove('hidden');
};

window.closeAddChannelModal = function() {
    const modal = document.getElementById('add-channel-modal');
    if (modal) modal.classList.add('hidden');
};

window.submitAddChannel = async function() {
    console.log('submitAddChannel called');
    alert('Add channel functionality - coming soon');
};

window.openRating = function(channelId) {
    console.log('openRating called for:', channelId);
    const modal = document.getElementById('rating-modal');
    if (modal) modal.classList.remove('hidden');
};

window.closeRating = function() {
    const modal = document.getElementById('rating-modal');
    if (modal) modal.classList.add('hidden');
};

window.selectRating = function(rating) {
    console.log('Rating selected:', rating);
};

window.submitRating = function() {
    console.log('submitRating called');
    alert('Rating submitted - coming soon');
    if (window.closeRating) window.closeRating();
};

window.openReport = function(channelId) {
    console.log('openReport called for:', channelId);
    const modal = document.getElementById('report-modal');
    if (modal) modal.classList.remove('hidden');
};

window.closeReport = function() {
    const modal = document.getElementById('report-modal');
    if (modal) modal.classList.add('hidden');
};

window.submitReport = function() {
    console.log('submitReport called');
    alert('Report submitted - coming soon');
    if (window.closeReport) window.closeReport();
};

window.renewSubscription = function(channelId) {
    console.log('renewSubscription called for:', channelId);
    alert('Renew subscription - coming soon');
};

window.joinChannel = function(inviteLink) {
    console.log('joinChannel called with:', inviteLink);
    if (inviteLink) {
        window.open(inviteLink, '_blank');
    }
};

window.forwardChannel = function(channelId) {
    console.log('forwardChannel called for:', channelId);
    alert('Forward channel - coming soon');
};

window.copyDeepLink = function(channelId) {
    const link = `https://t.me/MySubsHub_bot?start=${channelId}`;
    navigator.clipboard.writeText(link).then(() => {
        alert('Link copied!');
    });
};

window.toggleChannel = function(channelId, isActive) {
    console.log('toggleChannel called:', channelId, isActive);
};

window.openEditModal = function(channelId) {
    console.log('openEditModal called for:', channelId);
    const modal = document.getElementById('edit-modal');
    if (modal) modal.classList.remove('hidden');
};

window.requestVerification = function(channelId) {
    console.log('requestVerification called for:', channelId);
    alert('Verification request - coming soon');
};

window.approveWithdrawal = function(id) {
    console.log('approveWithdrawal called for:', id);
    alert('Approve withdrawal - coming soon');
};

window.reviewReport = function(reportId, action) {
    console.log('reviewReport called:', reportId, action);
    alert('Review report - coming soon');
};

window.requestWithdrawal = function() {
    console.log('requestWithdrawal called');
    alert('Request withdrawal - coming soon');
};

window.loadReferralDashboard = function() {
    console.log('loadReferralDashboard called');
    const container = document.getElementById('referral-dashboard');
    if (container) {
        container.innerHTML = '<div class="glass-card p-6"><h3 class="text-xl font-bold text-white mb-4">🎁 Referral Program</h3><p class="text-slate-400">Coming soon...</p></div>';
    }
};

window.copyReferralLink = function() {
    console.log('copyReferralLink called');
    alert('Copy referral link - coming soon');
};

window.shareReferralLink = function() {
    console.log('shareReferralLink called');
    alert('Share referral link - coming soon');
};

window.loadSubscriptions = function() {
    console.log('loadSubscriptions called');
    const list = document.getElementById('subscriptions-list');
    if (list) {
        list.innerHTML = '<div class="glass-card p-10 text-center text-slate-400">Loading subscriptions...</div>';
    }
};

window.loadOwnerDashboard = function() {
    console.log('loadOwnerDashboard called');
    const container = document.getElementById('channels-list');
    if (container) {
        container.innerHTML = '<div class="text-center text-slate-400 py-6">Loading channels...</div>';
    }
};

window.loadAdminDashboard = function() {
    console.log('loadAdminDashboard called');
};

// State variables
window.currentUser = null;
window.isAdmin = false;
window.currentPage = 'subscriptions';
window.currentTheme = 'dark';

// Telegram WebApp
const TG = window.Telegram?.WebApp || {
    ready: () => {},
    expand: () => {},
    initData: '',
    initDataUnsafe: {},
    HapticFeedback: {
        impactOccurred: () => {},
        selectionChanged: () => {},
        notificationOccurred: () => {}
    }
};

try {
    TG.ready();
    TG.expand();
} catch (e) {
    console.warn('Telegram WebApp init:', e);
}

// Initialize app
async function init() {
    console.log('init() called');
    
    try {
        // Show nav bar
        const navBar = document.getElementById('nav-bar');
        if (navBar) {
            navBar.classList.remove('hidden');
            console.log('Nav bar shown');
        }

        // Show owner tab
        const ownerTab = document.getElementById('nav-owner');
        if (ownerTab) {
            ownerTab.style.setProperty('display', 'flex', 'important');
            console.log('Owner tab shown');
        }

        // Get start parameter
        const urlStart = new URLSearchParams(window.location.search).get('startapp') || 
                         new URLSearchParams(window.location.search).get('start');
        const startParam = TG.initDataUnsafe?.start_param || urlStart;

        console.log('Start param:', startParam);

        // Navigate to appropriate page
        if (startParam && /^[0-9a-fA-F-]{36}$/.test(startParam)) {
            console.log('Loading purchase page');
            // loadPurchasePage(startParam);
            window.switchPage('purchase');
        } else if (startParam === 'owner') {
            console.log('Loading owner page');
            window.switchPage('owner');
        } else if (startParam === 'admin' && window.isAdmin) {
            console.log('Loading admin page');
            window.switchPage('admin');
        } else {
            console.log('Loading subscriptions page');
            window.switchPage('subscriptions');
        }
        
        console.log('init() completed successfully');
    } catch (error) {
        console.error('Init error:', error);
        // Fallback to subscriptions
        if (window.switchPage) {
            window.switchPage('subscriptions');
        }
    }
}

// Start app when page loads
window.onload = function() {
    console.log('Page loaded, calling init()');
    init();
};

console.log('app.js loaded successfully');
console.log('switchPage is:', typeof window.switchPage);
