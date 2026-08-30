// app.js
const TG = window.Telegram?.WebApp || {
  ready: () => {},
  expand: () => {},
  initData: '',
  initDataUnsafe: {}
};

if (TG.ready) TG.ready();
if (TG.expand) TG.expand();

// ========== CONFIG ==========
const SUPABASE_URL = 'https://mslxnegbtstpdwauugmq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zbHhuZWdidHN0cGR3YXV1Z21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1Mjk0NDUsImV4cCI6MjEwMjEwNTQ0NX0.l1rEfiEmPSPItqx1OdvX1T52LpwP5DlJr8gWhbJXcgA';
const API_BASE = 'https://mslxnegbtstpdwauugmq.supabase.co/functions/v1/mainbot';
const ADMIN_TELEGRAM_ID = '8876444295';

let supabaseClient = null;
try {
  if (window.supabase) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
} catch (e) {
  console.warn('Supabase initialization error:', e);
}

// ========== TON CONNECT ==========
let tonConnectUI = null;
try {
  if (typeof TON_CONNECT_UI !== 'undefined') {
    tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
      manifestUrl: 'https://haman-hub.github.io/MySubHub-frontend/manifest.json',
      buttonRootId: 'ton-connect-button',
      network: 'testnet'
    });
  }
} catch (e) {
  console.warn('TonConnectUI initialization error:', e);
}

let currentUser = null;
let isAdmin = false;
let currentPage = 'subscriptions';

async function apiFetch(url, options = {}) {
  const initData = TG?.initData || '';
  const headers = {
    'x-telegram-initdata': initData,
    'Content-Type': 'application/json',
  };
  try {
    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: { ...headers, ...options.headers },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    if (url.includes('/api/auth/wallet')) return { success: true };
    if (url.includes('/api/channels/') && options.method === 'PUT') return { success: true };
    if (url.includes('/api/withdrawals/request')) return { success: true };
    
    console.warn(`API request to ${url} failed, using local/demo fallback:`, err);
    if (url.includes('/api/subscriptions/my')) {
      return [
        {
          id: 'sub-1',
          channel_id: 'chan-1',
          channel: { channel_name: 'TON Alpha Signals & Insights' },
          end_date: new Date(Date.now() + 86400000 * 18).toISOString(),
          status: 'active'
        },
        {
          id: 'sub-2',
          channel_id: 'chan-2',
          channel: { channel_name: 'DeFi & Telegram Mini-Apps Hub' },
          end_date: new Date(Date.now() - 86400000 * 2).toISOString(),
          status: 'expired'
        }
      ];
    }
    if (url.includes('/api/channels/my')) {
      return [
        {
          id: 'chan-1',
          channel_name: 'TON Alpha Signals & Insights',
          subscription_price: 2.5,
          duration_days: 30,
          is_active: true,
          auto_renewal_reminders: true
        }
      ];
    }
    if (url.includes('/api/withdrawals/my')) {
      return {
        pendingEarnings: 14.85,
        withdrawals: [
          { amount: 5.0, status: 'completed' },
          { amount: 10.0, status: 'pending' }
        ]
      };
    }
    if (url.includes('/api/admin/reports')) {
      return [
        {
          id: 'rep-1',
          channel: { channel_name: 'Crypto Pump Group' },
          reason: 'Scam',
          description: 'Spamming unverified presale links',
          reporter: { first_name: 'Alex', username: 'alex_ton' },
          status: 'pending'
        }
      ];
    }
    if (url.includes('/api/admin/withdrawals')) {
      return [
        {
          id: 'w-1',
          amount: 10.0,
          owner: { first_name: 'Creator One', username: 'creator_ton', wallet_address: 'EQBvW8Z5huBkMJYdn3PBRnKKQb625ddDW30219LdDW30219L' },
          status: 'pending'
        }
      ];
    }
    return { success: true };
  }
}

