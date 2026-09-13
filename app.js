// ================== MySubHub - Complete Frontend ==================

// ================== CRITICAL: Expose ALL functions to window FIRST ==================
window.switchPage = null;
window.toggleTheme = null;
window.openLanguageModal = null;
window.closeLanguageModal = null;
window.selectLanguage = null;
window.openAddChannelModal = null;
window.closeAddChannelModal = null;
window.submitAddChannel = null;
window.openRating = null;
window.closeRating = null;
window.selectRating = null;
window.submitRating = null;
window.openReport = null;
window.closeReport = null;
window.submitReport = null;
window.renewSubscription = null;
window.joinChannel = null;
window.forwardChannel = null;
window.copyDeepLink = null;
window.toggleChannel = null;
window.openEditModal = null;
window.requestVerification = null;
window.approveWithdrawal = null;
window.reviewReport = null;
window.requestWithdrawal = null;
window.loadReferralDashboard = null;
window.copyReferralLink = null;
window.shareReferralLink = null;
window.loadSubscriptions = null;
window.loadOwnerDashboard = null;
window.loadAdminDashboard = null;

// Simple error handler
window.onerror = function(message, source, lineno) {
    console.error('Error:', message, 'at', source, 'line:', lineno);
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

// ================== THEME MANAGEMENT ==================
function applyTheme(theme) {
    currentTheme = theme;
    
    if (theme === 'system') {
        theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    document.documentElement.setAttribute('data-theme', theme);
    document.body.className = theme === 'dark' ? 'theme-dark' : 'theme-light';
    
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    }
    
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
window.toggleTheme = toggleTheme;

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
    }
    
    container.innerHTML = skeletonHTML;
}

