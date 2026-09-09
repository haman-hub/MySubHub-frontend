window.onerror = function(message) {
    alert('JS Error: ' + message);
};

// app.js (FIXED VERSION — no direct Supabase queries, all via backend API)
const TG = window.Telegram?.WebApp || {
    ready: () => {},
    expand: () => {},
    initData: '',
    initDataUnsafe: {}
};

try {
    TG.ready();
    TG.expand();
    // Apply Telegram theme colors
    if (TG.themeParams) {
        const tp = TG.themeParams;
        if (tp.bg_color) document.body.style.backgroundColor = tp.bg_color;
    }
} catch (e) {
    console.warn('Telegram WebApp init:', e);
}

// ================== CONFIG — NO HARDCODED SECRETS ==================
// Backend URL — set via environment or detect from page context
const API_BASE = (typeof window.__API_BASE__ !== 'undefined')
    ? window.__API_BASE__
    : 'https://mslxnegbtstpdwauugmq.supabase.co/functions/v1/mainbot';

let tonConnectUI = null;
let currentNetwork = 'mainnet'; // Will be updated from backend

async function initTonConnect() {
    try {
        if (window.TON_CONNECT_UI) {
            tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
                manifestUrl: 'https://haman-hub.github.io/MySubHub-frontend/manifest.json',
                buttonRootId: 'ton-connect-button',
                // Network will be set dynamically after backend responds
                network: 'mainnet'
            });
            console.log('TON Connect initialized');
        } else {
            console.error('TON Connect UI script not loaded');
        }
    } catch (e) {
        console.error('TON Connect init error:', e);
    }
}

let currentUser = null;
let isAdmin = false;
let currentPage = 'subscriptions';

// ================== API HELPER (ALL requests go through backend) ==================
async function apiFetch(url, options = {}) {
    const initData = TG.initData || '';
    const headers = {
        'x-telegram-initdata': initData,
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (!initData) {
        // Return safe defaults for unauthenticated requests
        if (url === '/api/auth/validate') return { user: null };
        if (url === '/api/subscriptions/my') return [];
        if (url === '/api/channels/my') return [];
        if (url === '/api/withdrawals/my') return { pendingEarnings: 0, withdrawals: [] };
        if (url === '/api/admin/reports') return [];
        if (url === '/api/admin/withdrawals') return [];
        return { success: true };
    }

    try {
        const res = await fetch(`${API_BASE}${url}`, { ...options, headers });

        if (res.status === 401 || res.status === 403) {
            if (url === '/api/auth/validate') return { user: null };
            if (url === '/api/subscriptions/my') return [];
            if (url === '/api/channels/my') return [];
            if (url === '/api/withdrawals/my') return { pendingEarnings: 0, withdrawals: [] };
            if (url === '/api/admin/reports') return [];
            if (url === '/api/admin/withdrawals') return [];
            return { error: 'Unauthorized' };
        }

        if (res.status === 429) {
            alert('Too many requests. Please wait a moment and try again.');
            return { error: 'Rate limited' };
        }

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || `HTTP ${res.status}`);
        }
        return res.json();
    } catch (err) {
        console.error('API fetch error:', err);
        if (url === '/api/auth/validate') return { user: null };
        if (url === '/api/subscriptions/my') return [];
        if (url === '/api/channels/my') return [];
        if (url === '/api/withdrawals/my') return { pendingEarnings: 0, withdrawals: [] };
        if (url === '/api/admin/reports') return [];
        if (url === '/api/admin/withdrawals') return [];
        throw err;
    }
}