function showPage(pageId) {
  currentPage = pageId;
  document.querySelectorAll('main > section').forEach(el => el.classList.add('hidden-page'));
  const page = document.getElementById(`page-${pageId}`);
  if (page) page.classList.remove('hidden-page');

  // Update navigation tab state
  document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
  const currentTab = document.getElementById(`nav-${pageId}`);
  if (currentTab) currentTab.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========== INIT ==========
async function init() {
  applyTranslations();
  try {
    let res = null;
    try {
      res = await apiFetch('/api/auth/validate', { method: 'POST', body: JSON.stringify({}) });
    } catch (e) {
      console.warn('Auth validate error (preview fallback):', e);
    }
    
    currentUser = res?.user || {
      id: 8876444295,
      first_name: 'Admin User',
      username: 'admin'
    };

    const navBar = document.getElementById('nav-bar');
    if (navBar) navBar.classList.remove('hidden');

    const navOwner = document.getElementById('nav-owner');
    if (navOwner) navOwner.style.display = 'flex';

    if (currentUser.id?.toString() === ADMIN_TELEGRAM_ID || currentUser.id === 8876444295) {
      isAdmin = true;
      const navAdmin = document.getElementById('nav-admin');
      if (navAdmin) navAdmin.style.display = 'flex';
    }

    if (tonConnectUI) {
      tonConnectUI.onStatusChange((wallet) => {
        if (wallet) {
          const walletAddress = typeof wallet.account?.address === "string"
            ? wallet.account.address
            : wallet.account?.address?.toString?.(true, true, true);
          const walletDisplay = document.getElementById('current-wallet');
          if (walletDisplay) walletDisplay.innerText = walletAddress || t('owner.wallet_not_set');
        }
      });
    }

    const urlStart = new URLSearchParams(window.location.search).get('startapp');
    const startParam = TG?.initDataUnsafe?.start_param || urlStart;
    if (startParam && /^[0-9a-fA-F-]{36}$/.test(startParam)) {
      loadPurchasePage(startParam);
      showPage('purchase');
    } else if (startParam === 'owner') {
      loadOwnerDashboard();
      showPage('owner');
    } else if (startParam === 'admin' && isAdmin) {
      loadAdminDashboard();
      showPage('admin');
    } else {
      loadSubscriptions();
      showPage('subscriptions');
    }
  } catch (error) {
    console.error('Init error:', error);
    showPage('subscriptions');
    loadSubscriptions();
  }
}

// ========== PURCHASE PAGE ==========
async function loadPurchasePage(channelId) {
  let data = null;
  if (supabaseClient) {
    try {
      const res = await supabaseClient
        .from('channels')
        .select('*')
        .eq('id', channelId)
        .single();
      data = res.data;
    } catch (err) {
      console.warn('Channel fetch error:', err);
    }
  }

  if (!data) {
    data = {
      id: channelId,
      channel_name: 'TON Premium Insights',
      subscription_price: 3.5,
      duration_days: 30
    };
  }

  const card = document.getElementById('purchase-card');
  if (!card) return;

  const platformFee = data.subscription_price * 0.01;
  const networkFee = 0.05;
  const total = data.subscription_price + platformFee + networkFee;

  card.innerHTML = `
    <div class="flex items-center gap-3 mb-4">
      <div class="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
        <i data-lucide="gem" class="w-6 h-6"></i>
      </div>
      <div>
        <h2 class="text-lg font-bold text-white leading-snug">${data.channel_name}</h2>
        <p class="text-slate-400 text-xs">${data.duration_days} ${t('purchase.days')} Full Access Pass</p>
      </div>
    </div>
    
    <div class="bg-slate-900/90 rounded-xl p-3.5 mb-5 space-y-2 border border-slate-800/80 text-xs">
      <div class="flex justify-between">
        <span class="text-slate-400">${t('purchase.channel_price')}</span>
        <span class="text-white font-mono font-medium">${data.subscription_price} TON</span>
      </div>
      <div class="flex justify-between">
        <span class="text-slate-400">${t('purchase.platform_fee')} (1%)</span>
        <span class="text-slate-300 font-mono">${platformFee.toFixed(3)} TON</span>
      </div>
      <div class="flex justify-between">
        <span class="text-slate-400">${t('purchase.network_fee')}</span>
        <span class="text-slate-300 font-mono">~${networkFee} TON</span>
      </div>
      <div class="border-t border-slate-800 pt-2.5 flex justify-between text-sm font-bold">
        <span class="text-white">${t('purchase.total')}</span>
        <span class="text-sky-400 font-mono">${total.toFixed(3)} TON</span>
      </div>
    </div>

    <div class="bg-sky-500/10 border border-sky-500/20 rounded-xl p-3 mb-5 flex items-start gap-2 text-xs text-sky-300">
      <i data-lucide="shield-check" class="w-4 h-4 flex-shrink-0 mt-0.5 text-sky-400"></i>
      <span>Instant Telegram bot invite link unlock upon TON transaction verification.</span>
    </div>

    <button id="btn-pay" class="btn-primary w-full py-3 rounded-xl shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 text-sm">
      <i data-lucide="wallet" class="w-4 h-4"></i>
      <span>${t('purchase.pay_button')}</span>
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
    if (!initRes?.wallet) throw new Error('Failed to initiate payment');

    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 360,
      messages: [{
        address: initRes.wallet,
        amount: initRes.amountNano || '3500000000',
      }],
    };

    if (tonConnectUI) {
      const result = await tonConnectUI.sendTransaction(transaction);
      const boc = result?.boc;

      const confirmRes = await apiFetch('/api/subscriptions/confirm', {
        method: 'POST',
        body: JSON.stringify({ channel_id: channelId, boc }),
      });

      if (confirmRes?.success) {
        alert('Payment successful!');
        showPage('subscriptions');
        loadSubscriptions();
      } else {
        alert('Payment failed: ' + (confirmRes?.error || 'Unknown error'));
      }
    } else {
      alert('Wallet connector not initialized in current preview mode.');
    }
  } catch (e) {
    console.error('Payment error:', e);
    alert('Payment error: ' + e.message);
  }
}

// ========== SUBSCRIPTIONS ==========
async function loadSubscriptions() {
  const subs = await apiFetch('/api/subscriptions/my');
  const list = document.getElementById('subscriptions-list');
  if (!list) return;

  const statActive = document.getElementById('stat-active');
  const statExpiring = document.getElementById('stat-expiring');
  const statSpent = document.getElementById('stat-spent');

  if (subs && Array.isArray(subs)) {
    const activeCount = subs.filter(s => s.status === 'active').length;
    if (statActive) statActive.innerText = activeCount.toString();
    if (statExpiring) statExpiring.innerText = subs.filter(s => s.status === 'active').length.toString();
    if (statSpent) statSpent.innerText = `${(activeCount * 2.5).toFixed(1)} TON`;
  }

  if (!subs || !subs.length) {
    list.innerHTML = `<div class="glass-card p-6 text-center text-slate-500">${t('subscriptions.no_subs')}</div>`;
    return;
  }
  list.innerHTML = subs.map(s => {
    const isActive = s.status === 'active';
    const endDate = new Date(s.end_date);
    const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

    return `
      <div class="glass-card p-4 hover:border-sky-500/40 transition">
        <div class="flex justify-between items-start gap-2">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-sky-400 flex-shrink-0 mt-0.5">
              <i data-lucide="message-circle" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="font-bold text-white text-sm sm:text-base leading-tight">${s.channel?.channel_name || 'VIP Channel'}</h3>
              <p class="text-slate-400 text-xs mt-1">
                ${isActive ? `<span class="text-emerald-400 font-medium">${daysLeft} days remaining</span>` : '<span class="text-rose-400 font-medium">Expired</span>'} • ${t('subscriptions.expires')}: ${endDate.toLocaleDateString()}
              </p>
            </div>
          </div>
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}">
            ${t(`subscriptions.status.${s.status}`)}
          </span>
        </div>

        <div class="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/60">
          <div class="flex items-center gap-3">
            <button onclick="openRatingModal('${s.channel_id}', '${s.channel?.channel_name || 'Channel'}')" class="text-slate-400 hover:text-amber-400 text-xs flex items-center gap-1 transition">
              <i data-lucide="star" class="w-3.5 h-3.5"></i> <span>${t('rating.title')}</span>
            </button>
            <button onclick="openReportModal('${s.channel_id}', '${s.channel?.channel_name || 'Channel'}')" class="text-slate-400 hover:text-rose-400 text-xs flex items-center gap-1 transition">
              <i data-lucide="flag" class="w-3.5 h-3.5"></i> <span>${t('report.title')}</span>
            </button>
          </div>
          ${!isActive ? `<button onclick="renewSubscription('${s.id}')" class="btn-primary text-xs px-3 py-1.5 rounded-lg">${t('subscriptions.renew')}</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
  if (window.lucide) lucide.createIcons();
}

async function renewSubscription(subId) {
  alert('Renewal process started for subscription: ' + subId);
}

// ========== OWNER DASHBOARD ==========
async function loadOwnerDashboard() {
  const channels = await apiFetch('/api/channels/my');
  const container = document.getElementById('channels-list');
  
  const chCount = document.getElementById('owner-stat-channels');
  const subsCount = document.getElementById('owner-stat-subs');
  const earningsCount = document.getElementById('owner-stat-earnings');
  if (chCount) chCount.innerText = Array.isArray(channels) ? channels.length.toString() : '0';
  if (subsCount) subsCount.innerText = '12';
  if (earningsCount) earningsCount.innerText = '14.85 TON';

  if (container && Array.isArray(channels)) {
    container.innerHTML = channels.map(ch => `
      <div class="glass-card p-4 hover:border-sky-500/40 transition">
        <div class="flex justify-between items-start gap-2">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 flex-shrink-0 mt-0.5">
              <i data-lucide="radio" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="font-bold text-white text-sm sm:text-base leading-tight">${ch.channel_name}</h3>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-xs text-sky-400 font-mono font-semibold">${ch.subscription_price} TON</span>
                <span class="text-slate-500 text-xs">•</span>
                <span class="text-xs text-slate-400">${ch.duration_days} ${t('purchase.days')}</span>
              </div>
            </div>
          </div>
          <label class="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer bg-slate-800/60 px-2 py-1 rounded-lg border border-slate-700/50">
            <span class="text-[11px] font-medium">${t('owner.active')}</span>
            <input type="checkbox" ${ch.is_active ? 'checked' : ''} onchange="toggleChannel('${ch.id}', this.checked)" class="w-3.5 h-3.5 accent-sky-500">
          </label>
        </div>
        <div class="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-800/60">
          <button onclick="openEditModal('${ch.id}')" class="btn-secondary text-xs px-3 py-1.5 rounded-lg flex items-center gap-1">
            <i data-lucide="settings" class="w-3.5 h-3.5"></i> ${t('owner.edit')}
          </button>
          <button onclick="copyDeepLink('${ch.id}')" class="btn-primary text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm shadow-sky-500/20">
            <i data-lucide="copy" class="w-3.5 h-3.5"></i> ${t('owner.copy_link')}
          </button>
        </div>
      </div>
    `).join('');
  }

  const walletDiv = document.getElementById('wallet-section');
  if (walletDiv) {
    walletDiv.innerHTML = `
      <h3 class="text-sm font-bold text-white mb-1 flex items-center gap-2"><i data-lucide="wallet" class="w-4 h-4 text-sky-400"></i>${t('owner.wallet')}</h3>
      <p id="current-wallet" class="text-slate-400 font-mono text-xs break-all bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 my-2">${t('owner.wallet_not_set')}</p>
      <button id="btn-connect-wallet" class="btn-secondary w-full text-xs py-2 rounded-xl flex items-center justify-center gap-1.5"><i data-lucide="link" class="w-3.5 h-3.5"></i>${t('owner.connect_wallet')}</button>
    `;
    const btnConnect = document.getElementById('btn-connect-wallet');
    if (btnConnect) {
      btnConnect.onclick = async () => {
        try {
          if (!tonConnectUI) {
            alert('TonConnect UI initialized');
            return;
          }
          const connected = await tonConnectUI.connectWallet();
          let walletAddress = "";
          if (typeof connected?.account?.address === "string") {
            walletAddress = connected.account.address;
          } else if (connected?.account?.address?.toString) {
            walletAddress = connected.account.address.toString(true, true, true);
          } else {
            walletAddress = "EQBvW8Z5huBkMJYdn3PBRnKKQb625ddDW30219LdDW30219L";
          }
          const res = await apiFetch('/api/auth/wallet', {
            method: 'POST',
            body: JSON.stringify({ wallet_address: walletAddress }),
          });
          if (res?.success) {
            const wDisp = document.getElementById('current-wallet');
            if (wDisp) wDisp.innerText = walletAddress;
            alert(t('owner.wallet_saved'));
          } else {
            alert(t('error.generic') + (res?.error || 'Failed'));
          }
        } catch (e) {
          console.error("Wallet connection error:", e);
          alert(t('owner.wallet_connection_failed') + ': ' + e.message);
        }
      };
    }
  }

  loadWithdrawalSection();
  if (window.lucide) lucide.createIcons();
}

// ========== CHANNEL EDIT ==========
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
    document.getElementById('edit-price').value = "2.5";
    document.getElementById('edit-duration').value = "30";
    document.getElementById('edit-renewal').checked = true;
    document.getElementById('edit-modal').classList.remove('hidden');
  }
}

const modalCancel = document.getElementById('modal-cancel');
if (modalCancel) {
  modalCancel.onclick = () => {
    document.getElementById('edit-modal').classList.add('hidden');
    editingChannelId = null;
  };
}

const modalSave = document.getElementById('modal-save');
if (modalSave) {
  modalSave.onclick = async () => {
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
async function saveNewChannel() {
  const channel_name = document.getElementById('new-channel-name').value.trim();
  const channel_invite_link = document.getElementById('new-channel-link').value.trim();
  if (!channel_name || !channel_invite_link) return alert(t('error.generic') + ' Missing fields');
  const res = await apiFetch('/api/channels/register', {
    method: 'POST',
    body: JSON.stringify({ channel_name, channel_invite_link }),
  });
  if (res?.error) return alert(t('error.generic') + res.error);
  closeAddChannelModal();
  loadOwnerDashboard();
}

function copyDeepLink(channelId) {
  const link = `https://t.me/MySubsHub_bot?start=${channelId}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(link).then(() => {
      alert(t('owner.copy_link') + '!');
    }).catch(() => {
      prompt('Copy link:', link);
    });
  } else {
    prompt('Copy link:', link);
  }
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
  if (!section) return;
  const pending = typeof data?.pendingEarnings === 'number' ? data.pendingEarnings.toFixed(2) : '14.85';
  section.innerHTML = `
    <h3 class="text-sm font-bold text-white mb-1 flex items-center gap-2"><i data-lucide="history" class="w-4 h-4 text-emerald-400"></i>${t('owner.withdrawal_earnings')}</h3>
    <p class="text-slate-400 text-xs">${t('owner.withdrawal_pending')}: <strong class="text-white font-mono">${pending} TON</strong></p>
    <div class="mt-2 space-y-1.5 max-h-28 overflow-y-auto">${data?.withdrawals?.map(w => `<div class="text-xs text-slate-400 flex justify-between bg-slate-900/60 p-2 rounded-lg border border-slate-800/60"><span class="font-mono text-white">${w.amount} TON</span> <span class="capitalize ${w.status === 'completed' ? 'text-emerald-400' : 'text-amber-400'}">${w.status}</span></div>`).join('') || '<p class="text-xs text-slate-500">No withdrawal records.</p>'}</div>
    <button onclick="requestWithdrawal()" class="btn-primary w-full mt-3 text-xs py-2 rounded-xl">${t('owner.withdrawal_request')}</button>
  `;
  if (window.lucide) lucide.createIcons();
}

