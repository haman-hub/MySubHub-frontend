// ================== MySubHub v2 - Enhanced Frontend ==================
// Features: Pagination, Tutorial, Skeleton Loading, Gestures, Dark/Light Mode,
//           Verified Badges, Channel Posts, Groups Support

window.onerror = function(message) {
    showAlert('Error: ' + message);
    return true;
};

// ================== CONFIGURATION ==================
const API_BASE = 'https://mslxnegbtstpdwauugmq.supabase.co/functions/v1/mainbot';
const ITEMS_PER_PAGE = 10;

// ================== STATE MANAGEMENT ==================
let currentUser = null;
let isAdmin = false;
let currentPage = 'subscriptions';
let currentTheme = 'dark';
let tutorialCompleted = false;
let tonConnectUI = null;
let currentNetwork = 'testnet';

// Pagination state
let paginationState = {
    subscriptions: { page: 1, hasMore: true, loading: false },
    channels: { page: 1, hasMore: true, loading: false },
    reports: { page: 1, hasMore: true, loading: false }
};

// ================== TELEGRAM WEBAPP INIT ==================
const TG = window.Telegram?.WebApp || {
    ready: () => {}, expand: () => {},
    initData: '', initDataUnsafe: {}, themeParams: null,
    BackButton: { show: () => {}, hide: () => {}, onClick: () => {} },
    HapticFeedback: { impactOccurred: () => {}, selectionChanged: () => {}, notificationOccurred: () => {} }
};

try {
    TG.ready();
    TG.expand();
} catch (e) {
    console.warn('Telegram WebApp init:', e);
}

// ================== THEME MANAGEMENT (Dark/Light Mode) ==================
function applyTheme(theme) {
    currentTheme = theme;
    
    if (theme === 'system') {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    document.documentElement.setAttribute('data-theme', theme);
    document.body.className = theme === 'dark' ? 'theme-dark' : 'theme-light';
    
    // Update theme toggle button
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    }
    
    // Save preference
    if (currentUser) {
        apiFetch('/api/user/preferences', {
            method: 'POST',
            body: JSON.stringify({ theme })
        }).catch(() => {});
    }
}

function toggleTheme() {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    TG.HapticFeedback.selectionChanged();
}

// Immediately assign to window to prevent reference errors
window.toggleTheme = toggleTheme;

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (currentTheme === 'system') {
        applyTheme('system');
    }
});

// ================== SKELETON LOADING ==================
function showSkeleton(containerId, type = 'card', count = 3) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let skeletonHTML = '';
    
    if (type === 'card') {
        for (let i = 0; i < count; i++) {
            skeletonHTML += `
                <div class="skeleton-card mb-3">
                    <div class="skeleton-line skeleton-title"></div>
                    <div class="skeleton-line skeleton-text"></div>
                    <div class="skeleton-line skeleton-text short"></div>
                    <div class="skeleton-buttons">
                        <div class="skeleton-button"></div>
                        <div class="skeleton-button"></div>
                    </div>
                </div>
            `;
        }
    } else if (type === 'list') {
        for (let i = 0; i < count; i++) {
            skeletonHTML += `
                <div class="skeleton-list-item">
                    <div class="skeleton-avatar"></div>
                    <div class="skeleton-content">
                        <div class="skeleton-line skeleton-title"></div>
                        <div class="skeleton-line skeleton-text"></div>
                    </div>
                </div>
            `;
        }
    }
    
    container.innerHTML = skeletonHTML;
}

// ================== GESTURE SUPPORT ==================
function addSwipeGestures(element, callbacks) {
    let startX = 0;
    let startY = 0;
    let isDragging = false;
    
    element.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isDragging = true;
    }, { passive: true });
    
    element.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
    }, { passive: true });
    
    element.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;
        
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const diffX = endX - startX;
        const diffY = endY - startY;
        
        // Only trigger if horizontal swipe is dominant
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            if (diffX > 0 && callbacks.onSwipeRight) {
                callbacks.onSwipeRight();
            } else if (diffX < 0 && callbacks.onSwipeLeft) {
                callbacks.onSwipeLeft();
            }
            TG.HapticFeedback.impactOccurred('light');
        }
    }, { passive: true });
}

// ================== INTERACTIVE TUTORIAL ==================
const tutorialSteps = [
    {
        title: "Welcome to MySubHub! 🎉",
        content: "Let me show you around. This app helps you subscribe to premium Telegram channels and groups using TON cryptocurrency.",
        target: null,
        action: "next"
    },
    {
        title: "Your Subscriptions 📋",
        content: "This is where you'll see all your active subscriptions. You can rate, report, or renew them from here.",
        target: "#page-subscriptions",
        action: "next"
    },
    {
        title: "My Channels 📺",
        content: "If you own a channel or group, you can manage it here. Set prices, view earnings, and share your channel.",
        target: "#nav-owner",
        action: "click",
        clickTarget: "#nav-owner"
    },
    {
        title: "Connect Your Wallet 💰",
        content: "To receive payments, connect your TON wallet. Click here to get started.",
        target: "#nav-owner",
        action: "next"
    },
    {
        title: "You're All Set! 🚀",
        content: "That's it! You can now browse channels, subscribe, and manage your own. Enjoy MySubHub!",
        target: null,
        action: "complete"
    }
];

let currentTutorialStep = 0;

function startTutorial() {
    currentTutorialStep = 0;
    showTutorialStep();
}