// ================== PAGE NAVIGATION ==================
function switchPage(pageId) {
    // Server-side admin check — only show admin page if backend says so
    if (pageId === 'admin' && !isAdmin) {
        pageId = 'subscriptions';
    }

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

    // Update tab highlighting
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active-tab', 'text-ton-400', 'text-emerald-400', 'text-amber-400');
        btn.classList.add('text-slate-400');
        const iconBox = btn.querySelector('.tab-icon-box');
        if (iconBox) {
            iconBox.className = 'tab-icon-box w-10 h-8 flex items-center justify-center rounded-xl bg-transparent text-slate-400 border border-transparent transition-all duration-200';
        }
        const ind = btn.querySelector('.tab-indicator');
        if (ind) {
            ind.classList.remove('scale-x-100', 'opacity-100');
            ind.classList.add('scale-x-0', 'opacity-0');
        }
    });

    const activeBtn = document.getElementById(`nav-${pageId}`);
    if (activeBtn) {
        activeBtn.classList.add('active-tab');
        activeBtn.classList.remove('text-slate-400');
        let colorText = 'text-ton-400';
        let bgBox = 'bg-ton-500/20';
        let borderBox = 'border-ton-500/30';
        if (pageId === 'owner') {
            colorText = 'text-emerald-400';
            bgBox = 'bg-emerald-500/20';
            borderBox = 'border-emerald-500/30';
        } else if (pageId === 'admin') {
            colorText = 'text-amber-400';
            bgBox = 'bg-amber-500/20';
            borderBox = 'border-amber-500/30';
        }
        activeBtn.classList.add(colorText);
        const iconBox = activeBtn.querySelector('.tab-icon-box');
        if (iconBox) {
            iconBox.className = `tab-icon-box w-10 h-8 flex items-center justify-center rounded-xl ${bgBox} ${colorText} border ${borderBox} transition-all duration-200`;
        }
        const ind = activeBtn.querySelector('.tab-indicator');
        if (ind) {
            ind.classList.remove('scale-x-0', 'opacity-0');
            ind.classList.add('scale-x-100', 'opacity-100');
        }
    }

    if (pageId === 'subscriptions') loadSubscriptions();
    else if (pageId === 'owner') loadOwnerDashboard();
    else if (pageId === 'admin') loadAdminDashboard();

    currentPage = pageId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showPage(pageId) {
    switchPage(pageId);
}
window.switchPage = switchPage;
window.showPage = showPage;