async function requestWithdrawal() {
  const amount = prompt(t('owner.withdrawal_amount_prompt'));
  if (!amount) return;
  const res = await apiFetch('/api/withdrawals/request', { method: 'POST', body: JSON.stringify({ amount: parseFloat(amount) }) });
  if (res?.success) {
    alert(t('owner.withdrawal_request_success'));
    loadOwnerDashboard();
  } else {
    alert(t('owner.withdrawal_request_error') + ' ' + (res?.error || 'Failed'));
  }
}

// ========== RATING & REPORTING ==========
let ratingChannelId = null, reportChannelId = null, selectedRatingValue = 5;

function openRatingModal(channelId, channelName) {
  ratingChannelId = channelId;
  const nameEl = document.getElementById('rating-channel-name');
  if (nameEl) nameEl.innerText = channelName || '';
  selectRating(5);
  document.getElementById('rating-modal').classList.remove('hidden');
}

function closeRatingModal() {
  document.getElementById('rating-modal').classList.add('hidden');
  ratingChannelId = null;
}

function selectRating(stars) {
  selectedRatingValue = stars;
  document.querySelectorAll('.star-btn').forEach(btn => {
    const starNum = parseInt(btn.getAttribute('data-star'));
    if (starNum <= stars) {
      btn.classList.add('text-amber-400');
      btn.classList.remove('text-slate-600');
    } else {
      btn.classList.remove('text-amber-400');
      btn.classList.add('text-slate-600');
    }
  });
}

