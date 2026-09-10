window.onerror = function(message) {
    alert('JS Error: ' + message);
};

// app.js (FIXED VERSION — all queries via backend API)
const TG = window.Telegram?.WebApp || {
    ready: () => {},
    expand: () => {},
    initData: '',
    initDataUnsafe: {}
};

try {
    TG.ready();
    TG.expand();
} catch (e) {
    console.warn('Telegram WebApp init:', e);
}

// Backend API URL
const API_BASE = 'https://mslxnegbtstpdwauugmq.supabase.co/functions/v1/mainbot';

let tonConnectUI = null;
let currentNetwork = 'testnet';

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

let currentUser = null;
let isAdmin = false;
let currentPage = 'subscriptions';

// API Helper
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
            alert('Too many requests. Please wait a moment.');
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

// Page Navigation
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

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active-tab', 'text-ton-400', 'text-emerald-400', 'text-amber-400');
        btn.classList.add('text-slate-400');
    });

    const activeBtn = document.getElementById(`nav-${pageId}`);
    if (activeBtn) {
        activeBtn.classList.add('active-tab');
        activeBtn.classList.remove('text-slate-400');
    }

    if (pageId === 'subscriptions') loadSubscriptions();
    else if (pageId === 'owner') loadOwnerDashboard();
    else if (pageId === 'admin') loadAdminDashboard();

    currentPage = pageId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.switchPage = switchPage;

// Init
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

// Purchase Page - FIXED: Uses backend API
async function loadPurchasePage(channelId) {
    console.log('Loading purchase page for channel:', channelId);
    
    const data = await apiFetch(`/api/channels/${channelId}`, { method: 'GET' });

    const card = document.getElementById('purchase-card');
    if (!data || data.error) {
        card.innerHTML = `<p class="text-red-400 text-center py-6">Channel not found</p>`;
        return;
    }

    const NETWORK_FEE_TON = 0.05;
    const platformFee = data.subscription_price * 0.01;
    const total = data.subscription_price + platformFee + NETWORK_FEE_TON;

    card.innerHTML = `
        <div class="text-center mb-6">
            <h2 class="text-2xl font-bold text-white tracking-tight">${data.channel_name}</h2>
            <p class="text-slate-400 mt-2 text-sm">
                Subscription: <strong class="text-white font-mono text-base">${total.toFixed(6)} TON</strong> / ${data.duration_days} days
            </p>
        </div>
        <button id="btn-pay" class="btn-primary w-full text-white font-semibold py-3.5 rounded-xl">
            Pay with TON
        </button>
    `;
    
    document.getElementById('btn-pay').onclick = () => initiatePayment(data.id, data.subscription_price);
    if (window.lucide) lucide.createIcons();
}

// Payment - FIXED: Proper channel_id handling
async function initiatePayment(channelId, price) {
    console.log('Initiating payment for channel:', channelId);
    
    try {
        // Step 1: Get payment details from backend
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

        // Step 2: Send transaction
        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 360,
            messages: [{
                address: initRes.wallet,
                amount: initRes.amountNano,
            }],
        };

        console.log('Sending transaction:', transaction);
        const result = await tonConnectUI.sendTransaction(transaction);
        console.log('Transaction result:', result);
        
        const boc = result.boc;

        // Step 3: Confirm payment with backend
        console.log('Confirming payment for channel:', channelId);
        const confirmRes = await apiFetch('/api/subscriptions/confirm', {
            method: 'POST',
            body: JSON.stringify({ 
                channel_id: channelId,  // Make sure this is the correct UUID
                boc: boc 
            }),
        });

        if (confirmRes.success) {
            alert('Subscription successful!');
            switchPage('subscriptions');
            loadSubscriptions();
        } else {
            alert('Payment confirmation failed: ' + confirmRes.error);
        }
    } catch (e) {
        console.error('Payment error:', e);
        alert('Payment error: ' + e.message);
    }
}

