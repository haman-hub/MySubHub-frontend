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

// Supabase client (read-only for channels)
const SUPABASE_URL = 'https://mslxnegbtstpdwauugmq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zbHhuZWdidHN0cGR3YXV1Z21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1Mjk0NDUsImV4cCI6MjEwMjEwNTQ0NX0.l1rEfiEmPSPItqx1OdvX1T52LpwP5DlJr8gWhbJXcgA';
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// TON Connect UI
let tonConnectUI = null;
try {
    if (window.TON_CONNECT_UI) {
        tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
            manifestUrl: window.location.origin + '/manifest.json',
            buttonRootId: 'ton-connect-button',
            network: 'testnet'
        });
    }
} catch (e) {
    console.warn('TON Connect init:', e);
}

const API_BASE = 'https://mslxnegbtstpdwauugmq.supabase.co/functions/v1/mainbot';
const ADMIN_TELEGRAM_ID = '8876444295'; // Admin Telegram ID

let currentUser = null;
let isAdmin = false;

// Helpers
async function apiFetch(url, options = {}) {
    const initData = TG.initData || '';
    const headers = {
        'x-telegram-initdata': initData,
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // If initData is not available (e.g. standard browser preview outside Telegram), handle gracefully
    if (!initData) {
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
        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || `HTTP ${res.status}`);
        }
        return res.json();
    } catch (err) {
        if (url === '/api/auth/validate') return { user: null };
        if (url === '/api/subscriptions/my') return [];
        if (url === '/api/channels/my') return [];
        if (url === '/api/withdrawals/my') return { pendingEarnings: 0, withdrawals: [] };
        if (url === '/api/admin/reports') return [];
        if (url === '/api/admin/withdrawals') return [];
        throw err;
    }
}

