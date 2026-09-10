window.onerror = function(message, source, lineno) {
    console.error('App error:', message, source, lineno);
    showErrorBanner('Something went wrong. Please refresh the page.');
    return true;
};

// ================== ERROR HANDLING ==================
function showErrorBanner(message) {
    if (document.getElementById('error-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'error-banner';
    banner.className = 'fixed top-0 left-0 right-0 bg-red-500 text-white p-4 text-center z-50';
    banner.innerHTML = `
        <p>${escapeHtml(message)}</p>
        <button onclick="location.reload()" class="mt-2 px-4 py-2 bg-white text-red-500 rounded font-semibold">
            Refresh
        </button>
    `;
    document.body.prepend(banner);
}

// ================== INPUT SANITIZATION (XSS Prevention) ==================
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ================== TELEGRAM WEBAPP INIT ==================
const TG = window.Telegram?.WebApp || {
    ready: () => {},
    expand: () => {},
    initData: '',
    initDataUnsafe: {},
    themeParams: null,
    BackButton: { show: () => {}, hide: () => {}, onClick: () => {} },
    HapticFeedback: { impactOccurred: () => {}, selectionChanged: () => {}, notificationOccurred: () => {} }
};

try {
    TG.ready();
    TG.expand();
    applyTelegramTheme();
    
    // Listen for theme changes
    if (TG.onEvent) {
        TG.onEvent('themeChanged', applyTelegramTheme);
    }
} catch (e) {
    console.warn('Telegram WebApp init:', e);
}

// ================== TELEGRAM THEME INTEGRATION ==================
function applyTelegramTheme() {
    if (!TG.themeParams) return;
    
    const theme = TG.themeParams;
    
    // Set CSS variables
    document.documentElement.style.setProperty('--tg-bg-color', theme.bg_color || '#040711');
    document.documentElement.style.setProperty('--tg-text-color', theme.text_color || '#f1f5f9');
    document.documentElement.style.setProperty('--tg-button-color', theme.button_color || '#0088cc');
    document.documentElement.style.setProperty('--tg-hint-color', theme.hint_color || '#708499');
    
    // Update body
    document.body.style.backgroundColor = theme.bg_color;
    document.body.style.color = theme.text_color;
}

// ================== HAPTIC FEEDBACK ==================
function hapticFeedback(type = 'light') {
    try {
        TG.HapticFeedback.impactOccurred(type);
    } catch (e) {
        // Silent fail - haptic not available
    }
}

// ================== CONFIG ==================
const API_BASE = 'https://mslxnegbtstpdwauugmq.supabase.co/functions/v1/mainbot';

let tonConnectUI = null;
let currentNetwork = 'testnet';
let currentUser = null;
let isAdmin = false;
let currentPage = 'subscriptions';

// ================== TON CONNECT INIT ==================
async function initTonConnect() {
    try {
        if (window.TON_CONNECT_UI) {
            tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
                manifestUrl: 'https://haman-hub.github.io/MySubHub-frontend/manifest.json',
                buttonRootId: 'ton-connect-button',
                network: 'testnet'
            });
            console.log('TON Connect initialized');
        }
    } catch (e) {
        console.error('TON Connect init error:', e);
    }
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
        if (url === '/api/withdrawals/my') return { pendingEarnings: 0, withdrawals: [] };
        return { success: true };
    }

    try {
        const res = await fetch(`${API_BASE}${url}`, { ...options, headers });

        if (res.status === 401 || res.status === 403) {
            if (url === '/api/auth/validate') return { user: null };
            return { error: 'Unauthorized' };
        }

        if (res.status === 429) {
            showErrorBanner('Too many requests. Please wait a moment.');
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

    const allPages = ['purchase', 'subscriptions', 'owner', 'admin'];
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

    // Update back button
    updateBackButton(pageId);

    if (pageId === 'subscriptions') loadSubscriptions();
    else if (pageId === 'owner') loadOwnerDashboard();
    else if (pageId === 'admin') loadAdminDashboard();

    currentPage = pageId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateBackButton(pageId) {
    if (pageId === 'subscriptions') {
        TG.BackButton.hide();
    } else {
        TG.BackButton.show();
    }
}

// Handle back button click
TG.BackButton.onClick(() => {
    switchPage('subscriptions');
});

window.switchPage = switchPage;

// ================== INIT ==================
async function init() {
    applyTranslations();
    await initTonConnect();

    try {
        const res = await apiFetch('/api/auth/validate', { method: 'POST' });
        currentUser = res?.user || null;
        isAdmin = res?.is_admin || false;

        const navBar = document.getElementById('nav-bar');
        if (navBar) navBar.classList.remove('hidden');

        const adminTab = document.getElementById('nav-admin');
        if (adminTab) {
            adminTab.style.setProperty('display', isAdmin ? 'flex' : 'none', 'important');
        }

        const ownerTab = document.getElementById('nav-owner');
        if (ownerTab) ownerTab.style.setProperty('display', 'flex', 'important');

        // Update network display
        const networkLabel = document.querySelector('[data-i18n="footer.ton_network"]');
        if (networkLabel) {
            networkLabel.textContent = currentNetwork === 'testnet' ? 'TON Testnet' : 'TON Mainnet';
        }

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
        const navBar = document.getElementById('nav-bar');
        if (navBar) navBar.classList.remove('hidden');
        switchPage('subscriptions');
    }
}

// ================== PURCHASE PAGE (WITH RATING DISPLAY) ==================
async function loadPurchasePage(channelId) {
    // Show loading skeleton
    const card = document.getElementById('purchase-card');
    card.innerHTML = `
        <div class="animate-pulse">
            <div class="h-16 bg-slate-800 rounded-xl mb-4"></div>
            <div class="h-8 bg-slate-800 rounded mb-2"></div>
            <div class="h-32 bg-slate-800 rounded-xl"></div>
        </div>
    `;
    
    const data = await apiFetch(`/api/channels/${channelId}`, { method: 'GET' });

    if (!data || data.error) {
        card.innerHTML = `<p class="text-red-400 text-center py-6">Channel not found</p>`;
        return;
    }

    const NETWORK_FEE_TON = 0.05;
    const platformFee = data.subscription_price * 0.01;
    const total = data.subscription_price + platformFee + NETWORK_FEE_TON;

    // Display rating
    const ratingHtml = data.avg_rating > 0 ? `
        <div class="flex items-center justify-center gap-2 mb-4">
            <span class="text-amber-400 text-lg">${'★'.repeat(Math.round(data.avg_rating))}${'☆'.repeat(5 - Math.round(data.avg_rating))}</span>
            <span class="text-slate-400 text-sm">(${data.total_reviews} reviews)</span>
        </div>
    ` : '';

    card.innerHTML = `
        <div class="text-center mb-6">
            <h2 class="text-2xl font-bold text-white tracking-tight">${escapeHtml(data.channel_name)}</h2>
            ${ratingHtml}
            <p class="text-slate-400 mt-2 text-sm">
                Subscription: <strong class="text-white font-mono text-base">${total.toFixed(6)} TON</strong> / ${data.duration_days} days
            </p>
            <div class="mt-5 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2 text-left font-mono">
                <div class="flex justify-between"><span>Base price:</span> <span class="text-slate-200">${data.subscription_price} TON</span></div>
                <div class="flex justify-between"><span>Platform fee (1%):</span> <span class="text-slate-200">${platformFee.toFixed(6)} TON</span></div>
                <div class="flex justify-between"><span>Network fee:</span> <span class="text-slate-200">${NETWORK_FEE_TON.toFixed(6)} TON</span></div>
                <div class="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-white"><span>Total:</span> <span class="text-blue-400">${total.toFixed(6)} TON</span></div>
            </div>
        </div>
        <button id="btn-pay" class="btn-primary w-full text-white font-semibold py-3.5 rounded-xl">
            Pay with TON
        </button>
    `;
    
    document.getElementById('btn-pay').onclick = () => {
        hapticFeedback('medium');
        initiatePayment(data.id, data.subscription_price);
    };
    
    if (window.lucide) lucide.createIcons();
}

// ================== PAYMENT (TON CONNECT ONLY - NO MANUAL INPUT) ==================
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
            if (!wallet) throw new Error('Wallet connection cancelled');
        }

        // Send to owner wallet (99%) - platform fee handled separately
        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 360,
            messages: [{
                address: initRes.wallet, // Owner's wallet
                amount: initRes.amountNano,
            }],
        };

        const result = await tonConnectUI.sendTransaction(transaction);
        const boc = result.boc;

        const confirmRes = await apiFetch('/api/subscriptions/confirm', {
            method: 'POST',
            body: JSON.stringify({ 
                channel_id: channelId,
                boc: boc 
            }),
        });

        if (confirmRes.success) {
            hapticFeedback('notificationOccurred', 'success');
            alert('Subscription successful!');
            switchPage('subscriptions');
            loadSubscriptions();
        } else {
            hapticFeedback('notificationOccurred', 'error');
            alert('Payment confirmation failed: ' + confirmRes.error);
        }
    } catch (e) {
        console.error('Payment error:', e);
        hapticFeedback('notificationOccurred', 'error');
        alert('Payment error: ' + e.message);
    }
}