function showTutorialStep() {
    if (currentTutorialStep >= tutorialSteps.length) {
        completeTutorial();
        return;
    }
    
    const step = tutorialSteps[currentTutorialStep];
    
    // Remove existing tutorial overlay
    const existing = document.getElementById('tutorial-overlay');
    if (existing) existing.remove();
    
    // Remove any existing highlights
    document.querySelectorAll('.tutorial-highlight').forEach(el => {
        el.classList.remove('tutorial-highlight');
    });
    
    // Create tutorial overlay with spotlight effect
    const overlay = document.createElement('div');
    overlay.id = 'tutorial-overlay';
    overlay.className = 'tutorial-overlay';
    
    // Position modal at bottom for better visibility
    const modalPosition = step.target ? 'bottom' : 'center';
    
    overlay.innerHTML = `
        <div class="tutorial-modal tutorial-modal-${modalPosition}">
            <div class="tutorial-header">
                <h3>${step.title}</h3>
                <span class="tutorial-progress">${currentTutorialStep + 1}/${tutorialSteps.length}</span>
            </div>
            <p class="tutorial-content">${step.content}</p>
            <div class="tutorial-actions">
                ${currentTutorialStep > 0 ? '<button onclick="prevTutorialStep()" class="tutorial-btn secondary">Back</button>' : ''}
                <button onclick="skipTutorial()" class="tutorial-btn secondary">Skip</button>
                <button onclick="nextTutorialStep()" class="tutorial-btn primary">
                    ${step.action === 'complete' ? 'Finish' : 'Next'}
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Highlight target if specified
    if (step.target) {
        const target = document.querySelector(step.target);
        if (target) {
            target.classList.add('tutorial-highlight');
            
            // Scroll target into view
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Remove highlight after moving to next step
            setTimeout(() => {
                target.classList.remove('tutorial-highlight');
            }, 5000);
        }
    }
    
    // Auto-click if needed
    if (step.action === 'click' && step.clickTarget) {
        setTimeout(() => {
            const clickTarget = document.querySelector(step.clickTarget);
            if (clickTarget) clickTarget.click();
        }, 1500);
    }
    
    TG.HapticFeedback.impactOccurred('light');
}

function nextTutorialStep() {
    currentTutorialStep++;
    showTutorialStep();
}

function prevTutorialStep() {
    if (currentTutorialStep > 0) {
        currentTutorialStep--;
        showTutorialStep();
    }
}

function skipTutorial() {
    completeTutorial();
}

function completeTutorial() {
    const overlay = document.getElementById('tutorial-overlay');
    if (overlay) overlay.remove();
    
    tutorialCompleted = true;
    
    // Save to backend
    apiFetch('/api/user/preferences', {
        method: 'POST',
        body: JSON.stringify({ tutorial_completed: true })
    }).catch(() => {});
    
    TG.HapticFeedback.notificationOccurred('success');
}

// Expose tutorial functions to global scope
window.startTutorial = startTutorial;
window.nextTutorialStep = nextTutorialStep;
window.prevTutorialStep = prevTutorialStep;
window.skipTutorial = skipTutorial;
window.completeTutorial = completeTutorial;

// ================== PAGINATION ==================
function createPaginationControls(containerId, state, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const controls = document.createElement('div');
    controls.className = 'pagination-controls';
    controls.innerHTML = `
        <button onclick="loadPreviousPage('${containerId}')" class="pagination-btn" ${state.page === 1 ? 'disabled' : ''}>
            ← Previous
        </button>
        <span class="pagination-info">Page ${state.page}</span>
        <button onclick="loadNextPage('${containerId}')" class="pagination-btn" ${!state.hasMore ? 'disabled' : ''}>
            Next →
        </button>
    `;
    
    container.appendChild(controls);
}

async function loadNextPage(section) {
    const state = paginationState[section];
    if (!state.hasMore || state.loading) return;
    
    state.loading = true;
    state.page++;
    
    // Reload data for the new page
    if (section === 'subscriptions') {
        await loadSubscriptions(true);
    } else if (section === 'channels') {
        await loadOwnerDashboard(true);
    }
    
    state.loading = false;
}

async function loadPreviousPage(section) {
    const state = paginationState[section];
    if (state.page === 1 || state.loading) return;
    
    state.loading = true;
    state.page--;
    
    if (section === 'subscriptions') {
        await loadSubscriptions(true);
    } else if (section === 'channels') {
        await loadOwnerDashboard(true);
    }
    
    state.loading = false;
}

// Expose pagination functions to global scope
window.loadNextPage = loadNextPage;
window.loadPreviousPage = loadPreviousPage;

// ================== CUSTOM MODAL SYSTEM ==================
function showCustomModal(title, message, type = 'alert', callback = null) {
    const existingModal = document.getElementById('custom-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'custom-modal';
    modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4';
    
    let buttonsHTML = '';
    if (type === 'alert') {
        buttonsHTML = `<button onclick="closeCustomModal()" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition">OK</button>`;
    } else if (type === 'confirm') {
        buttonsHTML = `
            <button onclick="closeCustomModal(false)" class="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2.5 rounded-xl transition">Cancel</button>
            <button onclick="closeCustomModal(true)" class="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition">Confirm</button>
        `;
    } else if (type === 'prompt') {
        buttonsHTML = `
            <button onclick="closeCustomModal(null)" class="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2.5 rounded-xl transition">Cancel</button>
            <button onclick="submitCustomPrompt()" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition">OK</button>
        `;
    }

    let inputHTML = '';
    if (type === 'prompt') {
        inputHTML = `<input type="text" id="custom-prompt-input" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 mt-3" />`;
    }

    modal.innerHTML = `
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" onclick="closeCustomModal()"></div>
        <div class="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 class="text-xl font-bold text-white mb-3">${title}</h3>
            <p class="text-slate-300 mb-4">${message}</p>
            ${inputHTML}
            <div class="flex gap-3 mt-5">${buttonsHTML}</div>
        </div>
    `;

    document.body.appendChild(modal);
    if (callback) modal.dataset.callback = callback.toString();
    if (type === 'prompt') {
        setTimeout(() => {
            const input = document.getElementById('custom-prompt-input');
            if (input) input.focus();
        }, 100);
    }
}

function closeCustomModal(result = null) {
    const modal = document.getElementById('custom-modal');
    if (!modal) return;
    const callbackStr = modal.dataset.callback;
    modal.remove();
    if (callbackStr && result !== undefined) {
        try {
            const callback = eval('(' + callbackStr + ')');
            if (typeof callback === 'function') callback(result);
        } catch (e) {}
    }
}

function submitCustomPrompt() {
    const input = document.getElementById('custom-prompt-input');
    closeCustomModal(input ? input.value : '');
}

// Expose modal functions to global scope
window.closeCustomModal = closeCustomModal;
window.submitCustomPrompt = submitCustomPrompt;