// ================== API HELPER ==================
async function apiFetch(url, options = {}) {
    const initData = TG.initData || '';
    const headers = {
        'x-telegram-initdata': initData,
        'Content-Type': 'application/json',
        ...options.headers,
    };

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

        if (res.status === 429) {
            alert('Too many requests. Please wait.');
            return { error: 'Rate limited' };
        }

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

    if (pageId === 'subscriptions') loadSubscriptions();
    else if (pageId === 'owner') loadOwnerDashboard();
    else if (pageId === 'referrals') loadReferralDashboard();
    else if (pageId === 'admin') loadAdminDashboard();

    currentPage = pageId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
window.switchPage = switchPage;

// ================== INIT ==================
async function init() {
    try {
        const res = await apiFetch('/api/auth/validate', { method: 'POST' });
        currentUser = res?.user || null;
        isAdmin = res?.is_admin || false;

        const navBar = document.getElementById('nav-bar');
        if (navBar) navBar.classList.remove('hidden');

        const adminTab = document.getElementById('nav-admin');
        if (adminTab) adminTab.style.setProperty('display', isAdmin ? 'flex' : 'none', 'important');

        const ownerTab = document.getElementById('nav-owner');
        if (ownerTab) ownerTab.style.setProperty('display', 'flex', 'important');

        const urlStart = new URLSearchParams(window.location.search).get('startapp') || 
                         new URLSearchParams(window.location.search).get('start');
        const startParam = TG.initDataUnsafe?.start_param || urlStart;

        if (startParam && /^[0-9a-fA-F-]{36}$/.test(startParam)) {
            loadPurchasePage(startParam);
            switchPage('purchase');
        } else if (startParam === 'owner') {
            switchPage('owner');
        } else if (startParam === 'admin' && isAdmin) {
            switchPage('admin');
        } else {
            switchPage('subscriptions');
        }
    } catch (error) {
        console.error('Init error:', error);
        switchPage('subscriptions');
    }
}

// ================== SUBSCRIPTIONS ==================
async function loadSubscriptions() {
    const list = document.getElementById('subscriptions-list');
    showSkeleton('subscriptions-list', 'card', 3);
    
    try {
        const subs = await apiFetch('/api/subscriptions/my');
        
        if (!subs || !subs.length) {
            list.innerHTML = '<div class="glass-card p-10 text-center text-slate-400">No subscriptions yet.</div>';
            return;
        }

        list.innerHTML = subs.map(s => {
            const channel = s.channel || {};
            const daysLeft = Math.ceil((new Date(s.end_date) - Date.now()) / (1000 * 60 * 60 * 24));
            const isExpired = daysLeft < 0;
            const isExpiring = daysLeft >= 0 && daysLeft <= 7;
            const inviteLink = channel.channel_invite_link || '';

            return `
                <div class="glass-card p-4 mb-3">
                    <div class="flex justify-between items-start mb-2">
                        <div class="flex items-center gap-2">
                            <h3 class="font-semibold text-white">${channel.channel_name || 'Unknown'}</h3>
                            ${channel.is_verified ? '<span class="verified-badge">✓</span>' : ''}
                        </div>
                        <span class="badge ${isExpired ? 'bg-red-500/10 text-red-400' : isExpiring ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}">
                            ${isExpired ? 'Expired' : isExpiring ? '⚠️ ' + daysLeft + 'd' : 'Active'}
                        </span>
                    </div>
                    <p class="text-slate-400 text-sm mb-3">Expires: ${new Date(s.end_date).toLocaleDateString()}</p>
                    <div class="flex gap-2 flex-wrap">
                        ${!isExpired && inviteLink ? `<button onclick="joinChannel('${inviteLink}')" class="btn-primary px-3 py-1.5 rounded-xl text-xs text-white">📺 Open Channel</button>` : ''}
                        <button onclick="openRating('${s.channel_id}')" class="btn-secondary px-3 py-1.5 rounded-xl text-xs">⭐ Rate</button>
                        <button onclick="openReport('${s.channel_id}')" class="btn-secondary px-3 py-1.5 rounded-xl text-xs">🚩 Report</button>
                        ${isExpired ? `<button onclick="renewSubscription('${s.channel_id}')" class="btn-primary px-3 py-1.5 rounded-xl text-xs text-white">🔄 Renew</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error('Error loading subscriptions:', e);
        list.innerHTML = '<p class="text-red-400 text-center py-6">Failed to load subscriptions</p>';
    }
}
window.loadSubscriptions = loadSubscriptions;

function joinChannel(inviteLink) {
    if (!inviteLink) {
        alert('Invite link not available');
        return;
    }
    
    if (TG.openTelegramLink) {
        TG.openTelegramLink(inviteLink);
    } else {
        window.open(inviteLink, '_blank');
    }
    
    TG.HapticFeedback.impactOccurred('light');
}
window.joinChannel = joinChannel;

async function renewSubscription(channelId) {
    loadPurchasePage(channelId);
    switchPage('purchase');
}
window.renewSubscription = renewSubscription;

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

    card.innerHTML = `
        <div class="text-center mb-6">
            <h2 class="text-2xl font-bold text-white">${data.channel_name}</h2>
            <p class="text-slate-400 mt-2">
                Subscription: <strong class="text-white">${total.toFixed(6)} TON</strong> / ${data.duration_days} days
            </p>
        </div>
        <button id="btn-pay" class="btn-primary w-full text-white font-semibold py-3.5 rounded-xl">Pay with TON</button>
    `;
    
    document.getElementById('btn-pay').onclick = () => initiatePayment(data.id, data.subscription_price);
}

async function initiatePayment(channelId, price) {
    try {
        const initRes = await apiFetch('/api/subscriptions/initiate', {
            method: 'POST',
            body: JSON.stringify({ channel_id: channelId }),
        });

        if (initRes.error) throw new Error(initRes.error);

        if (!tonConnectUI) throw new Error('TON Connect not initialized');

        let wallet = tonConnectUI.wallet;
        if (!wallet) {
            await tonConnectUI.connectWallet();
            wallet = tonConnectUI.wallet;
        }

        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 360,
            messages: [{ address: initRes.wallet, amount: initRes.amountNano }],
        };

        const result = await tonConnectUI.sendTransaction(transaction);
        const confirmRes = await apiFetch('/api/subscriptions/confirm', {
            method: 'POST',
            body: JSON.stringify({ channel_id: channelId, boc: result.boc }),
        });

        if (confirmRes.success) {
            alert('Subscription successful!');
            switchPage('subscriptions');
        } else {
            alert('Payment failed: ' + confirmRes.error);
        }
    } catch (e) {
        alert('Payment error: ' + e.message);
    }
}

// ================== OWNER DASHBOARD ==================
async function loadOwnerDashboard() {
    const container = document.getElementById('channels-list');
    showSkeleton('channels-list', 'card', 3);
    
    try {
        const channels = await apiFetch('/api/channels/my');

        if (!channels || !channels.length) {
            container.innerHTML = '<div class="text-center text-slate-400 py-6">No channels yet.</div>';
            return;
        }

        container.innerHTML = channels.map(ch => `
            <div class="glass-card p-4 mb-3">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h3 class="font-semibold text-white">${ch.channel_name}</h3>
                        <p class="text-slate-400 text-sm">${ch.subscription_price} TON / ${ch.duration_days} days</p>
                    </div>
                    <label class="flex items-center gap-2 text-xs">
                        Active: <input type="checkbox" ${ch.is_active ? 'checked' : ''} onchange="toggleChannel('${ch.id}', this.checked)" class="accent-blue-500">
                    </label>
                </div>
                <div class="flex gap-3 pt-2 border-t border-slate-700/50">
                    <button onclick="openEditModal('${ch.id}')" class="text-blue-400 text-xs">Edit</button>
                    <button onclick="copyDeepLink('${ch.id}')" class="text-blue-400 text-xs">Copy Link</button>
                    <button onclick="forwardChannel('${ch.id}')" class="text-green-400 text-xs">📤 Forward</button>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error('Error loading channels:', e);
        container.innerHTML = '<p class="text-red-400 text-center py-6">Failed to load channels</p>';
    }
}
window.loadOwnerDashboard = loadOwnerDashboard;

function toggleChannel(channelId, isActive) {
    apiFetch(`/api/channels/${channelId}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: isActive }),
    });
}
window.toggleChannel = toggleChannel;

