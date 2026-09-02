// app.js (merged: working logic + new UI)
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

const SUPABASE_URL = 'https://mslxnegbtstpdwauugmq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zbHhuZWdidHN0cGR3YXV1Z21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1Mjk0NDUsImV4cCI6MjEwMjEwNTQ0NX0.l1rEfiEmPSPItqx1OdvX1T52LpwP5DlJr8gWhbJXcgA';
const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

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
const ADMIN_TELEGRAM_ID = '8876444295'; // <-- Replace with your actual Telegram ID
const NETWORK_FEE_TON = 0.05;

let currentUser = null;
let isAdmin = false;

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

function switchPage(pageId) {
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

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showPage(pageId) {
    switchPage(pageId);
}
window.switchPage = switchPage;
window.showPage = showPage;

async function init() {
    applyTranslations();

    try {
        const res = await apiFetch('/api/auth/validate', { method: 'POST' });
        currentUser = res?.user || null;

        const navBar = document.getElementById('nav-bar');
        if (navBar) navBar.classList.remove('hidden');

        // Admin detection
        const fromUnsafe = TG.initDataUnsafe?.user?.id;
        const fromCurrentUser = currentUser?.telegram_id;
        const fromInitData = (() => {
            try {
                const params = new URLSearchParams(TG.initData);
                const userParam = params.get('user');
                if (userParam) return JSON.parse(userParam).id;
            } catch (e) {}
            return null;
        })();

        const tgUserId = fromUnsafe || fromCurrentUser || fromInitData;
        const adminIdNum = Number(ADMIN_TELEGRAM_ID);
        if (tgUserId !== undefined && tgUserId !== null) {
            isAdmin = (tgUserId.toString() === ADMIN_TELEGRAM_ID) || (Number(tgUserId) === adminIdNum);
        } else {
            isAdmin = false;
        }

        const adminTab = document.getElementById('nav-admin');
        if (adminTab) {
            adminTab.style.setProperty('display', isAdmin ? 'flex' : 'none', 'important');
        }

        // Show owner tab always (for now)
        const ownerTab = document.getElementById('nav-owner');
        if (ownerTab) ownerTab.style.setProperty('display', 'flex', 'important');

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
    const total = data.subscription_price + platformFee + NETWORK_FEE_TON;

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
                <div class="flex justify-between"><span>Network fee:</span> <span class="text-slate-200">${NETWORK_FEE_TON.toFixed(2)} TON</span></div>
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
            switchPage('subscriptions');
            loadSubscriptions();
        } else {
            alert('Payment confirmation failed: ' + confirmRes.error);
        }
    } catch (e) {
        console.error('Payment error:', e);
        alert(e.message || 'Payment failed');
    }
}

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
                }
            });
        }

        document.getElementById('stat-active').textContent = activeCount;
        document.getElementById('stat-expiring').textContent = expiringSoonCount;
        document.getElementById('stat-spent').textContent = `${totalSpent.toFixed(2)} TON`;

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
        document.getElementById('subscriptions-list').innerHTML = `<div class="glass-card p-10 text-center text-slate-400 font-medium">${t('subscriptions.no_subs')}</div>`;
    }
}

async function loadOwnerDashboard() {
    try {
        const channels = await apiFetch('/api/channels/my');
        const container = document.getElementById('channels-list');

        document.getElementById('owner-stat-channels').textContent = (channels && channels.length) || 0;
        document.getElementById('owner-stat-subs').textContent = 0; // Replace with real count later

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
                if (!walletAddress) walletAddress = prompt('Enter your TON Wallet address:');
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

// Include all other functions (edit modal, add channel, withdrawals, rating, report, admin, language) from previous working app.js
// They are identical to the Google Studio version; ensure they are present.

// ...

window.onload = init;