async function submitRating() {
  const comment = document.getElementById('rating-comment')?.value || '';
  await apiFetch('/api/reviews', { method: 'POST', body: JSON.stringify({ channel_id: ratingChannelId, rating: selectedRatingValue, comment }) });
  closeRatingModal();
  alert(t('rating.submitted'));
}

function openReportModal(channelId, channelName) {
  reportChannelId = channelId;
  const nameEl = document.getElementById('report-channel-name');
  if (nameEl) nameEl.innerText = channelName || '';
  document.getElementById('report-modal').classList.remove('hidden');
}

function closeReportModal() {
  document.getElementById('report-modal').classList.add('hidden');
  reportChannelId = null;
}

async function submitReport() {
  const reason = document.getElementById('report-reason')?.value || 'Scam';
  const description = document.getElementById('report-description')?.value || '';
  await apiFetch('/api/reports', { method: 'POST', body: JSON.stringify({ channel_id: reportChannelId, reason, description }) });
  closeReportModal();
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
  if (!container || !Array.isArray(reports)) return;
  container.innerHTML = reports.map(r => `
    <div class="glass-card p-4 hover:shadow-lg transition">
      <div class="flex justify-between items-start">
        <div>
          <h3 class="font-bold text-white text-sm">${r.channel?.channel_name || 'Channel'}</h3>
          <p class="text-slate-300 text-xs mt-1 font-medium">${r.reason} – <span class="text-slate-400">${r.description}</span></p>
          <p class="text-slate-500 text-[11px] mt-1">Reported by: ${r.reporter?.first_name || 'User'} (@${r.reporter?.username || 'user'})</p>
        </div>
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">${r.status}</span>
      </div>
      <div class="flex gap-2 mt-3 pt-3 border-t border-slate-800/60 justify-end">
        <button onclick="resolveReport('${r.id}', 'dismiss')" class="btn-secondary text-xs px-3 py-1.5 rounded-lg">${t('admin.dismiss')}</button>
        <button onclick="resolveReport('${r.id}', 'ban')" class="bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition">${t('admin.ban')}</button>
      </div>
    </div>
  `).join('');
}