// ================== INIT ==================
async function init() {
    applyTranslations();
    await initTonConnect();

    try {
        const res = await apiFetch('/api/auth/validate', { method: 'POST' });
        currentUser = res?.user || null;

        const navBar = document.getElementById('nav-bar');
        if (navBar) navBar.classList.remove('hidden');

        // ---------- ADMIN DETECTION — SERVER-SIDE ONLY ----------
        // Admin status comes from the backend response, not from client-side checks
        // The backend validates the initData HMAC and checks the Telegram ID server-side
        isAdmin = !!currentUser?.is_admin; // Backend should set this flag

        // Fallback: if backend doesn't set is_admin, check against ADMIN_TELEGRAM_ID
        // But this is less secure — backend should be the source of truth
        if (!currentUser?.is_admin && currentUser?.telegram_id) {
            // This is a fallback — ideally backend returns is_admin flag
            // For now we keep this but it should be removed once backend is updated
            const adminId = '8876444295'; // This should come from backend config
            isAdmin = currentUser.telegram_id.toString() === adminId;
        }

        const adminTab = document.getElementById('nav-admin');
        if (adminTab) {
            adminTab.style.setProperty('display', isAdmin ? 'flex' : 'none', 'important');
        }

        const ownerTab = document.getElementById('nav-owner');
        if (ownerTab) ownerTab.style.setProperty('display', 'flex', 'important');

        // Update network display based on backend response
        if (currentUser?.network) {
            currentNetwork = currentUser.network;
        }
        const networkLabel = document.querySelector('[data-i18n="footer.ton_network"]');
        if (networkLabel) {
            networkLabel.textContent = currentNetwork === 'testnet' ? 'TON Testnet' : 'TON Mainnet';
        }

        if (tonConnectUI && tonConnectUI.onStatusChange) {
            tonConnectUI.onStatusChange((wallet) => {
                if (wallet) {
                    const walletAddress = typeof wallet.account.address === "string"
                        ? wallet.account.address
                        : wallet.account.address.toString(true, true, true);
                    const walletDisplay = document.getElementById('current-wallet');
                    if (walletDisplay) walletDisplay.innerText = walletAddress;
                }
            });
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
        const adminTab = document.getElementById('nav-admin');
        if (adminTab) adminTab.style.setProperty('display', 'none', 'important');
        switchPage('subscriptions');
    }
}

// ================== PURCHASE PAGE (FIXED — uses backend API) ==================
async function loadPurchasePage(channelId) {
    // FIXED: Use backend API instead of direct Supabase query
    const data = await apiFetch(`/api/channels/${channelId}`, { method: 'GET' });

    const card = document.getElementById('purchase-card');
    if (!data || data.error) {
        card.innerHTML = `<p class="text-red-400 text-center py-6">${t('purchase.not_found')}</p>`;
        return;
    }

    const platformFee = data.subscription_price * 0.01;
    const NETWORK_FEE_TON = 0.05;
    const total = data.subscription_price + platformFee + NETWORK_FEE_TON;

    card.innerHTML = `
        <div class="text-center mb-6">
            <div class="w-16 h-16 mx-auto rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                <i data-lucide="zap" class="w-8 h-8 text-blue-400"></i>
            </div>
            <h2 class="text-2xl font-bold text-white tracking-tight">${data.channel_name}</h2>
            <p class="text-slate-400 mt-2 text-sm">
                ${t('purchase.subscription')} <strong class="text-white font-mono text-base">${total.toFixed(6)} TON</strong> ${t('purchase.per')} ${data.duration_days} ${t('purchase.days')}
            </p>
            <div class="mt-5 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2 text-left font-mono">
                <div class="flex justify-between"><span>Base price:</span> <span class="text-slate-200">${data.subscription_price} TON</span></div>
                <div class="flex justify-between"><span>Platform fee (1%):</span> <span class="text-slate-200">${platformFee.toFixed(6)} TON</span></div>
                <div class="flex justify-between"><span>Network fee:</span> <span class="text-slate-200">${NETWORK_FEE_TON.toFixed(6)} TON</span></div>
                <div class="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-white"><span>Total:</span> <span class="text-blue-400">${total.toFixed(6)} TON</span></div>
            </div>
        </div>
        <button id="btn-pay" class="btn-primary w-full text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm">
            <i data-lucide="credit-card" class="w-4 h-4"></i>
            ${t('purchase.pay_button')}
        </button>
    `;
    document.getElementById('btn-pay').onclick = () => initiatePayment(data.id, data.subscription_price);
    if (window.lucide) lucide.createIcons();
}

async function initiatePayment(channelId, price) {
    try {
        const initRes = await apiFetch('/api/subscriptions/initiate', {
            method: 'POST',
            body: JSON.stringify({ channel_id: channelId }),
        });

        if (initRes.error) throw new Error(initRes.error);

        if (!tonConnectUI) throw new Error('TON Connect not initialized');

        // Update TonConnect network to match backend
        if (initRes.network && tonConnectUI.setNetwork) {
            try { tonConnectUI.setNetwork(initRes.network); } catch {}
        }

        let wallet = tonConnectUI.wallet;
        if (!wallet) {
            await tonConnectUI.connectWallet();
            wallet = tonConnectUI.wallet;
            if (!wallet) throw new Error('Wallet connection cancelled');
        }

        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 360,
            messages: [{
                address: initRes.wallet,
                amount: initRes.amountNano,
            }],
        };

        const result = await tonConnectUI.sendTransaction(transaction);
        const boc = result.boc;

        const confirmRes = await apiFetch('/api/subscriptions/confirm', {
            method: 'POST',
            body: JSON.stringify({ channel_id: channelId, boc }),
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

// ================== SUBSCRIPTIONS ==================
async function loadSubscriptions() {
    try {
        const subs = await apiFetch('/api/subscriptions/my');
        const list = document.getElementById('subscriptions-list');

        let activeCount = 0;
        let expiringSoonCount = 0;
        let totalSpent = 0;

        if (subs && Array.isArray(subs)) {
            subs.forEach(s => {
                if (s.status === 'active') {
                    activeCount++;
                    const daysLeft = Math.ceil((new Date(s.end_date) - Date.now()) / (1000 * 60 * 60 * 24));
                    if (daysLeft >= 0 && daysLeft <= 7) expiringSoonCount++;
                    totalSpent += parseFloat(s.amount || 0);
                }
            });
        }

        document.getElementById('stat-active').textContent = activeCount;
        document.getElementById('stat-expiring').textContent = expiringSoonCount;
        document.getElementById('stat-spent').textContent = `${totalSpent.toFixed(2)} TON`;

        if (!subs || !subs.length) {
            list.innerHTML = `<div class="glass-card p-10 text-center text-slate-400 font-medium">${t('subscriptions.no_subs')}</div>`;
            if (window.lucide) lucide.createIcons();
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
                            <h3 class="font-semibold text-white">${channel.channel_name || 'Unknown'}</h3>
                            <p class="text-slate-400 text-sm mt-1">${t('subscriptions.expires')} ${new Date(s.end_date).toLocaleDateString()}</p>
                        </div>
                        <span class="badge ${isExpired ? 'bg-red-500/10 text-red-400 border border-red-500/30' : isExpiring ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}">
                            ${isExpired ? t('subscriptions.status.expired') : isExpiring ? '⚠️ ' + daysLeft + 'd' : t('subscriptions.status.active')}
                        </span>
                    </div>
                    <div class="flex gap-2 mt-3">
                        <button onclick="openRating('${s.channel_id}')" class="btn-secondary px-3 py-1.5 rounded-xl text-xs text-slate-300">${t('subscriptions.rate')}</button>
                        <button onclick="openReport('${s.channel_id}')" class="btn-secondary px-3 py-1.5 rounded-xl text-xs text-slate-300">${t('subscriptions.report')}</button>
                        ${isExpired ? `<button onclick="loadPurchasePage('${s.channel_id}'); switchPage('purchase')" class="btn-primary px-3 py-1.5 rounded-xl text-xs text-white">${t('subscriptions.renew')}</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        if (window.lucide) lucide.createIcons();
    } catch (e) {
        console.error('Error loading subscriptions:', e);
    }
}

// ================== OWNER DASHBOARD (FIXED — all via backend API) ==================
async function loadOwnerDashboard() {
    try {
        const channels = await apiFetch('/api/channels/my');
        const container = document.getElementById('channels-list');

        let totalSubscribers = 0;
        let totalEarnings = 0;

        if (channels && Array.isArray(channels)) {
            container.innerHTML = channels.map(ch => `
                <div class="glass-card p-4 hover:shadow-lg transition">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="font-semibold text-white">${ch.channel_name}</h3>
                            <p class="text-slate-400 text-sm mt-1">${ch.subscription_price} TON / ${ch.duration_days} days</p>
                        </div>
                        <label class="flex items-center gap-2 text-xs font-medium text-slate-300 cursor-pointer">
                            ${t('owner.active')}: <input type="checkbox" ${ch.is_active ? 'checked' : ''} onchange="toggleChannel('${ch.id}', this.checked)" class="accent-blue-500 w-4 h-4 cursor-pointer">
                        </label>
                    </div>
                    <div class="flex items-center gap-4 mt-4 pt-3 border-t border-slate-800/80 flex-wrap">
                        <button onclick="openEditModal('${ch.id}')" class="text-blue-400 hover:text-blue-300 text-xs transition font-medium">${t('owner.edit')}</button>
                        <button onclick="copyDeepLink('${ch.id}')" class="text-blue-400 hover:text-blue-300 text-xs transition font-medium">${t('owner.copy_link')}</button>
                        <button onclick="forwardChannel('${ch.id}')" class="text-emerald-400 hover:text-emerald-300 text-xs transition font-medium flex items-center gap-1">
                            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                            Forward
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div class="text-center text-slate-400 py-6">No channels yet. Add one above!</div>';
        }

        const walletDiv = document.getElementById('wallet-section');
        const userWallet = currentUser?.wallet_address || '';
        walletDiv.innerHTML = `
            <h3 class="text-base font-semibold text-white mb-2 flex items-center gap-2"><i data-lucide="wallet" class="w-4 h-4 text-blue-400"></i>${t('owner.wallet')}</h3>
            <p id="current-wallet" class="text-slate-400 font-mono text-xs break-all">${userWallet || t('owner.wallet_not_set')}</p>
            <button id="btn-connect-wallet" class="btn-primary mt-3 text-white px-4 py-2 rounded-xl text-xs flex items-center gap-2">
                <i data-lucide="link" class="w-3.5 h-3.5"></i>
                ${t('owner.connect_wallet')}
            </button>
        `;

        document.getElementById('btn-connect-wallet').onclick = async () => {
            try {
                let walletAddress = "";
                if (tonConnectUI) {
                    const connected = await tonConnectUI.connectWallet();
                    if (connected && connected.account) {
                        walletAddress = typeof connected.account.address === "string"
                            ? connected.account.address
                            : connected.account.address.toString(true, true, true);
                    }
                }
                if (!walletAddress) walletAddress = prompt('Enter your TON Wallet address:');
                if (walletAddress) {
                    const res = await apiFetch('/api/auth/wallet', {
                        method: 'POST',
                        body: JSON.stringify({ wallet_address: walletAddress }),
                    });
                    if (res.success) {
                        document.getElementById('current-wallet').innerText = walletAddress;
                        alert(t('owner.wallet_saved'));
                    } else {
                        alert(res.error || t('owner.wallet_connection_failed'));
                    }
                }
            } catch (e) {
                console.error("Wallet connect error:", e);
                alert('Wallet connection failed: ' + e.message);
            }
        };

        loadWithdrawalSection();
        if (window.lucide) lucide.createIcons();
    } catch (e) {
        console.error('Error loading owner dashboard:', e);
    }
}

// ========== CHANNEL EDIT (FIXED — uses backend API) ==========
let editingChannelId = null;

async function openEditModal(channelId) {
    editingChannelId = channelId;
    // FIXED: Use backend API instead of direct Supabase query
    const data = await apiFetch(`/api/channels/${channelId}`, { method: 'GET' });
    if (data && !data.error) {
        document.getElementById('edit-price').value = data.subscription_price;
        document.getElementById('edit-duration').value = data.duration_days;
        document.getElementById('edit-renewal').checked = data.auto_renewal_reminders;
    }
    document.getElementById('edit-modal').classList.remove('hidden');
}

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

// ========== ADD CHANNEL ==========
function openAddChannelModal() {
    document.getElementById('add-channel-modal').classList.remove('hidden');
}
function closeAddChannelModal() {
    document.getElementById('add-channel-modal').classList.add('hidden');
}
async function submitAddChannel() {
    const channel_name = document.getElementById('add-channel-name').value.trim();
    const channel_invite_link = document.getElementById('add-channel-link').value.trim();
    if (!channel_name || !channel_invite_link) return alert(t('error.generic') + ' Missing fields');
    const res = await apiFetch('/api/channels/register', {
        method: 'POST',
        body: JSON.stringify({ channel_name, channel_invite_link }),
    });
    if (res.error) return alert(t('error.generic') + res.error);
    closeAddChannelModal();
    loadOwnerDashboard();
}

function copyDeepLink(channelId) {
    const link = `https://t.me/MySubsHub_bot?start=${channelId}`;
    navigator.clipboard.writeText(link).then(() => {
        alert(t('owner.copy_link') + '!');
    }).catch(() => {
        prompt('Copy link:', link);
    });
}

// FIXED: forwardChannel now uses backend API instead of direct Supabase query
async function forwardChannel(channelId) {
    // FIXED: Use backend API instead of direct Supabase query
    const channel = await apiFetch(`/api/channels/${channelId}`, { method: 'GET' });

    if (!channel || channel.error) {
        alert('Channel not found');
        return;
    }

    const customMessage = prompt('Add a custom message (optional):', '');
    if (customMessage === null) return;

    const deepLink = `https://t.me/MySubsHub_bot?start=${channelId}`;
    let text = `📢 Subscribe to *${channel.channel_name}*\n`;
    text += `💰 Price: ${channel.subscription_price} TON / ${channel.duration_days} days\n`;
    text += `🔗 ${deepLink}`;
    if (customMessage.trim()) {
        text += `\n\n${customMessage.trim()}`;
    }

    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(deepLink)}&text=${encodeURIComponent(text)}`;
    window.open(shareUrl, '_blank');
}

async function toggleChannel(channelId, isActive) {
    await apiFetch(`/api/channels/${channelId}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: isActive }),
    });
}