// Subscriptions
async function loadSubscriptions() {
    try {
        const subs = await apiFetch('/api/subscriptions/my');
        const list = document.getElementById('subscriptions-list');

        if (!subs || !subs.length) {
            list.innerHTML = `<div class="glass-card p-10 text-center text-slate-400">No subscriptions yet.</div>`;
            return;
        }

        list.innerHTML = subs.map(s => {
            const channel = s.channel || {};
            return `
                <div class="glass-card p-4">
                    <h3 class="font-semibold text-white">${channel.channel_name || 'Unknown'}</h3>
                    <p class="text-slate-400 text-sm">Expires: ${new Date(s.end_date).toLocaleDateString()}</p>
                    <span class="badge ${s.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}">
                        ${s.status}
                    </span>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error('Error loading subscriptions:', e);
    }
}

// Owner Dashboard
async function loadOwnerDashboard() {
    try {
        const channels = await apiFetch('/api/channels/my');
        const container = document.getElementById('channels-list');

        if (!channels || !channels.length) {
            container.innerHTML = '<div class="text-center text-slate-400 py-6">No channels yet.</div>';
            return;
        }

        container.innerHTML = channels.map(ch => `
            <div class="glass-card p-4">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-semibold text-white">${ch.channel_name}</h3>
                        <p class="text-slate-400 text-sm">${ch.subscription_price} TON / ${ch.duration_days} days</p>
                    </div>
                    <label class="flex items-center gap-2 text-xs">
                        Active: <input type="checkbox" ${ch.is_active ? 'checked' : ''} onchange="toggleChannel('${ch.id}', this.checked)" class="accent-blue-500">
                    </label>
                </div>
                <div class="flex gap-4 mt-3">
                    <button onclick="openEditModal('${ch.id}')" class="text-blue-400 text-xs">Edit</button>
                    <button onclick="copyDeepLink('${ch.id}')" class="text-blue-400 text-xs">Copy Link</button>
                </div>
            </div>
        `).join('');

        loadWithdrawalSection();
    } catch (e) {
        console.error('Error loading owner dashboard:', e);
    }
}

// Channel Edit
let editingChannelId = null;

async function openEditModal(channelId) {
    editingChannelId = channelId;
    const data = await apiFetch(`/api/channels/${channelId}`, { method: 'GET' });
    if (data && !data.error) {
        document.getElementById('edit-price').value = data.subscription_price;
        document.getElementById('edit-duration').value = data.duration_days;
    }
    document.getElementById('edit-modal').classList.remove('hidden');
}

window.openEditModal = openEditModal;

const modalCancelBtn = document.getElementById('modal-cancel');
if (modalCancelBtn) {
    modalCancelBtn.onclick = () => {
        document.getElementById('edit-modal').classList.add('hidden');
        editingChannelId = null;
    };
}

const modalSaveBtn = document.getElementById('modal-save');
if (modalSaveBtn) {
    modalSaveBtn.onclick = async () => {
        const price = parseFloat(document.getElementById('edit-price').value);
        const duration = parseInt(document.getElementById('edit-duration').value);
        if (editingChannelId) {
            await apiFetch(`/api/channels/${editingChannelId}`, {
                method: 'PUT',
                body: JSON.stringify({ subscription_price: price, duration_days: duration }),
            });
        }
        document.getElementById('edit-modal').classList.add('hidden');
        loadOwnerDashboard();
    };
}

// Add Channel
function openAddChannelModal() {
    document.getElementById('add-channel-modal').classList.remove('hidden');
}
function closeAddChannelModal() {
    document.getElementById('add-channel-modal').classList.add('hidden');
}
async function submitAddChannel() {
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
    const link = `https://t.me/MySubsHub_bot?start=${channelId}`;
    navigator.clipboard.writeText(link).then(() => alert('Link copied!'));
}
window.copyDeepLink = copyDeepLink;

async function toggleChannel(channelId, isActive) {
    await apiFetch(`/api/channels/${channelId}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: isActive }),
    });
}
window.toggleChannel = toggleChannel;

// Withdrawals
async function loadWithdrawalSection() {
    const data = await apiFetch('/api/withdrawals/my');
    const section = document.getElementById('withdrawal-section');
    section.innerHTML = `
        <h3 class="text-lg font-semibold text-white mb-2">Earnings</h3>
        <p class="text-slate-400">Pending: <strong class="text-white">${(data.pendingEarnings || 0).toFixed(6)} TON</strong></p>
        <button onclick="requestWithdrawal()" class="btn-primary mt-3 text-white px-4 py-2 rounded-xl text-sm">Request Withdrawal</button>
    `;
}

async function requestWithdrawal() {
    const amount = prompt('Enter amount in TON:');
    if (!amount) return;
    const res = await apiFetch('/api/withdrawals/request', { 
        method: 'POST', 
        body: JSON.stringify({ amount: parseFloat(amount) }) 
    });
    if (res.success) {
        alert('Withdrawal requested');
        loadOwnerDashboard();
    } else {
        alert('Error: ' + (res.error || ''));
    }
}
window.requestWithdrawal = requestWithdrawal;

// Admin
async function loadAdminDashboard() {
    const reports = await apiFetch('/api/admin/reports');
    const withdrawals = await apiFetch('/api/admin/withdrawals');
    // Simplified for now
}

// Language
function openLanguageModal() {
    document.getElementById('language-modal').classList.remove('hidden');
}
function closeLanguageModal() {
    document.getElementById('language-modal').classList.add('hidden');
}
function selectLanguage(lang) {
    setLanguage(lang);
    closeLanguageModal();
}

window.openLanguageModal = openLanguageModal;
window.closeLanguageModal = closeLanguageModal;
window.selectLanguage = selectLanguage;

window.onload = init;