window.alert = function(message) { showCustomModal('MySubHub', message, 'alert'); };
window.confirm = function(message) { return new Promise((resolve) => { showCustomModal('MySubHub', message, 'confirm', (result) => resolve(result)); }); };
window.prompt = function(message, defaultValue = '') { return new Promise((resolve) => { showCustomModal('MySubHub', message, 'prompt', (result) => resolve(result)); setTimeout(() => { const input = document.getElementById('custom-prompt-input'); if (input && defaultValue) input.value = defaultValue; }, 100); }); };

async function showAlert(message) { return new Promise((resolve) => { showCustomModal('MySubHub', message, 'alert', () => resolve()); }); }
async function showConfirm(message) { return new Promise((resolve) => { showCustomModal('MySubHub', message, 'confirm', (result) => resolve(result)); }); }
async function showPrompt(message, defaultValue = '') { return new Promise((resolve) => { showCustomModal('MySubHub', message, 'prompt', (result) => resolve(result)); }); }

// ================== API HELPER ==================
async function apiFetch(url, options = {}) {
    const initData = TG.initData || '';
    const headers = { 'x-telegram-initdata': initData, 'Content-Type': 'application/json', ...options.headers };

    if (!initData) {
        if (url === '/api/auth/validate') return { user: null };
        if (url === '/api/subscriptions/my') return [];
        if (url === '/api/channels/my') return [];
        return { success: true };
    }

    try {
        const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
        if (res.status === 401 || res.status === 403) {
            if (url === '/api/auth/validate') return { user: null };
            return { error: 'Unauthorized' };
        }
        if (res.status === 429) { showAlert('Too many requests. Please wait.'); return { error: 'Rate limited' }; }
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || `HTTP ${res.status}`);
        }
        return res.json();
    } catch (err) {
        console.error('API fetch error:', err);
        throw err;
    }
}

// ================== PAGE NAVIGATION ==================
function switchPage(pageId) {
    if (pageId === 'admin' && !isAdmin) pageId = 'subscriptions';

    const allPages = ['purchase', 'subscriptions', 'owner', 'admin'];
    allPages.forEach(p => {
        const sec = document.getElementById(`page-${p}`);
        if (sec) { sec.style.display = 'none'; sec.classList.add('hidden-page'); }
    });

    const target = document.getElementById(`page-${pageId}`);
    if (target) { target.style.display = 'block'; target.classList.remove('hidden-page'); }

    // Update nav buttons
    const navButtonMap = { 'subscriptions': 'nav-subscriptions', 'owner': 'nav-owner', 'admin': 'nav-admin' };
    Object.values(navButtonMap).forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.classList.remove('active', 'text-ton-400', 'text-emerald-400', 'text-amber-400');
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
            else if (pageId === 'admin') colorClass = 'text-amber-400';
            activeBtn.classList.add(colorClass);
        }
    }

    if (pageId === 'subscriptions') loadSubscriptions();
    else if (pageId === 'owner') loadOwnerDashboard();
    else if (pageId === 'admin') loadAdminDashboard();

    currentPage = pageId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.switchPage = switchPage;

// ================== INIT ==================
async function init() {
    await initTonConnect();

    try {
        // Load user preferences
        const prefs = await apiFetch('/api/user/preferences', { method: 'GET' });
        if (prefs && prefs.theme) {
            applyTheme(prefs.theme);
        } else {
            applyTheme('dark');
        }
        
        if (prefs && prefs.tutorial_completed) {
            tutorialCompleted = true;
        }

        const res = await apiFetch('/api/auth/validate', { method: 'POST' });
        currentUser = res?.user || null;
        isAdmin = res?.is_admin || false;

        const navBar = document.getElementById('nav-bar');
        if (navBar) navBar.classList.remove('hidden');

        const adminTab = document.getElementById('nav-admin');
        if (adminTab) adminTab.style.setProperty('display', isAdmin ? 'flex' : 'none', 'important');

        const ownerTab = document.getElementById('nav-owner');
        if (ownerTab) ownerTab.style.setProperty('display', 'flex', 'important');

        const urlStart = new URLSearchParams(window.location.search).get('startapp') || new URLSearchParams(window.location.search).get('start');
        const startParam = TG.initDataUnsafe?.start_param || urlStart;

        if (startParam && /^[0-9a-fA-F-]{36}$/.test(startParam)) {
            loadPurchasePage(startParam);
            switchPage('purchase');
        } else if (startParam === 'owner') {
            switchPage('owner');
        } else if (startParam === 'admin' && isAdmin) {
            switchPage('admin');
        } else if (startParam === 'help-subscriber') {
            // Redirect to subscriber help page
            window.location.href = 'help-subscriber.html';
            return;
        } else if (startParam === 'help-owner') {
            // Redirect to owner help page
            window.location.href = 'help-owner.html';
            return;
        } else {
            switchPage('subscriptions');
        }
        
        // Start tutorial for new users
        console.log('🔵 Tutorial check:', { tutorialCompleted, currentUser: !!currentUser });
        if (!tutorialCompleted && currentUser) {
            console.log('✅ Starting tutorial...');
            setTimeout(() => {
                console.log('🚀 Tutorial timeout fired, calling startTutorial()');
                startTutorial();
            }, 1000);
        } else {
            console.log('⚠️ Tutorial will not start:', { 
                tutorialCompleted, 
                hasUser: !!currentUser,
                reason: tutorialCompleted ? 'Already completed' : !currentUser ? 'No user' : 'Unknown'
            });
        }
        
        // Add swipe gestures to main container
        const mainContainer = document.querySelector('main');
        if (mainContainer) {
            addSwipeGestures(mainContainer, {
                onSwipeRight: () => {
                    // Navigate to previous page
                    if (currentPage === 'owner') switchPage('subscriptions');
                    else if (currentPage === 'admin') switchPage('owner');
                },
                onSwipeLeft: () => {
                    // Navigate to next page
                    if (currentPage === 'subscriptions') switchPage('owner');
                    else if (currentPage === 'owner' && isAdmin) switchPage('admin');
                }
            });
        }
    } catch (error) {
        console.error('Init error:', error);
        applyTheme('dark');
        switchPage('subscriptions');
    }
}