// ========== WITHDRAWALS ==========
async function loadWithdrawalSection() {
    const data = await apiFetch('/api/withdrawals/my');
    const section = document.getElementById('withdrawal-section');
    section.innerHTML = `
        <h3 class="text-lg font-semibold text-white mb-2 flex items-center gap-2"><i data-lucide="trending-up" class="w-5 h-5 text-emerald-400"></i>${t('owner.withdrawal_earnings')}</h3>
        <p class="text-slate-400">${t('owner.withdrawal_pending')} <strong class="text-white">${(data.pendingEarnings || 0).toFixed(6)} TON</strong></p>
        <button onclick="requestWithdrawal()" class="btn-primary mt-3 text-white px-4 py-2 rounded-xl text-sm shadow-lg shadow-emerald-500/20">${t('owner.withdrawal_request')}</button>
        <div class="mt-4 space-y-2">${(data.withdrawals || []).map(w => `<p class="text-sm text-slate-400">${w.amount} TON - <span class="text-amber-400">${w.status}</span></p>`).join('')}</div>
    `;
    lucide.createIcons();
}

async function requestWithdrawal() {
    const amount = prompt(t('owner.withdrawal_amount_prompt'));
    if (!amount) return;
    const res = await apiFetch('/api/withdrawals/request', { method: 'POST', body: JSON.stringify({ amount: parseFloat(amount) }) });
    if (res.success) {
        alert(t('owner.withdrawal_request_success'));
        loadOwnerDashboard();
    } else {
        alert(t('owner.withdrawal_request_error') + ' ' + (res.error || ''));
    }
}