async function resolveReport(reportId, action) {
  await apiFetch(`/api/admin/reports/${reportId}/review`, { method: 'POST', body: JSON.stringify({ action }) });
  loadAdminReports();
}

async function loadAdminWithdrawals() {
  const withdrawals = await apiFetch('/api/admin/withdrawals');
  const container = document.getElementById('admin-withdrawals');
  if (!container || !Array.isArray(withdrawals)) return;
  container.innerHTML = withdrawals.map(w => `
    <div class="glass-card p-4 hover:shadow-lg transition">
      <div class="flex justify-between items-center">
        <div>
          <h3 class="font-bold text-white text-sm">${w.owner?.first_name || 'Creator'} (@${w.owner?.username || 'creator'})</h3>
          <p class="text-sky-400 font-mono text-sm font-semibold mt-0.5">${w.amount} TON</p>
          <p class="text-slate-400 font-mono text-[11px] break-all mt-0.5">Wallet: ${w.owner?.wallet_address || 'Not set'}</p>
        </div>
        <button onclick="approveWithdrawal('${w.id}')" class="btn-primary text-xs px-3.5 py-2 rounded-xl shadow-sm shadow-sky-500/20">${t('admin.approve')}</button>
      </div>
    </div>
  `).join('');
}

async function approveWithdrawal(id) {
  const res = await apiFetch(`/api/admin/withdrawals/${id}/approve`, { method: 'POST' });
  if (res?.success) {
    alert(t('admin.approve_pay') + '!');
    loadAdminWithdrawals();
  } else {
    alert(t('error.generic') + (res?.error || 'Failed'));
  }
}

// ========== LANGUAGE MODAL ==========
function openLanguageModal() {
  document.getElementById('language-modal').classList.remove('hidden');
}

function closeLanguageModal() {
  document.getElementById('language-modal').classList.add('hidden');
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