// ================== TON CONNECT ==================
async function initTonConnect() {
    try {
        if (window.TON_CONNECT_UI) {
            tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
                manifestUrl: 'https://haman-hub.github.io/MySubHub-frontend/manifest.json',
                buttonRootId: 'ton-connect-button',
                network: 'testnet'
            });
        }
    } catch (e) {
        console.error('TON Connect init error:', e);
    }
}

// ================== SUBSCRIPTIONS (with pagination & skeleton) ==================
async function loadSubscriptions(append = false) {
    const list = document.getElementById('subscriptions-list');
    
    if (!append) {
        showSkeleton('subscriptions-list', 'card', 3);
        paginationState.subscriptions.page = 1;
    }
    
    try {
        const subs = await apiFetch('/api/subscriptions/my');
        
        if (!subs || !subs.length) {
            list.innerHTML = '<div class="glass-card p-10 text-center text-slate-400">No subscriptions yet.</div>';
            return;
        }

        // Paginate on frontend
        const start = (paginationState.subscriptions.page - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const paginatedSubs = subs.slice(start, end);
        paginationState.subscriptions.hasMore = end < subs.length;

        if (!append) list.innerHTML = '';
        
        paginatedSubs.forEach(s => {
            const channel = s.channel || {};
            const daysLeft = Math.ceil((new Date(s.end_date) - Date.now()) / (1000 * 60 * 60 * 24));
            const isExpired = daysLeft < 0;
            const isExpiring = daysLeft >= 0 && daysLeft <= 7;
            const isVerified = channel.is_verified;
            const inviteLink = channel.channel_invite_link || '';

            const card = document.createElement('div');
            card.className = 'glass-card p-4 mb-3';
            card.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-2">
                        <h3 class="font-semibold text-white">${channel.channel_name || 'Unknown'}</h3>
                        ${isVerified ? '<span class="verified-badge" title="Verified Channel">✓</span>' : ''}
                    </div>
                    <span class="badge ${isExpired ? 'bg-red-500/10 text-red-400' : isExpiring ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}">
                        ${isExpired ? 'Expired' : isExpiring ? `⚠️ ${daysLeft}d` : 'Active'}
                    </span>
                </div>
                <p class="text-slate-400 text-sm mb-3">Expires: ${new Date(s.end_date).toLocaleDateString()}</p>
                <div class="flex gap-2 flex-wrap">
                    ${!isExpired && inviteLink ? `<button onclick="joinChannel('${inviteLink}')" class="btn-primary px-3 py-1.5 rounded-xl text-xs text-white">📺 Open Channel</button>` : ''}
                    <button onclick="openRating('${s.channel_id}')" class="btn-secondary px-3 py-1.5 rounded-xl text-xs">⭐ Rate</button>
                    <button onclick="openReport('${s.channel_id}')" class="btn-secondary px-3 py-1.5 rounded-xl text-xs">🚩 Report</button>
                    ${isExpired ? `<button onclick="renewSubscription('${s.channel_id}')" class="btn-primary px-3 py-1.5 rounded-xl text-xs text-white">🔄 Renew</button>` : ''}
                </div>
            `;
            
            // Add swipe gestures to card
            addSwipeGestures(card, {
                onSwipeLeft: () => {
                    if (isExpired) renewSubscription(s.channel_id);
                }
            });
            
            list.appendChild(card);
        });
        
        // Add pagination controls
        const existingPagination = list.querySelector('.pagination-controls');
        if (existingPagination) existingPagination.remove();
        
        if (subs.length > ITEMS_PER_PAGE) {
            createPaginationControls('subscriptions-list', paginationState.subscriptions, loadSubscriptions);
        }
    } catch (e) {
        console.error('Error loading subscriptions:', e);
        list.innerHTML = '<p class="text-red-400 text-center py-6">Failed to load subscriptions</p>';
    }
}

async function renewSubscription(channelId) {
    loadPurchasePage(channelId);
    switchPage('purchase');
}
window.renewSubscription = renewSubscription;

// Join Channel - Opens the channel/group in Telegram
function joinChannel(inviteLink) {
    if (!inviteLink) {
        showAlert('Invite link not available');
        return;
    }
    
    console.log('🔵 Opening channel:', inviteLink);
    
    // Use Telegram WebApp API to open the link
    if (TG.openTelegramLink) {
        TG.openTelegramLink(inviteLink);
        console.log('✅ Opened channel via Telegram WebApp');
    } else {
        // Fallback: open in new tab
        window.open(inviteLink, '_blank');
        console.log('✅ Opened channel in new tab');
    }
    
    TG.HapticFeedback.impactOccurred('light');
}
window.joinChannel = joinChannel;

// ================== FORWARD CHANNEL ==================
async function forwardChannel(channelId) {
    console.log('🔵 Forward channel called with ID:', channelId);
    
    try {
        // Get channel data directly from the API
        const channel = await apiFetch(`/api/channels/${channelId}`, { method: 'GET' });
        console.log('🔵 Channel data:', channel);
        
        if (!channel || channel.error) {
            console.error('❌ Channel not found or error:', channel);
            showAlert('❌ Channel not found');
            return;
        }
        
        console.log('✅ Found channel:', channel.channel_name);
        
        const deepLink = `https://t.me/MySubsHub_bot?start=${channelId}`;
        const rating = parseFloat(channel.avg_rating) || 0;
        const reviewCount = channel.total_reviews || 0;
        
        // Generate stars display (auto-generated from database, cannot be edited)
        const stars = '⭐'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
        
        // Create engaging message template
        // Note: Rating and review count are auto-generated from database
        let messageTemplate = `🚀 🌟 ${channel.channel_name} 🌟 🚀\n\n`;
        messageTemplate += `💎 Premium Content You Don't Want to Miss!\n\n`;
        messageTemplate += `${stars} ${rating.toFixed(1)}/5 (${reviewCount} reviews)\n\n`;
        messageTemplate += `💰 Subscription: ${channel.subscription_price} TON\n`;
        messageTemplate += `📅 Duration: ${channel.duration_days} days\n\n`;
        messageTemplate += `✨ What you'll get:\n`;
        messageTemplate += `• Exclusive content\n`;
        messageTemplate += `• Premium access\n`;
        messageTemplate += `• Community benefits\n\n`;
        messageTemplate += `🔗 Subscribe Now:\n${deepLink}\n\n`;
        messageTemplate += `#Premium #TON #Subscription`;
        
        console.log('✅ Generated message template');
        
        // Open Telegram's native share dialog
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(deepLink)}&text=${encodeURIComponent(messageTemplate)}`;
        
        // Use Telegram WebApp API to open share dialog
        if (TG.openTelegramLink) {
            TG.openTelegramLink(shareUrl);
            console.log('✅ Opened Telegram share dialog');
        } else {
            // Fallback: open in new window/tab
            window.open(shareUrl, '_blank');
            console.log('✅ Opened share link in new tab');
        }
        
        TG.HapticFeedback.impactOccurred('medium');
        
    } catch (e) {
        console.error('❌ Error forwarding channel:', e);
        showAlert('❌ Error: ' + e.message);
    }
}
window.forwardChannel = forwardChannel;

// ================== OWNER DASHBOARD (with pagination, skeleton, groups support) ==================
async function loadOwnerDashboard(append = false) {
    const container = document.getElementById('channels-list');
    
    if (!append) {
        showSkeleton('channels-list', 'card', 3);
        paginationState.channels.page = 1;
    }
    
    try {
        const channels = await apiFetch('/api/channels/my');

        if (!channels || !channels.length) {
            container.innerHTML = '<div class="text-center text-slate-400 py-6">No channels yet.</div>';
            return;
        }

        // Paginate
        const start = (paginationState.channels.page - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const paginatedChannels = channels.slice(start, end);
        paginationState.channels.hasMore = end < channels.length;

        if (!append) container.innerHTML = '';
        
        paginatedChannels.forEach(ch => {
            const isGroup = ch.channel_type === 'group';
            const typeIcon = isGroup ? '👥' : '📺';
            const typeLabel = isGroup ? 'Group' : 'Channel';
            
            const card = document.createElement('div');
            card.className = 'glass-card p-4 mb-3';
            card.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <div class="flex-1">
                        <div class="flex items-center gap-2">
                            <span class="text-lg">${typeIcon}</span>
                            <h3 class="font-semibold text-white text-base">${ch.channel_name}</h3>
                            ${ch.is_verified ? '<span class="verified-badge" title="Verified">✓</span>' : ''}
                        </div>
                        <p class="text-slate-400 text-xs mt-1">${ch.subscription_price} TON / ${ch.duration_days} days • ${typeLabel}</p>
                        <div class="flex gap-3 mt-2 text-xs text-slate-500">
                            <span>👥 ${ch.total_subscribers || 0} subs</span>
                            <span>⭐ ${ch.avg_rating || '0.0'}</span>
                            ${ch.auto_post_enabled ? '<span>📢 Auto-post</span>' : ''}
                        </div>
                    </div>
                    <label class="flex items-center gap-2 text-xs ml-3">
                        <span class="text-slate-300">Active</span>
                        <input type="checkbox" ${ch.is_active ? 'checked' : ''} onchange="toggleChannel('${ch.id}', this.checked)" class="w-4 h-4 accent-blue-500 cursor-pointer">
                    </label>
                </div>
                <div class="flex gap-3 pt-2 border-t border-slate-700/50">
                    <button onclick="openEditModal('${ch.id}')" class="text-blue-400 hover:text-blue-300 text-xs transition">Edit</button>
                    <button onclick="copyDeepLink('${ch.id}')" class="text-blue-400 hover:text-blue-300 text-xs transition">Copy Link</button>
                    <button onclick="forwardChannel('${ch.id}')" class="text-green-400 hover:text-green-300 text-xs transition">📤 Forward</button>
                    ${!ch.is_verified ? `<button onclick="requestVerification('${ch.id}')" class="text-amber-400 hover:text-amber-300 text-xs transition">🏆 Verify</button>` : ''}
                </div>
            `;
            
            // Add swipe gestures
            addSwipeGestures(card, {
                onSwipeLeft: () => toggleChannel(ch.id, !ch.is_active),
                onSwipeRight: () => openEditModal(ch.id)
            });
            
            container.appendChild(card);
        });
        
        // Add pagination
        const existingPagination = container.querySelector('.pagination-controls');
        if (existingPagination) existingPagination.remove();
        
        if (channels.length > ITEMS_PER_PAGE) {
            createPaginationControls('channels-list', paginationState.channels, loadOwnerDashboard);
        }

        loadWithdrawalSection();
    } catch (e) {
        console.error('Error loading owner dashboard:', e);
        container.innerHTML = '<p class="text-red-400 text-center py-6">Failed to load channels</p>';
    }
}