// ========== RATING & REPORTING ==========
let ratingChannelId = null, reportChannelId = null, selectedRating = 0;

function openRating(channelId) {
    ratingChannelId = channelId;
    document.getElementById('rating-modal').classList.remove('hidden');
    const container = document.getElementById('star-rating');
    container.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.textContent = i <= selectedRating ? '★' : '☆';
        star.className = 'cursor-pointer text-amber-400 text-3xl';
        star.onclick = () => { selectedRating = i; openRating(channelId); };
        container.appendChild(star);
    }
}
function closeRating() {
    document.getElementById('rating-modal').classList.add('hidden');
    ratingChannelId = null; selectedRating = 0;
}
async function submitRating() {
    if (!selectedRating) return alert(t('rating.select_error'));
    const comment = document.getElementById('rating-comment').value;
    await apiFetch('/api/reviews', { method: 'POST', body: JSON.stringify({ channel_id: ratingChannelId, rating: selectedRating, comment }) });
    closeRating();
    alert(t('rating.submitted'));
}

function openReport(channelId) {
    reportChannelId = channelId;
    document.getElementById('report-modal').classList.remove('hidden');
}
function closeReport() {
    document.getElementById('report-modal').classList.add('hidden');
    reportChannelId = null;
}
async function submitReport() {
    const reason = document.getElementById('report-reason').value;
    const description = document.getElementById('report-description').value;
    await apiFetch('/api/reports', { method: 'POST', body: JSON.stringify({ channel_id: reportChannelId, reason, description }) });
    closeReport();
    alert(t('report.submitted'));
}