// ================== SUBSCRIPTIONS (WITH LOADING STATES) ==================
async function loadSubscriptions() {
    const list = document.getElementById('subscriptions-list');
    
    // Show loading skeleton
    list.innerHTML = `
        <div class="animate-pulse space-y-3">
            <div class="h-24 bg-slate-800 rounded-xl"></div>
            <div class="h-24 bg-slate-800 rounded-xl"></div>
        </div>
    `;
    
    try {
        const subs = await apiFetch('/api/subscriptions/my');

        if (!subs || !subs.length) {
            list.innerHTML = `<div class="glass-card p-10 text-center text-slate-400">No subscriptions yet.</div>`;
            return;
        }

        list.innerHTML = subs.map(s => {
            const channel = s.channel || {};
            const daysLeft = Math.ceil((new Date(s.end_date) - Date.now()) / (1000 * 60 * 60 * 24));
            const isExpired = daysLeft < 0;
            const isExpiring = daysLeft >= 0 && daysLeft <= 7;

            return `
                <div class="glass-card p-4 hover:shadow-lg transition">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="font-semibold text-white">${escapeHtml(channel.channel_name || 'Unknown')}</h3>
                            <p class="text-slate-400 text-sm mt-1">Expires: ${new Date(s.end_date).toLocaleDateString()}</p>
                        </div>
                        <span class="badge ${isExpired ? 'bg-red-500/10 text-red-400 border border-red-500/30' : isExpiring ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}">
                            ${isExpired ? 'Expired' : isExpiring ? `⚠️ ${daysLeft}d` : 'Active'}
                        </span>
                    </div>
                    <div class="flex gap-2 mt-3">
                        <button onclick="openRating('${s.channel_id}')" class="btn-secondary px-3 py-1.5 rounded-xl text-xs text-slate-300">Rate</button>
                        <button onclick="openReport('${s.channel_id}')" class="btn-secondary px-3 py-1.5 rounded-xl text-xs text-slate-300">Report</button>
                        ${isExpired ? `<button onclick="loadPurchasePage('${s.channel_id}'); switchPage('purchase')" class="btn-primary px-3 py-1.5 rounded-xl text-xs text-white">Renew</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error('Error loading subscriptions:', e);
        list.innerHTML = `<p class="text-red-400 text-center py-6">Failed to load subscriptions</p>`;
    }
}

// ================== OWNER DASHBOARD (WITH ANALYTICS & TEMPLATE GENERATOR) ==================
async function loadOwnerDashboard() {
    const container = document.getElementById('channels-list');
    
    // Show loading skeleton
    container.innerHTML = `
        <div class="animate-pulse space-y-3">
            <div class="h-32 bg-slate-800 rounded-xl"></div>
            <div class="h-32 bg-slate-800 rounded-xl"></div>
        </div>
    `;
    
    try {
        const channels = await apiFetch('/api/channels/my');

        if (!channels || !channels.length) {
            container.innerHTML = '<div class="text-center text-slate-400 py-6">No channels yet.</div>';
            return;
        }

        container.innerHTML = channels.map(ch => `
            <div class="glass-card p-4 hover:shadow-lg transition">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h3 class="font-semibold text-white">${escapeHtml(ch.channel_name)}</h3>
                        <p class="text-slate-400 text-sm mt-1">${ch.subscription_price} TON / ${ch.duration_days} days</p>
                        
                        <!-- Analytics -->
                        <div class="grid grid-cols-3 gap-2 mt-3">
                            <div class="bg-slate-900/60 p-2 rounded-lg text-center">
                                <p class="text-xs text-slate-400">Total</p>
                                <p class="text-lg font-bold text-white">${ch.total_subscribers || 0}</p>
                            </div>
                            <div class="bg-slate-900/60 p-2 rounded-lg text-center">
                                <p class="text-xs text-slate-400">Active</p>
                                <p class="text-lg font-bold text-emerald-400">${ch.active_subscribers || 0}</p>
                            </div>
                            <div class="bg-slate-900/60 p-2 rounded-lg text-center">
                                <p class="text-xs text-slate-400">Rating</p>
                                <p class="text-lg font-bold text-amber-400">${ch.avg_rating || '0.0'}⭐</p>
                            </div>
                        </div>
                    </div>
                    <label class="flex items-center gap-2 text-xs ml-4">
                        Active: <input type="checkbox" ${ch.is_active ? 'checked' : ''} onchange="toggleChannel('${ch.id}', this.checked)" class="accent-blue-500">
                    </label>
                </div>
                <div class="flex gap-4 mt-4 pt-3 border-t border-slate-800/80">
                    <button onclick="openEditModal('${ch.id}')" class="text-blue-400 text-xs">Edit</button>
                    <button onclick="copyDeepLink('${ch.id}')" class="text-blue-400 text-xs">Copy Link</button>
                    <button onclick="generateTemplate('${ch.id}')" class="text-emerald-400 text-xs">📋 Copy Template</button>
                </div>
            </div>
        `).join('');

        loadWithdrawalSection();
    } catch (e) {
        console.error('Error loading owner dashboard:', e);
        container.innerHTML = `<p class="text-red-400 text-center py-6">Failed to load channels</p>`;
    }
}

// ================== MESSAGE TEMPLATE GENERATOR ==================
async function generateTemplate(channelId) {
    hapticFeedback('selectionChanged');
    
    const channels = await apiFetch(`/api/channels/${channelId}`, { method: 'GET' });
    if (!channels || channels.error) {
        alert('Channel not found');
        return;
    }
    
    const ch = channels;
    const deepLink = `https://t.me/MySubsHub_bot?start=${ch.id}`;
    
    const template = `📢 *${ch.channel_name}*\n\n` +
                     `💰 Subscription: ${ch.subscription_price} TON\n` +
                     `📅 Duration: ${ch.duration_days} days\n` +
                     `⭐ Rating: ${ch.avg_rating || 'New'} (${ch.total_reviews || 0} reviews)\n\n` +
                     `🔗 Subscribe: ${deepLink}\n\n` +
                     `#TON #Subscription #MiniApp`;
    
    navigator.clipboard.writeText(template).then(() => {
        hapticFeedback('notificationOccurred', 'success');
        alert('Template copied to clipboard!');
    }).catch(() => {
        prompt('Copy this template:', template);
    });
}

window.generateTemplate = generateTemplate;

// ================== CHANNEL EDIT ==================
let editingChannelId = null;

async function openEditModal(channelId) {
    hapticFeedback('light');
    editingChannelId = channelId;
    const data = await apiFetch(`/api/channels/${channelId}`, { method: 'GET' });
    if (data && !data.error) {
        document.getElementById('edit-price').value = data.subscription_price;
        document.getElementById('edit-duration').value = data.duration_days;
        document.getElementById('edit-renewal').checked = data.auto_renewal_reminders;
    }
    document.getElementById('edit-modal').classList.remove('hidden');
}

window.openEditModal = openEditModal;

const modalCancelBtn = document.getElementById('modal-cancel');
if (modalCancelBtn) {
    modalCancelBtn.onclick = () => {
        hapticFeedback('light');
        document.getElementById('edit-modal').classList.add('hidden');
        editingChannelId = null;
    };
}

const modalSaveBtn = document.getElementById('modal-save');
if (modalSaveBtn) {
    modalSaveBtn.onclick = async () => {
        hapticFeedback('medium');
        const price = parseFloat(document.getElementById('edit-price').value);
        const duration = parseInt(document.getElementById('edit-duration').value);
        const renewal = document.getElementById('edit-renewal').checked;
        if (editingChannelId) {
            await apiFetch(`/api/channels/${editingChannelId}`, {
                method: 'PUT',
                body: JSON.stringify({ subscription_price: price, duration_days: duration, auto_renewal_reminders: renewal }),
            });
        }
        document.getElementById('edit-modal').classList.add('hidden');
        loadOwnerDashboard();
    };
}

// ================== ADD CHANNEL ==================
function openAddChannelModal() {
    hapticFeedback('light');
    document.getElementById('add-channel-modal').classList.remove('hidden');
}
function closeAddChannelModal() {
    hapticFeedback('light');
    document.getElementById('add-channel-modal').classList.add('hidden');
}
async function submitAddChannel() {
    hapticFeedback('medium');
    const channel_name = document.getElementById('add-channel-name').value.trim();
    const channel_invite_link = document.getElementById('add-channel-link').value.trim();
    if (!channel_name || !channel_invite_link) return alert('Missing fields');
    const res = await apiFetch('/api/channels/register', {
        method: 'POST',
        body: JSON.stringify({ channel_name, channel_invite_link }),
    });
    if (res.error) return alert(res.error);
    closeAddChannelModal();
    loadOwnerDashboard();
}

window.openAddChannelModal = openAddChannelModal;
window.closeAddChannelModal = closeAddChannelModal;
window.submitAddChannel = submitAddChannel;

function copyDeepLink(channelId) {
    hapticFeedback('selectionChanged');
    const link = `https://t.me/MySubsHub_bot?start=${channelId}`;
    navigator.clipboard.writeText(link).then(() => {
        hapticFeedback('notificationOccurred', 'success');
        alert('Link copied!');
    });
}
window.copyDeepLink = copyDeepLink;

async function toggleChannel(channelId, isActive) {
    hapticFeedback('light');
    await apiFetch(`/api/channels/${channelId}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: isActive }),
    });
}
window.toggleChannel = toggleChannel;

// ================== WALLET CONNECTION (TON CONNECT ONLY) ==================
async function loadWithdrawalSection() {
    const data = await apiFetch('/api/withdrawals/my');
    const section = document.getElementById('withdrawal-section');
    
    const userWallet = currentUser?.wallet_address || '';
    
    section.innerHTML = `
        <h3 class="text-lg font-semibold text-white mb-2">Earnings</h3>
        <p class="text-slate-400">Pending: <strong class="text-white">${(data.pendingEarnings || 0).toFixed(6)} TON</strong></p>
        
        <div class="mt-4">
            <p class="text-xs text-slate-400 mb-2">Your Wallet:</p>
            <p class="text-sm font-mono text-slate-300 break-all">${userWallet || 'Not set'}</p>
            <button id="btn-connect-wallet" class="btn-primary mt-2 text-white px-4 py-2 rounded-xl text-xs">
                ${userWallet ? 'Change Wallet' : 'Connect Wallet'}
            </button>
        </div>
        
        <button onclick="requestWithdrawal()" class="btn-primary mt-4 text-white px-4 py-2 rounded-xl text-sm">Request Withdrawal</button>
        
        <div class="mt-4 space-y-2">
            ${(data.withdrawals || []).map(w => `
                <p class="text-sm text-slate-400">${w.amount} TON - <span class="text-amber-400">${w.status}</span></p>
            `).join('')}
        </div>
    `;
    
    document.getElementById('btn-connect-wallet').onclick = async () => {
        hapticFeedback('medium');
        try {
            if (!tonConnectUI) throw new Error('TON Connect not initialized');
            
            const connected = await tonConnectUI.connectWallet();
            if (!connected?.account) throw new Error('Wallet connection cancelled');
            
            const walletAddress = connected.account.address;
            
            const res = await apiFetch('/api/auth/wallet', {
                method: 'POST',
                body: JSON.stringify({ wallet_address: walletAddress }),
            });
            
            if (res.success) {
                hapticFeedback('notificationOccurred', 'success');
                currentUser.wallet_address = walletAddress;
                loadWithdrawalSection();
                alert('Wallet connected!');
            } else {
                hapticFeedback('notificationOccurred', 'error');
                alert(res.error || 'Failed to connect wallet');
            }
        } catch (e) {
            console.error('Wallet connect error:', e);
            hapticFeedback('notificationOccurred', 'error');
            alert('Wallet connection failed: ' + e.message);
        }
    };
}

async function requestWithdrawal() {
    hapticFeedback('medium');
    const amount = prompt('Enter amount in TON:');
    if (!amount) return;
    const res = await apiFetch('/api/withdrawals/request', { 
        method: 'POST', 
        body: JSON.stringify({ amount: parseFloat(amount) }) 
    });
    if (res.success) {
        hapticFeedback('notificationOccurred', 'success');
        alert('Withdrawal requested');
        loadOwnerDashboard();
    } else {
        hapticFeedback('notificationOccurred', 'error');
        alert('Error: ' + (res.error || ''));
    }
}
window.requestWithdrawal = requestWithdrawal;

// ================== RATING & REPORTING ==================
let ratingChannelId = null, reportChannelId = null, selectedRating = 0;

function openRating(channelId) {
    hapticFeedback('light');
    ratingChannelId = channelId;
    document.getElementById('rating-modal').classList.remove('hidden');
    const container = document.getElementById('star-rating');
    container.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.textContent = i <= selectedRating ? '★' : '☆';
        star.className = 'cursor-pointer text-amber-400 text-3xl';
        star.onclick = () => { 
            selectedRating = i; 
            hapticFeedback('selectionChanged');
            openRating(channelId); 
        };
        container.appendChild(star);
    }
}
function closeRating() {
    hapticFeedback('light');
    document.getElementById('rating-modal').classList.add('hidden');
    ratingChannelId = null; selectedRating = 0;
}
async function submitRating() {
    hapticFeedback('medium');
    if (!selectedRating) return alert('Select a rating');
    const comment = document.getElementById('rating-comment').value;
    await apiFetch('/api/reviews', { method: 'POST', body: JSON.stringify({ channel_id: ratingChannelId, rating: selectedRating, comment }) });
    closeRating();
    hapticFeedback('notificationOccurred', 'success');
    alert('Review submitted!');
}

window.openRating = openRating;
window.closeRating = closeRating;
window.submitRating = submitRating;

function openReport(channelId) {
    hapticFeedback('light');
    reportChannelId = channelId;
    document.getElementById('report-modal').classList.remove('hidden');
}
function closeReport() {
    hapticFeedback('light');
    document.getElementById('report-modal').classList.add('hidden');
    reportChannelId = null;
}
async function submitReport() {
    hapticFeedback('medium');
    const reason = document.getElementById('report-reason').value;
    const description = document.getElementById('report-description').value;
    await apiFetch('/api/reports', { method: 'POST', body: JSON.stringify({ channel_id: reportChannelId, reason, description }) });
    closeReport();
    hapticFeedback('notificationOccurred', 'success');
    alert('Report submitted!');
}

window.openReport = openReport;
window.closeReport = closeReport;
window.submitReport = submitReport;

// ================== ADMIN DASHBOARD ==================
async function loadAdminDashboard() {
    const reports = await apiFetch('/api/admin/reports');
    const withdrawals = await apiFetch('/api/admin/withdrawals');
    
    const reportsContainer = document.getElementById('admin-reports');
    const withdrawalsContainer = document.getElementById('admin-withdrawals');
    
    if (!Array.isArray(reports) || reports.length === 0) {
        reportsContainer.innerHTML = '<p class="text-slate-400">No reports.</p>';
    } else {
        reportsContainer.innerHTML = reports.map(r => `
            <div class="glass-card p-4">
                <h3 class="font-semibold text-white">${escapeHtml(r.channel?.channel_name || 'Unknown')}</h3>
                <p class="text-slate-400 text-sm">${escapeHtml(r.reason)} - ${escapeHtml(r.description)}</p>
                <div class="flex gap-2 mt-3">
                    <button onclick="reviewReport('${r.id}', 'ban')" class="bg-red-600/20 text-red-400 px-3 py-1.5 rounded-xl text-sm">Ban</button>
                    <button onclick="reviewReport('${r.id}', 'dismiss')" class="btn-secondary px-3 py-1.5 rounded-xl text-sm text-slate-300">Dismiss</button>
                </div>
            </div>
        `).join('');
    }
    
    if (!Array.isArray(withdrawals) || withdrawals.length === 0) {
        withdrawalsContainer.innerHTML = '<p class="text-slate-400">No pending withdrawals.</p>';
    } else {
        withdrawalsContainer.innerHTML = withdrawals.map(w => `
            <div class="glass-card p-4">
                <h3 class="font-semibold text-white">${escapeHtml(w.owner?.first_name || 'Unknown')}</h3>
                <p class="text-slate-400 text-sm">${w.amount} TON</p>
                <button onclick="approveWithdrawal('${w.id}')" class="btn-primary mt-3 w-full text-white px-3 py-1.5 rounded-xl text-sm">Approve</button>
            </div>
        `).join('');
    }
}

async function reviewReport(reportId, action) {
    hapticFeedback('medium');
    await apiFetch(`/api/admin/reports/${reportId}/review`, { method: 'POST', body: JSON.stringify({ action }) });
    loadAdminDashboard();
}
window.reviewReport = reviewReport;

async function approveWithdrawal(id) {
    hapticFeedback('medium');
    const res = await apiFetch(`/api/admin/withdrawals/${id}/approve`, { method: 'POST' });
    if (res.success) {
        hapticFeedback('notificationOccurred', 'success');
        alert('Approved!');
        loadAdminDashboard();
    } else {
        hapticFeedback('notificationOccurred', 'error');
        alert('Error: ' + (res.error || ''));
    }
}
window.approveWithdrawal = approveWithdrawal;

// ================== LANGUAGE ==================
function openLanguageModal() {
    hapticFeedback('light');
    document.getElementById('language-modal').classList.remove('hidden');
}
function closeLanguageModal() {
    hapticFeedback('light');
    document.getElementById('language-modal').classList.add('hidden');
}
function selectLanguage(lang) {
    hapticFeedback('selectionChanged');
    setLanguage(lang);
    closeLanguageModal();
}

window.openLanguageModal = openLanguageModal;
window.closeLanguageModal = closeLanguageModal;
window.selectLanguage = selectLanguage;

// ================== OFFLINE DETECTION ==================
window.addEventListener('offline', () => {
    showErrorBanner('You are offline. Some features may not work.');
});

window.addEventListener('online', () => {
    location.reload();
});

window.onload = init;