// ================== VERIFICATION REQUEST ==================
async function requestVerification(channelId) {
    const evidence = await showPrompt('Please provide evidence for verification (e.g., channel stats, social media links, website):');
    if (!evidence) return;
    
    try {
        const res = await apiFetch('/api/channels/verify/request', {
            method: 'POST',
            body: JSON.stringify({ channel_id: channelId, evidence })
        });
        
        if (res.success) {
            showAlert('Verification request submitted! Our team will review it soon.');
        } else {
            showAlert('Error: ' + (res.error || 'Unknown error'));
        }
    } catch (e) {
        showAlert('Error: ' + e.message);
    }
}
window.requestVerification = requestVerification;

// ================== CHANNEL EDIT (with post integration) ==================
let editingChannelId = null;

async function openEditModal(channelId) {
    editingChannelId = channelId;
    const data = await apiFetch(`/api/channels/${channelId}`, { method: 'GET' });
    if (data && !data.error) {
        const priceInput = document.getElementById('edit-price');
        const durationInput = document.getElementById('edit-duration');
        const autoPostInput = document.getElementById('edit-auto-post');
        const postTemplateInput = document.getElementById('edit-post-template');
        
        if (priceInput) priceInput.value = data.subscription_price;
        if (durationInput) durationInput.value = data.duration_days;
        if (autoPostInput) autoPostInput.checked = data.auto_post_enabled || false;
        if (postTemplateInput) postTemplateInput.value = data.auto_post_template || '';
    }
    const editModal = document.getElementById('edit-modal');
    if (editModal) editModal.classList.remove('hidden');
}
window.openEditModal = openEditModal;