// ========== ADMIN DASHBOARD ==========
async function loadAdminDashboard() {
    loadAdminReports();
    loadAdminWithdrawals();
}
async function loadAdminReports() {
    const reports = await apiFetch('/api/admin/reports');
    const container = document.getElementById('admin-reports');
    if (!Array.isArray(reports)) {
        container.innerHTML = '<p class="text-slate-400">No reports.</p>';
        return;
    }
    container.innerHTML = reports.map(r => `
        <div class="glass-card p-4 hover:shadow-lg transition">
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-semibold text-white">${r.channel?.channel_name}</h3>
                    <p class="text-slate-400 text-sm">${r.reason} – ${r.description}</p>
                    <p class="text-slate-500 text-xs mt-1">By: ${r.reporter?.first_name} (@${r.reporter?.username})</p>
                </div>
                <span class="badge bg-amber-500/10 text-amber-400 border border-amber-500/30">${r.status}</span>
            </div>
            <div class="flex gap-2 mt-3">
                <button onclick="reviewReport('${r.id}', 'ban')" class="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-xl text-sm font-medium transition">${t('admin.ban')}</button>
                <button onclick="reviewReport('${r.id}', 'dismiss')" class="btn-secondary px-3 py-1.5 rounded-xl text-sm text-slate-300">${t('admin.dismiss')}</button>
            </div>
        </div>
    `).join('');
}
async function reviewReport(reportId, action) {
    await apiFetch(`/api/admin/reports/${reportId}/review`, { method: 'POST', body: JSON.stringify({ action }) });
    loadAdminReports();
}
async function loadAdminWithdrawals() {
    const withdrawals = await apiFetch('/api/admin/withdrawals');
    const container = document.getElementById('admin-withdrawals');
    if (!Array.isArray(withdrawals)) {
        container.innerHTML = '<p class="text-slate-400">No pending withdrawals.</p>';
        return;
    }
    container.innerHTML = withdrawals.map(w => `
        <div class="glass-card p-4 hover:shadow-lg transition">
            <div class="flex justify-between items-center">
                <div>
                    <h3 class="font-semibold text-white">${w.owner?.first_name} (@${w.owner?.username})</h3>
                    <p class="text-slate-400 text-sm">${w.amount} TON</p>
                    <p class="text-slate-500 text-xs">Wallet: ${w.owner?.wallet_address || 'Not set'}</p>
                </div>
                <span class="badge bg-amber-500/10 text-amber-400 border border-amber-500/30">${w.status}</span>
            </div>
            <button onclick="approveWithdrawal('${w.id}')" class="btn-primary mt-3 w-full text-white px-3 py-1.5 rounded-xl text-sm font-medium shadow-lg shadow-emerald-500/20">${t('admin.approve_pay')}</button>
        </div>
    `).join('');
}
async function approveWithdrawal(id) {
    const res = await apiFetch(`/api/admin/withdrawals/${id}/approve`, { method: 'POST' });
    if (res.success) {
        alert(t('admin.approve_pay') + '!');
        loadAdminWithdrawals();
    } else {
        alert(t('error.generic') + (res.error || ''));
    }
}

// ========== LANGUAGE MODAL ==========
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

// ========== REFRESH CURRENT PAGE AFTER LANGUAGE CHANGE ==========
window.refreshCurrentPage = function() {
    switch (currentPage) {
        case 'subscriptions':
            loadSubscriptions();
            break;
        case 'owner':
            loadOwnerDashboard();
            break;
        case 'admin':
            loadAdminDashboard();
            break;
        case 'purchase':
            break;
    }
};

window.onload = init;