function copyDeepLink(channelId) {
    const link = `https://t.me/MySubsHub_bot?start=${channelId}`;
    navigator.clipboard.writeText(link).then(() => alert('Link copied!'));
}
window.copyDeepLink = copyDeepLink;

async function forwardChannel(channelId) {
    try {
        const channel = await apiFetch(`/api/channels/${channelId}`, { method: 'GET' });
        
        if (!channel || channel.error) {
            alert('Channel not found');
            return;
        }

        const deepLink = `https://t.me/MySubsHub_bot?start=${channelId}`;
        let messageText = `🚀 🌟 ${channel.channel_name} 🌟 🚀\n\n`;
        messageText += `💎 Premium Content!\n\n`;
        messageText += `💰 Subscription: ${channel.subscription_price} TON\n`;
        messageText += `📅 Duration: ${channel.duration_days} days\n\n`;
        messageText += `🔗 Subscribe Now:\n${deepLink}`;

        if (TG.openTelegramLink) {
            const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(deepLink)}&text=${encodeURIComponent(messageText)}`;
            TG.openTelegramLink(shareUrl);
        }
        
        TG.HapticFeedback.impactOccurred('medium');
    } catch (e) {
        alert('Error: ' + e.message);
    }
}
window.forwardChannel = forwardChannel;

// ================== REFERRAL DASHBOARD ==================
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

        container.innerHTML = `
            <div class="glass-card p-6 mb-4">
                <h3 class="text-xl font-bold text-white mb-4">🎁 Your Referral Program</h3>
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div class="bg-slate-800/50 rounded-xl p-4">
                        <p class="text-slate-400 text-xs mb-1">Current Balance</p>
                        <p class="text-2xl font-bold text-emerald-400">${(stats.currentBalance || 0).toFixed(4)} TON</p>
                    </div>
                    <div class="bg-slate-800/50 rounded-xl p-4">
                        <p class="text-slate-400 text-xs mb-1">Total Referrals</p>
                        <p class="text-2xl font-bold text-blue-400">${stats.totalReferrals || 0}</p>
                    </div>
                </div>
                <div class="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-4 mb-4">
                    <p class="text-sm text-slate-300 mb-2">🔗 Your Referral Link</p>
                    <div class="flex gap-2">
                        <input type="text" id="referral-link" value="${stats.referralLink || ''}" class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" readonly>
                        <button onclick="copyReferralLink()" class="btn-primary px-4 py-2 rounded-lg text-sm">📋 Copy</button>
                    </div>
                </div>
                <button onclick="shareReferralLink()" class="btn-primary w-full py-3 rounded-xl text-sm font-semibold">📤 Share</button>
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
        alert('Referral link copied!');
    }
}
window.copyReferralLink = copyReferralLink;