function switchPage(pageId) {
    // If a non-admin attempts to switch to the admin view, redirect to subscriptions
    if (pageId === 'admin' && !isAdmin) {
        pageId = 'subscriptions';
    }

    // 1. Explicitly hide all main page sections using both style.display and classes
    const allPages = ['purchase', 'subscriptions', 'owner', 'admin'];
    allPages.forEach(p => {
        const sec = document.getElementById(`page-${p}`);
        if (sec) {
            sec.style.display = 'none';
            sec.classList.add('hidden-page');
        }
    });

    // 2. Explicitly show the requested page
    const target = document.getElementById(`page-${pageId}`);
    if (target) {
        target.style.display = 'block';
        target.classList.remove('hidden-page');
    }

    // 3. Highlight the active bottom navigation tab and reset inactive tabs
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

    // 4. Automatically trigger relevant data loader
    if (pageId === 'subscriptions') {
        loadSubscriptions();
    } else if (pageId === 'owner') {
        loadOwnerDashboard();
    } else if (pageId === 'admin') {
        loadAdminDashboard();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Keep showPage as an alias
function showPage(pageId) {
    switchPage(pageId);
}

// Global exposure
window.switchPage = switchPage;
window.showPage = showPage;

// Init
async function init() {
    applyTranslations();

    try {
        const res = await apiFetch('/api/auth/validate', { method: 'POST' });
        currentUser = res?.user || null;

        const navBar = document.getElementById('nav-bar');
        if (navBar) navBar.classList.remove('hidden');

        // ---------- ROBUST ADMIN DETECTION ----------
        // 1. From initDataUnsafe
        const fromUnsafe = TG.initDataUnsafe?.user?.id;
        // 2. From database user object
        const fromCurrentUser = currentUser?.telegram_id;
        // 3. From raw initData string (if initDataUnsafe is missing)
        const fromInitData = (() => {
            try {
                const params = new URLSearchParams(TG.initData);
                const userParam = params.get('user');
                if (userParam) {
                    const userObj = JSON.parse(userParam);
                    return userObj.id;
                }
            } catch (e) {}
            return null;
        })();

        const tgUserId = fromUnsafe || fromCurrentUser || fromInitData;
        const adminIdNum = Number(ADMIN_TELEGRAM_ID);

        // Compare as string or number
        if (tgUserId !== undefined && tgUserId !== null) {
            isAdmin = (tgUserId.toString() === ADMIN_TELEGRAM_ID) || (Number(tgUserId) === adminIdNum);
        } else {
            isAdmin = false;
        }

        // Force show/hide admin tab
        const adminTab = document.getElementById('nav-admin');
        if (adminTab) {
            if (isAdmin) {
                adminTab.style.setProperty('display', 'flex', 'important');
                adminTab.classList.remove('hidden');
            } else {
                adminTab.style.setProperty('display', 'none', 'important');
                adminTab.classList.add('hidden');
            }
        }

        // Fallback: if currentUser is admin but isAdmin still false
        if (!isAdmin && currentUser && currentUser.telegram_id && currentUser.telegram_id.toString() === ADMIN_TELEGRAM_ID) {
            isAdmin = true;
            if (adminTab) {
                adminTab.style.setProperty('display', 'flex', 'important');
                adminTab.classList.remove('hidden');
            }
        }

        // TON Connect status handler
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

        // Determine start parameter and navigate
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

        // Debug log – remove after testing
        console.log('Admin detection:', { tgUserId, isAdmin, ADMIN_TELEGRAM_ID, fromUnsafe, fromCurrentUser, fromInitData });
    } catch (error) {
        console.error('Init error:', error);
        const navBar = document.getElementById('nav-bar');
        if (navBar) navBar.classList.remove('hidden');
        const adminTab = document.getElementById('nav-admin');
        if (adminTab) adminTab.style.setProperty('display', 'none', 'important');
        switchPage('subscriptions');
    }
}

// Purchase Page
async function loadPurchasePage(channelId) {
    if (!supabaseClient) return;
    const { data, error } = await supabaseClient
        .from('channels')
        .select('*')
        .eq('id', channelId)
        .single();

    const card = document.getElementById('purchase-card');
    if (error || !data) {
        card.innerHTML = `<p class="text-red-400 text-center py-6">${t('purchase.not_found')}</p>`;
        return;
    }

    const platformFee = data.subscription_price * 0.01;
    const networkFee = 0.05;
    const total = data.subscription_price + platformFee + networkFee;

    card.innerHTML = `
        <div class="text-center mb-6">
            <div class="w-16 h-16 mx-auto rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                <i data-lucide="zap" class="w-8 h-8 text-blue-400"></i>
            </div>
            <h2 class="text-2xl font-bold text-white tracking-tight">${data.channel_name}</h2>
            <p class="text-slate-400 mt-2 text-sm">
                ${t('purchase.subscription')} <strong class="text-white font-mono text-base">${total.toFixed(2)} TON</strong> ${t('purchase.per')} ${data.duration_days} ${t('purchase.days')}
            </p>
            <div class="mt-5 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2 text-left font-mono">
                <div class="flex justify-between"><span>Base price:</span> <span class="text-slate-200">${data.subscription_price} TON</span></div>
                <div class="flex justify-between"><span>Platform fee (1%):</span> <span class="text-slate-200">${platformFee.toFixed(2)} TON</span></div>
                <div class="flex justify-between"><span>Network fee:</span> <span class="text-slate-200">${networkFee.toFixed(2)} TON</span></div>
                <div class="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm text-white"><span>Total:</span> <span class="text-blue-400">${total.toFixed(2)} TON</span></div>
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

        if (!tonConnectUI) throw new Error('TON Connect not initialized');

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
            showPage('subscriptions');
            loadSubscriptions();
        } else {
            alert('Payment confirmation failed: ' + confirmRes.error);
        }
    } catch (e) {
        console.error('Payment error:', e);
        alert(e.message || 'Payment failed');
    }
}

// Subscriptions
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
                    if (daysLeft >= 0 && daysLeft <= 7) {
                        expiringSoonCount++;
                    }
                }
            });
        }

        const statActiveEl = document.getElementById('stat-active');
        const statExpiringEl = document.getElementById('stat-expiring');
        const statSpentEl = document.getElementById('stat-spent');
        if (statActiveEl) statActiveEl.textContent = activeCount;
        if (statExpiringEl) statExpiringEl.textContent = expiringSoonCount;
        if (statSpentEl) statSpentEl.textContent = `${totalSpent.toFixed(2)} TON`;

        if (!subs || !subs.length) {
            list.innerHTML = `<div class="glass-card p-10 text-center text-slate-400 font-medium">${t('subscriptions.no_subs')}</div>`;
            return;
        }

        list.innerHTML = subs.map(s => `
            <div class="glass-card p-5 hover:border-slate-700 transition">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-semibold text-white text-base">${s.channel?.channel_name || 'Channel'}</h3>
                        <p class="text-slate-400 text-xs mt-1">${t('subscriptions.expires')} ${new Date(s.end_date).toLocaleDateString()}</p>
                    </div>
                    <span class="badge ${s.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}">${s.status === 'active' ? t('subscriptions.status.active') : t('subscriptions.status.expired')}</span>
                </div>
                <div class="flex gap-4 mt-4 pt-3 border-t border-slate-800/80">
                    <button onclick="openRating('${s.channel_id}')" class="text-xs text-amber-400 hover:text-amber-300 transition flex items-center gap-1.5 font-medium">⭐ ${t('subscriptions.rate')}</button>
                    <button onclick="openReport('${s.channel_id}')" class="text-xs text-rose-400 hover:text-rose-300 transition flex items-center gap-1.5 font-medium">🚩 ${t('subscriptions.report')}</button>
                </div>
                ${s.status !== 'active' ? `<button onclick="renewSubscription('${s.id}')" class="btn-primary mt-3 w-full text-white text-xs py-2 rounded-xl font-medium">${t('subscriptions.renew')}</button>` : ''}
            </div>
        `).join('');

        if (window.lucide) lucide.createIcons();
    } catch (e) {
        console.error('Error loading subscriptions:', e);
        const list = document.getElementById('subscriptions-list');
        if (list) list.innerHTML = `<div class="glass-card p-10 text-center text-slate-400 font-medium">${t('subscriptions.no_subs')}</div>`;
    }
}

async function renewSubscription(subId) {
    alert('Renewal process initiated.');
}

// Owner Dashboard
async function loadOwnerDashboard() {
    try {
        const channels = await apiFetch('/api/channels/my');
        console.log('Raw channels response:', channels);
        document.getElementById('debug-output').textContent = 'Channels API response: ' + JSON.stringify(channels, null, 2);
        const container = document.getElementById('channels-list');

        const statChannelsEl = document.getElementById('owner-stat-channels');
        const statSubsEl = document.getElementById('owner-stat-subs');
        if (statChannelsEl) statChannelsEl.textContent = (channels && channels.length) || 0;
        if (statSubsEl) statSubsEl.textContent = 0;

        if (!channels || !channels.length) {
            container.innerHTML = `<div class="glass-card p-8 text-center text-slate-400 text-sm">No channels added yet.</div>`;
        } else {
            container.innerHTML = channels.map(ch => `
                <div class="glass-card p-5 hover:border-slate-700 transition">
                    <div class="flex justify-between items-start">
                        <div>
                            <h3 class="font-semibold text-white text-base">${ch.channel_name}</h3>
                            <p class="text-slate-400 text-xs mt-1 font-mono">${ch.subscription_price} TON / ${ch.duration_days} ${t('purchase.days')}</p>
                            <p class="text-slate-500 font-mono text-xs mt-1 truncate max-w-xs">${ch.channel_invite_link || ''}</p>
                        </div>
                        <label class="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                            ${t('owner.active')}: <input type="checkbox" ${ch.is_active ? 'checked' : ''} onchange="toggleChannel('${ch.id}', this.checked)" class="accent-blue-500 w-4 h-4 cursor-pointer">
                        </label>
                    </div>
                    <div class="flex items-center gap-4 mt-4 pt-3 border-t border-slate-800/80">
                        <button onclick="openEditModal('${ch.id}')" class="text-blue-400 hover:text-blue-300 text-xs transition font-medium">${t('owner.edit')}</button>
                        <button onclick="copyDeepLink('${ch.id}')" class="text-blue-400 hover:text-blue-300 text-xs transition font-medium">${t('owner.copy_link')}</button>
                    </div>
                </div>
            `).join('');
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
                if (!walletAddress) {
                    walletAddress = prompt('Enter your TON Wallet address:');
                }
                if (walletAddress) {
                    const res = await apiFetch('/api/auth/wallet', {
                        method: 'POST',
                        body: JSON.stringify({ wallet_address: walletAddress }),
                    });
                    if (res.success) {
                        document.getElementById('current-wallet').innerText = walletAddress;
                        alert(t('owner.wallet_saved'));
                    }
                }
            } catch (e) {
                console.warn("Wallet error:", e);
            }
        };

        loadWithdrawalSection();
        if (window.lucide) lucide.createIcons();
    } catch (e) {
        console.error('Error loading owner dashboard:', e);
    }
}

// Channel Edit
let editingChannelId = null;
function openEditModal(channelId) {
    editingChannelId = channelId;
    if (supabaseClient) {
        supabaseClient.from('channels').select('*').eq('id', channelId).single().then(({ data }) => {
            if (data) {
                document.getElementById('edit-price').value = data.subscription_price;
                document.getElementById('edit-duration').value = data.duration_days;
                document.getElementById('edit-renewal').checked = data.auto_renewal_reminders;
            }
            document.getElementById('edit-modal').classList.remove('hidden');
        }).catch(() => {
            document.getElementById('edit-modal').classList.remove('hidden');
        });
    } else {
        document.getElementById('edit-modal').classList.remove('hidden');
    }
}

document.getElementById('modal-cancel').onclick = () => {
    document.getElementById('edit-modal').classList.add('hidden');
    editingChannelId = null;
};

document.getElementById('modal-save').onclick = async () => {
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
    if (!channel_name || !channel_invite_link) return alert(t('error.generic'));
    
    const res = await apiFetch('/api/channels/register', {
        method: 'POST',
        body: JSON.stringify({ channel_name, channel_invite_link }),
    });
    if (res && res.error) return alert(t('error.generic') + ' ' + res.error);
    
    document.getElementById('add-channel-name').value = '';
    document.getElementById('add-channel-link').value = '';
    closeAddChannelModal();
    loadOwnerDashboard();
}

function copyDeepLink(channelId) {
    const link = `https://t.me/MySubsHub_bot?start=${channelId}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(() => {
            alert(t('owner.copy_link') + '!\n' + link);
        }).catch(() => {
            prompt('Copy invitation link:', link);
        });
    } else {
        prompt('Copy invitation link:', link);
    }
}