const modalSaveBtn = document.getElementById('modal-save');
if (modalSaveBtn) {
    modalSaveBtn.onclick = async () => {
        const price = parseFloat(document.getElementById('edit-price')?.value || '0');
        const duration = parseInt(document.getElementById('edit-duration')?.value || '30');
        const autoPost = document.getElementById('edit-auto-post')?.checked || false;
        const postTemplate = document.getElementById('edit-post-template')?.value || '';
        
        if (editingChannelId) {
            await apiFetch(`/api/channels/${editingChannelId}`, {
                method: 'PUT',
                body: JSON.stringify({ 
                    subscription_price: price, 
                    duration_days: duration,
                    auto_post_enabled: autoPost,
                    auto_post_template: postTemplate
                }),
            });
        }
        document.getElementById('edit-modal')?.classList.add('hidden');
        loadOwnerDashboard();
    };
}

// ================== OTHER FUNCTIONS ==================
function openAddChannelModal() {
    const modal = document.getElementById('add-channel-modal');
    if (modal) modal.classList.remove('hidden');
}
function closeAddChannelModal() {
    const modal = document.getElementById('add-channel-modal');
    if (modal) modal.classList.add('hidden');
}
async function submitAddChannel() {
    const nameInput = document.getElementById('add-channel-name');
    const linkInput = document.getElementById('add-channel-link');
    const priceInput = document.getElementById('add-channel-price');
    const durationInput = document.getElementById('add-channel-duration');
    const activeInput = document.getElementById('add-channel-active');
    const typeSelect = document.getElementById('add-channel-type');
    
    const channel_name = nameInput ? nameInput.value.trim() : '';
    const channel_invite_link = linkInput ? linkInput.value.trim() : '';
    const subscription_price = priceInput ? parseFloat(priceInput.value) : 0.1;
    const duration_days = durationInput ? parseInt(durationInput.value) : 30;
    const is_active = activeInput ? activeInput.checked : false;
    const channel_type = typeSelect ? typeSelect.value : 'channel';
    
    if (!channel_name || !channel_invite_link) { showAlert('Please fill in all fields'); return; }
    
    const res = await apiFetch('/api/channels/register', {
        method: 'POST',
        body: JSON.stringify({ channel_name, channel_invite_link, subscription_price, duration_days, is_active, channel_type }),
    });
    if (res.error) return showAlert(res.error);
    closeAddChannelModal();
    loadOwnerDashboard();
    showAlert('Channel added successfully!');
}

window.openAddChannelModal = openAddChannelModal;
window.closeAddChannelModal = closeAddChannelModal;
window.submitAddChannel = submitAddChannel;

function copyDeepLink(channelId) {
    const link = `https://t.me/MySubsHub_bot?start=${channelId}`;
    navigator.clipboard.writeText(link).then(() => showAlert('Link copied!'));
}
window.copyDeepLink = copyDeepLink;

async function toggleChannel(channelId, isActive) {
    await apiFetch(`/api/channels/${channelId}`, { method: 'PUT', body: JSON.stringify({ is_active: isActive }) });
}
window.toggleChannel = toggleChannel;

// ================== PURCHASE PAGE ==================
async function loadPurchasePage(channelId) {
    const card = document.getElementById('purchase-card');
    showSkeleton('purchase-card', 'card', 1);
    
    const data = await apiFetch(`/api/channels/${channelId}`, { method: 'GET' });
    if (!data || data.error) {
        card.innerHTML = '<p class="text-red-400 text-center py-6">Channel not found</p>';
        return;
    }

    const NETWORK_FEE_TON = 0.05;
    const platformFee = data.subscription_price * 0.01;
    const total = data.subscription_price + platformFee + NETWORK_FEE_TON;
    const isVerified = data.is_verified;
    const isGroup = data.channel_type === 'group';

    const rating = parseFloat(data.avg_rating) || 0;
    const reviewCount = data.total_reviews || 0;
    const stars = '⭐'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
    
    card.innerHTML = `
        <div class="text-center mb-6">
            <div class="flex items-center justify-center gap-2 mb-2">
                <h2 class="text-2xl font-bold text-white">${data.channel_name}</h2>
                ${isVerified ? '<span class="verified-badge-large">✓</span>' : ''}
            </div>
            <p class="text-slate-400 text-sm">${isGroup ? '👥 Group' : '📺 Channel'}</p>
            
            ${reviewCount > 0 ? `
                <div class="mt-3 mb-4">
                    <div class="flex items-center justify-center gap-2">
                        <span class="text-lg">${stars}</span>
                        <span class="text-white font-semibold">${rating.toFixed(1)}</span>
                        <span class="text-slate-400 text-sm">(${reviewCount} reviews)</span>
                    </div>
                </div>
            ` : ''}
            
            <div class="bg-slate-800/50 rounded-xl p-4 mt-4">
                <p class="text-slate-400 text-sm">
                    Subscription: <strong class="text-white font-mono text-base">${total.toFixed(6)} TON</strong> / ${data.duration_days} days
                </p>
            </div>
        </div>
        <button id="btn-pay" class="btn-primary w-full text-white font-semibold py-3.5 rounded-xl">Pay with TON</button>
    `;
    
    document.getElementById('btn-pay').onclick = () => initiatePayment(data.id, data.subscription_price);
}

async function initiatePayment(channelId, price) {
    try {
        const initRes = await apiFetch('/api/subscriptions/initiate', { method: 'POST', body: JSON.stringify({ channel_id: channelId }) });
        if (initRes.error) throw new Error(initRes.error);
        if (!tonConnectUI) throw new Error('TON Connect not initialized');

        let wallet = tonConnectUI.wallet;
        if (!wallet) {
            await tonConnectUI.connectWallet();
            wallet = tonConnectUI.wallet;
            if (!wallet) throw new Error('Wallet connection cancelled');
        }

        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 360,
            messages: [{ address: initRes.wallet, amount: initRes.amountNano }],
        };

        const result = await tonConnectUI.sendTransaction(transaction);
        const confirmRes = await apiFetch('/api/subscriptions/confirm', { method: 'POST', body: JSON.stringify({ channel_id: channelId, boc: result.boc }) });

        if (confirmRes.success) {
            showAlert('Subscription successful!');
            switchPage('subscriptions');
        } else {
            showAlert('Payment failed: ' + confirmRes.error);
        }
    } catch (e) {
        showAlert('Payment error: ' + e.message);
    }
}