async function shareReferralLink() {
    const input = document.getElementById('referral-link');
    if (!input) return;
    
    const link = input.value;
    const message = `🎁 Join MySubHub!\n\n${link}\n\nEarn 5% credits on referrals!`;
    
    try {
        await navigator.clipboard.writeText(message);
        alert('Message copied!');
    } catch (e) {
        alert('Copy this:\n\n' + message);
    }
}
window.shareReferralLink = shareReferralLink;

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
            reportsContainer.innerHTML = reports.map(r => `
                <div class="glass-card p-4 border-l-4 ${r.status === 'pending' ? 'border-amber-500' : 'border-red-500'}">
                    <div class="flex justify-between items-start mb-3">
                        <span class="text-xs font-bold uppercase px-2 py-1 rounded ${r.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}">${r.status || 'pending'}</span>
                    </div>
                    <div class="space-y-3">
                        <div class="bg-slate-800/50 rounded-lg p-3">
                            <p class="text-xs text-slate-400 mb-1">📢 Reported by:</p>
                            <p class="text-sm font-semibold text-white">${r.reporter?.first_name || 'Unknown'}</p>
                        </div>
                        <div class="bg-slate-800/50 rounded-lg p-3">
                            <p class="text-xs text-slate-400 mb-1">📺 Channel:</p>
                            <p class="text-sm font-semibold text-white">${r.channel?.channel_name || 'Unknown'}</p>
                        </div>
                    </div>
                    ${r.status === 'pending' ? `
                        <div class="flex gap-2 mt-4 pt-3 border-t border-slate-700">
                            <button onclick="reviewReport('${r.id}', 'ban')" class="flex-1 bg-red-600/20 text-red-400 px-3 py-2 rounded-xl text-sm font-semibold">🚫 Ban</button>
                            <button onclick="reviewReport('${r.id}', 'dismiss')" class="flex-1 bg-green-600/20 text-green-400 px-3 py-2 rounded-xl text-sm font-semibold">✅ Dismiss</button>
                        </div>
                    ` : ''}
                </div>
            `).join('');
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
window.loadAdminDashboard = loadAdminDashboard;

async function reviewReport(reportId, action) {
    if (!confirm(action === 'ban' ? 'Ban this channel?' : 'Dismiss this report?')) return;
    
    try {
        const res = await apiFetch(`/api/admin/reports/${reportId}/review`, {
            method: 'POST',
            body: JSON.stringify({ action })
        });
        if (res.success) {
            alert(`Report ${action === 'ban' ? 'banned' : 'dismissed'}!`);
            loadAdminDashboard();
        } else {
            alert('Error: ' + (res.error || ''));
        }
    } catch (e) {
        alert('Error: ' + e.message);
    }
}
window.reviewReport = reviewReport;

async function approveWithdrawal(id) {
    const res = await apiFetch(`/api/admin/withdrawals/${id}/approve`, { method: 'POST' });
    if (res.success) {
        alert('Approved!');
        loadAdminDashboard();
    } else {
        alert('Error: ' + (res.error || ''));
    }
}
window.approveWithdrawal = approveWithdrawal;

// ================== LANGUAGE ==================
function openLanguageModal() {
    document.getElementById('language-modal')?.classList.remove('hidden');
}
window.openLanguageModal = openLanguageModal;

function closeLanguageModal() {
    document.getElementById('language-modal')?.classList.add('hidden');
}
window.closeLanguageModal = closeLanguageModal;

function selectLanguage(lang) {
    if (typeof setLanguage === 'function') {
        setLanguage(lang);
    }
    closeLanguageModal();
}
window.selectLanguage = selectLanguage;

// ================== START ==================
window.onload = init;