async function toggleChannel(channelId, isActive) {
    await apiFetch(`/api/channels/${channelId}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: isActive }),
    });
}

// Withdrawals
async function loadWithdrawalSection() {
    try {
        const data = await apiFetch('/api/withdrawals/my');
        const section = document.getElementById('withdrawal-section');
        const pending = (data && typeof data.pendingEarnings === 'number') ? data.pendingEarnings : 0;
        
        const ownerEarningsStat = document.getElementById('owner-stat-earnings');
        if (ownerEarningsStat) ownerEarningsStat.textContent = `${pending.toFixed(2)} TON`;

        section.innerHTML = `
            <h3 class="text-base font-semibold text-white mb-2 flex items-center gap-2"><i data-lucide="trending-up" class="w-4 h-4 text-emerald-400"></i>${t('owner.withdrawal_earnings')}</h3>
            <p class="text-slate-400 text-sm">${t('owner.withdrawal_pending')} <strong class="text-white font-mono">${pending.toFixed(4)} TON</strong></p>
            <button onclick="requestWithdrawal()" class="btn-primary mt-3 text-white px-4 py-2 rounded-xl text-xs flex items-center gap-2">
                <i data-lucide="arrow-up-right" class="w-3.5 h-3.5"></i>
                ${t('owner.withdrawal_request')}
            </button>
            <div class="mt-4 space-y-2 border-t border-slate-800/80 pt-3">${(data && data.withdrawals) ? data.withdrawals.map(w => `<div class="flex justify-between items-center text-xs"><span class="text-slate-300 font-mono">${w.amount} TON</span> <span class="badge ${w.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}">${w.status}</span></div>`).join('') : ''}</div>
        `;
        if (window.lucide) lucide.createIcons();
    } catch (e) {
        console.error('Withdrawals error:', e);
    }
}

async function requestWithdrawal() {
    const amount = prompt(t('owner.withdrawal_amount_prompt'));
    if (!amount) return;
    const res = await apiFetch('/api/withdrawals/request', { method: 'POST', body: JSON.stringify({ amount: parseFloat(amount) }) });
    if (res && res.success) {
        alert(t('owner.withdrawal_request_success'));
        loadOwnerDashboard();
    } else {
        alert(t('owner.withdrawal_request_error') + ' ' + ((res && res.error) || ''));
    }
}

// Rating & Reporting
let ratingChannelId = null, reportChannelId = null, selectedRating = 0;

function openRating(channelId) {
    ratingChannelId = channelId;
    document.getElementById('rating-modal').classList.remove('hidden');
    const container = document.getElementById('star-rating');
    container.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.textContent = i <= selectedRating ? '★' : '☆';
        star.className = 'cursor-pointer text-amber-400 text-2xl select-none';
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

// Admin Dashboard
async function loadAdminDashboard() {
    loadAdminReports();
    loadAdminWithdrawals();
}
async function loadAdminReports() {
    try {
        const reports = await apiFetch('/api/admin/reports');
        const container = document.getElementById('admin-reports');
        if (!reports || !reports.length) {
            container.innerHTML = `<div class="glass-card p-6 text-center text-slate-500 text-xs">No active reports.</div>`;
            return;
        }
        container.innerHTML = reports.map(r => `
            <div class="glass-card p-4 hover:border-slate-700 transition">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-semibold text-white text-sm">${r.channel?.channel_name || 'Channel'}</h3>
                        <p class="text-slate-300 text-xs mt-1"><span class="text-amber-400 font-medium">${r.reason}:</span> ${r.description}</p>
                        <p class="text-slate-500 text-xs mt-2 font-mono">Reporter: ${r.reporter?.first_name || 'User'} (@${r.reporter?.username || 'user'})</p>
                    </div>
                    <span class="badge bg-amber-500/10 text-amber-400 border border-amber-500/30">${r.status}</span>
                </div>
                <div class="flex gap-2 mt-4 pt-3 border-t border-slate-800/80">
                    <button onclick="reviewReport('${r.id}', 'ban')" class="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold transition">${t('admin.ban')}</button>
                    <button onclick="reviewReport('${r.id}', 'dismiss')" class="btn-secondary px-3 py-1.5 rounded-xl text-xs text-slate-300 font-medium">${t('admin.dismiss')}</button>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error('Reports error:', e);
    }
}
async function reviewReport(reportId, action) {
    await apiFetch(`/api/admin/reports/${reportId}/review`, { method: 'POST', body: JSON.stringify({ action }) });
    alert(`Report ${action === 'ban' ? 'banned' : 'dismissed'}.`);
    loadAdminReports();
}
async function loadAdminWithdrawals() {
    try {
        const withdrawals = await apiFetch('/api/admin/withdrawals');
        const container = document.getElementById('admin-withdrawals');
        if (!withdrawals || !withdrawals.length) {
            container.innerHTML = `<div class="glass-card p-6 text-center text-slate-500 text-xs">No pending withdrawals.</div>`;
            return;
        }
        container.innerHTML = withdrawals.map(w => `
            <div class="glass-card p-4 hover:border-slate-700 transition">
                <div class="flex justify-between items-center">
                    <div>
                        <h3 class="font-semibold text-white text-sm">${w.owner?.first_name || 'Owner'} (@${w.owner?.username || 'user'})</h3>
                        <p class="text-blue-400 font-mono font-bold text-xs mt-1">${w.amount} TON</p>
                        <p class="text-slate-500 text-xs mt-1 font-mono break-all">Wallet: ${w.owner?.wallet_address || 'Not set'}</p>
                    </div>
                    <span class="badge bg-amber-500/10 text-amber-400 border border-amber-500/30">${w.status}</span>
                </div>
                <button onclick="approveWithdrawal('${w.id}')" class="btn-primary mt-3 w-full text-white px-3 py-2 rounded-xl text-xs font-semibold">${t('admin.approve_pay')}</button>
            </div>
        `).join('');
    } catch (e) {
        console.error('Withdrawals error:', e);
    }
}
async function approveWithdrawal(id) {
    const res = await apiFetch(`/api/admin/withdrawals/${id}/approve`, { method: 'POST' });
    if (res && res.success) {
        alert(t('admin.approve_pay') + '!');
        loadAdminWithdrawals();
    } else {
        alert(t('error.generic') + ' ' + ((res && res.error) || ''));
    }
}

// Language Modal
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

window.onload = init;