// ================== WITHDRAWALS ==================
async function loadWithdrawalSection() {
    const data = await apiFetch('/api/withdrawals/my');
    const section = document.getElementById('withdrawal-section');
    if (section) {
        section.innerHTML = '<h3 class="text-lg font-semibold text-white mb-2">Earnings</h3>' +
            '<p class="text-slate-400">Pending: <strong class="text-white">' + (data.pendingEarnings || 0).toFixed(6) + ' TON</strong></p>' +
            '<button onclick="requestWithdrawal()" class="btn-primary mt-3 text-white px-4 py-2 rounded-xl text-sm">Request Withdrawal</button>';
    }
}

async function requestWithdrawal() {
    const amount = await showPrompt('Enter amount in TON:');
    if (!amount) return;
    const res = await apiFetch('/api/withdrawals/request', { method: 'POST', body: JSON.stringify({ amount: parseFloat(amount) }) });
    if (res.success) { showAlert('Withdrawal requested'); loadOwnerDashboard(); }
    else showAlert('Error: ' + (res.error || ''));
}
window.requestWithdrawal = requestWithdrawal;

// ================== ADMIN DASHBOARD ==================
async function loadAdminDashboard() {
    showSkeleton('admin-reports', 'list', 3);
    
    try {
        const reports = await apiFetch('/api/admin/reports');
        const withdrawals = await apiFetch('/api/admin/withdrawals');
        
        const reportsContainer = document.getElementById('admin-reports');
        const withdrawalsContainer = document.getElementById('admin-withdrawals');
        
        if (!Array.isArray(reports) || reports.length === 0) {
            reportsContainer.innerHTML = '<p class="text-slate-400 text-center py-6">No reports.</p>';
        } else {
            reportsContainer.innerHTML = reports.map(r => {
                const reporter = r.reporter || {};
                const channel = r.channel || {};
                const channelOwner = r.channel_owner || {};
                
                return `
                    <div class="glass-card p-4 border-l-4 ${r.status === 'pending' ? 'border-amber-500' : 'border-red-500'}">
                        <div class="flex justify-between items-start mb-3">
                            <span class="text-xs font-bold uppercase px-2 py-1 rounded ${r.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}">${r.status || 'pending'}</span>
                            <span class="text-xs text-slate-500">${new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        <div class="space-y-3">
                            <div class="bg-slate-800/50 rounded-lg p-3">
                                <p class="text-xs text-slate-400 mb-1">📢 Reported by:</p>
                                <p class="text-sm font-semibold text-white">${reporter.first_name || 'Unknown'} ${reporter.username ? `(@${reporter.username})` : ''}</p>
                            </div>
                            <div class="bg-slate-800/50 rounded-lg p-3">
                                <p class="text-xs text-slate-400 mb-1">📺 Channel:</p>
                                <p class="text-sm font-semibold text-white">${channel.channel_name || 'Unknown'}</p>
                            </div>
                            <div class="bg-slate-800/50 rounded-lg p-3">
                                <p class="text-xs text-slate-400 mb-1">⚠️ Reason:</p>
                                <p class="text-sm font-semibold text-red-400 uppercase">${r.reason || 'No reason'}</p>
                                ${r.description ? `<p class="text-sm text-slate-300 mt-2">${r.description}</p>` : ''}
                            </div>
                        </div>
                        ${r.status === 'pending' ? `
                            <div class="flex gap-2 mt-4 pt-3 border-t border-slate-700">
                                <button onclick="reviewReport('${r.id}', 'ban')" class="flex-1 bg-red-600/20 text-red-400 px-3 py-2 rounded-xl text-sm font-semibold">🚫 Ban</button>
                                <button onclick="reviewReport('${r.id}', 'dismiss')" class="flex-1 bg-green-600/20 text-green-400 px-3 py-2 rounded-xl text-sm font-semibold">✅ Dismiss</button>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('');
        }
        
        if (!Array.isArray(withdrawals) || withdrawals.length === 0) {
            withdrawalsContainer.innerHTML = '<p class="text-slate-400 text-center py-6">No pending withdrawals.</p>';
        } else {
            withdrawalsContainer.innerHTML = withdrawals.map(w => `
                <div class="glass-card p-4">
                    <h3 class="font-semibold text-white">${w.owner?.first_name || 'Unknown'}</h3>
                    <p class="text-slate-400 text-sm">${w.amount} TON</p>
                    <button onclick="approveWithdrawal('${w.id}')" class="btn-primary mt-3 w-full text-white px-3 py-1.5 rounded-xl text-sm">Approve</button>
                </div>
            `).join('');
        }
    } catch (e) {
        console.error('Error loading admin dashboard:', e);
    }
}

async function reviewReport(reportId, action) {
    const confirmed = await showConfirm(action === 'ban' ? 'Ban this channel?' : 'Dismiss this report?');
    if (!confirmed) return;
    
    try {
        const res = await apiFetch(`/api/admin/reports/${reportId}/review`, { method: 'POST', body: JSON.stringify({ action }) });
        if (res.success) { showAlert(`Report ${action === 'ban' ? 'banned' : 'dismissed'}!`); loadAdminDashboard(); }
        else showAlert('Error: ' + (res.error || ''));
    } catch (e) {
        showAlert('Error: ' + e.message);
    }
}
window.reviewReport = reviewReport;

async function approveWithdrawal(id) {
    const res = await apiFetch(`/api/admin/withdrawals/${id}/approve`, { method: 'POST' });
    if (res.success) { showAlert('Approved!'); loadAdminDashboard(); }
    else showAlert('Error: ' + (res.error || ''));
}
window.approveWithdrawal = approveWithdrawal;

// ================== RATING & REPORTING ==================
let ratingChannelId = null, reportChannelId = null, selectedRating = 0;

async function openRating(channelId) {
    ratingChannelId = channelId;
    selectedRating = 0;
    
    try {
        const checkRes = await apiFetch(`/api/reviews/check/${channelId}`, { method: 'GET' });
        if (checkRes && checkRes.alreadyRated) { showAlert('You have already rated this channel.'); return; }
    } catch (e) {}
    
    const modal = document.getElementById('rating-modal');
    if (modal) modal.classList.remove('hidden');
}
window.openRating = openRating;

async function openReport(channelId) {
    reportChannelId = channelId;
    
    try {
        const checkRes = await apiFetch(`/api/reports/check/${channelId}`, { method: 'GET' });
        if (checkRes && checkRes.alreadyReported) { showAlert('You have already reported this channel.'); return; }
    } catch (e) {}
    
    const modal = document.getElementById('report-modal');
    if (modal) modal.classList.remove('hidden');
}
window.openReport = openReport;

// ================== LANGUAGE ==================
function openLanguageModal() { document.getElementById('language-modal')?.classList.remove('hidden'); }
function closeLanguageModal() { document.getElementById('language-modal')?.classList.add('hidden'); }
function selectLanguage(lang) { 
    if (typeof setLanguage === 'function') {
        setLanguage(lang); 
    }
    closeLanguageModal(); 
}

// Immediately assign to window to prevent reference errors
window.openLanguageModal = openLanguageModal;
window.closeLanguageModal = closeLanguageModal;
window.selectLanguage = selectLanguage;

// ================== REFERRAL SYSTEM ==================
async function loadReferralDashboard() {
    const container = document.getElementById('referral-dashboard');
    if (!container) return;
    
    showSkeleton('referral-dashboard', 'card', 1);
    
    try {
        const stats = await apiFetch('/api/referrals/stats', { method: 'GET' });
        
        if (stats.error) {
            container.innerHTML = `<p class="text-red-400 text-center py-6">${stats.error}</p>`;
            return;
        }
        
        const referralLink = stats.referralLink || '';
        const totalReferrals = stats.totalReferrals || 0;
        const totalCreditsEarned = stats.totalCreditsEarned || 0;
        const currentBalance = stats.currentBalance || 0;
        const totalUsed = stats.totalUsed || 0;
        
        container.innerHTML = `
            <div class="glass-card p-6 mb-4">
                <h3 class="text-xl font-bold text-white mb-4">🎁 Your Referral Program</h3>
                
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div class="bg-slate-800/50 rounded-xl p-4">
                        <p class="text-slate-400 text-xs mb-1">Current Balance</p>
                        <p class="text-2xl font-bold text-emerald-400">${currentBalance.toFixed(4)} TON</p>
                    </div>
                    <div class="bg-slate-800/50 rounded-xl p-4">
                        <p class="text-slate-400 text-xs mb-1">Total Referrals</p>
                        <p class="text-2xl font-bold text-blue-400">${totalReferrals}</p>
                    </div>
                    <div class="bg-slate-800/50 rounded-xl p-4">
                        <p class="text-slate-400 text-xs mb-1">Total Earned</p>
                        <p class="text-lg font-bold text-white">${totalCreditsEarned.toFixed(4)} TON</p>
                    </div>
                    <div class="bg-slate-800/50 rounded-xl p-4">
                        <p class="text-slate-400 text-xs mb-1">Total Used</p>
                        <p class="text-lg font-bold text-white">${totalUsed.toFixed(4)} TON</p>
                    </div>
                </div>
                
                <div class="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-4 mb-4">
                    <p class="text-sm text-slate-300 mb-2">🔗 Your Referral Link</p>
                    <div class="flex gap-2">
                        <input type="text" id="referral-link" value="${referralLink}" 
                            class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" readonly>
                        <button onclick="copyReferralLink()" class="btn-primary px-4 py-2 rounded-lg text-sm">
                            📋 Copy
                        </button>
                    </div>
                    <p class="text-xs text-slate-400 mt-2">
                        Earn 5% credits on every subscription made through your link!
                    </p>
                </div>
                
                <button onclick="shareReferralLink()" class="btn-primary w-full py-3 rounded-xl text-sm font-semibold">
                    📤 Share Referral Link
                </button>
            </div>
            
            <div class="glass-card p-6">
                <h4 class="text-lg font-bold text-white mb-4">📊 Recent Referrals</h4>
                ${stats.referrals && stats.referrals.length > 0 ? `
                    <div class="space-y-2">
                        ${stats.referrals.slice(0, 5).map(ref => `
                            <div class="bg-slate-800/50 rounded-lg p-3 flex justify-between items-center">
                                <div>
                                    <p class="text-sm text-white">User #${ref.referred_id}</p>
                                    <p class="text-xs text-slate-400">${new Date(ref.created_at).toLocaleDateString()}</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-sm font-bold text-emerald-400">+${parseFloat(ref.credits_earned).toFixed(4)} TON</p>
                                    <p class="text-xs text-slate-400">${ref.subscription_amount.toFixed(4)} TON sub</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <p class="text-slate-400 text-center py-4">No referrals yet. Share your link to start earning!</p>
                `}
            </div>
        `;
    } catch (e) {
        console.error('Error loading referral dashboard:', e);
        container.innerHTML = '<p class="text-red-400 text-center py-6">Failed to load referral data</p>';
    }
}
window.loadReferralDashboard = loadReferralDashboard;

function copyReferralLink() {
    const input = document.getElementById('referral-link');
    if (input) {
        input.select();
        document.execCommand('copy');
        showAlert('✅ Referral link copied!');
        TG.HapticFeedback.notificationOccurred('success');
    }
}
window.copyReferralLink = copyReferralLink;

async function shareReferralLink() {
    const input = document.getElementById('referral-link');
    if (!input) return;
    
    const link = input.value;
    const message = `🎁 Join MySubHub and subscribe to premium Telegram channels!\n\nUse my referral link to get started:\n${link}\n\nWhen you subscribe, I'll earn 5% credits and you'll get access to amazing content! 🚀`;
    
    try {
        await navigator.clipboard.writeText(message);
        showAlert('✅ Referral message copied! Share it with your friends.');
        TG.HapticFeedback.notificationOccurred('success');
    } catch (e) {
        showAlert('📋 Copy this message:\n\n' + message);
    }
}
window.shareReferralLink = shareReferralLink;

// ================== START ==================
window.onload = init;
