// app.js
const TG = window.Telegram.WebApp;
TG.ready();
TG.expand();

// ========== CONFIG – REPLACE THESE ==========
const SUPABASE_URL = 'https://mslxnegbtstpdwauugmq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zbHhuZWdidHN0cGR3YXV1Z21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1Mjk0NDUsImV4cCI6MjEwMjEwNTQ0NX0.l1rEfiEmPSPItqx1OdvX1T52LpwP5DlJr8gWhbJXcgA'; // ← replace with real anon key from Supabase
const API_BASE = 'https://mslxnegbtstpdwauugmq.supabase.co/functions/v1/mainbot';
const ADMIN_TELEGRAM_ID = '8876444295'; // your platform admin ID

// ========== SUPABASE CLIENT ==========
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== TON CONNECT ==========
const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
  manifestUrl: 'https://haman-hub.github.io/MySubHub-frontend/manifest.json',
  buttonRootId: 'ton-connect-button',
  network: 'testnet'
});


let currentUser = null;
let isAdmin = false;
let currentPage = 'subscriptions';

async function apiFetch(url, options = {}) {
  const initData = TG.initData;
  const headers = {
    'x-telegram-initdata': initData,
    'Content-Type': 'application/json',
  };
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });
  return res.json();
}

function showPage(pageId) {
  currentPage = pageId;
  document.querySelectorAll('.hidden-page').forEach(el => el.classList.add('hidden-page'));
  const page = document.getElementById(`page-${pageId}`);
  if (page) page.classList.remove('hidden-page');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========== INIT ==========
async function init() {
  applyTranslations();
  try {
    const res = await apiFetch('/api/auth/validate', { method: 'POST', body: JSON.stringify({}) });
    
    if (res.user) {
      currentUser = res.user;
      document.getElementById('nav-bar').classList.remove('hidden');
      document.getElementById('nav-owner').style.display = 'inline-block';

      if (currentUser.id.toString() === ADMIN_TELEGRAM_ID) {
        isAdmin = true;
        document.getElementById('nav-admin').style.display = 'inline-block';
      }

      tonConnectUI.onStatusChange((wallet) => {
        if (wallet) {
          const walletAddress = typeof wallet.account.address === "string"
            ? wallet.account.address
            : wallet.account.address?.toString(true, true, true);
          const walletDisplay = document.getElementById('current-wallet');
          if (walletDisplay) walletDisplay.innerText = walletAddress || t('owner.wallet_not_set');
        }
      });

      //const startParam = TG.initDataUnsafe?.start_param;
      const urlStart = new URLSearchParams(window.location.search).get('startapp');
const startParam = TG.initDataUnsafe?.start_param || urlStart;
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
    }
  } catch (error) {
    console.error('Init error:', error);
  }
}

// ========== PURCHASE PAGE ==========
async function loadPurchasePage(channelId) {
  const { data, error } = await supabaseClient
    .from('channels')
    .select('*')
    .eq('id', channelId)
    .single();
  const card = document.getElementById('purchase-card');
  if (error || !data) {
    card.innerHTML = `<p class="text-red-400">${t('purchase.not_found')}</p>`;
    return;
  }

  const platformFee = data.subscription_price * 0.01;
  const networkFee = 0.05; // should match backend
  const total = data.subscription_price + platformFee + networkFee;

  card.innerHTML = `
    <div class="text-center mb-6">
      <div class="w-16 h-16 mx-auto rounded-2xl bg-blue-600/20 flex items-center justify-center mb-3">
        <i data-lucide="zap" class="w-8 h-8 text-blue-400"></i>
      </div>
      <h2 class="text-2xl font-bold">${data.channel_name}</h2>
      <p class="text-slate-400 mt-2">
        ${t('purchase.subscription')} <strong class="text-white">${total.toFixed(2)} TON</strong> ${t('purchase.per')} ${data.duration_days} ${t('purchase.days')}
      </p>
      <div class="mt-3 text-sm text-slate-400 space-y-1">
        <div>Base price: ${data.subscription_price} TON</div>
        <div>Platform fee (1%): ${platformFee.toFixed(2)} TON</div>
        <div>Network fee: ${networkFee.toFixed(2)} TON</div>
      </div>
    </div>
    <button id="btn-pay" class="btn-primary w-full text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/20">${t('purchase.pay_button')}</button>
  `;
  document.getElementById('btn-pay').onclick = () => initiatePayment(data.id, data.subscription_price);
  lucide.createIcons();
}

async function initiatePayment(channelId, price) {
  try {
    const initRes = await apiFetch('/api/subscriptions/initiate', {
      method: 'POST',
      body: JSON.stringify({ channel_id: channelId }),
    });
    if (!initRes.wallet) throw new Error('Failed to initiate payment');

    // No need for TonWeb – send a plain transfer
    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 360,
      messages: [{
        address: initRes.wallet,
        amount: initRes.amountNano, // already in nanoTON
        // payload omitted – backend does not verify it for MVP
      }],
    };

    const result = await tonConnectUI.sendTransaction(transaction);
    const boc = result.boc;

    const confirmRes = await apiFetch('/api/subscriptions/confirm', {
      method: 'POST',
      body: JSON.stringify({ channel_id: channelId, boc }),
    });

    if (confirmRes.success) {
      alert('Payment successful!'); // Replace with proper success message
      showPage('subscriptions');
      loadSubscriptions();
    } else {
      alert('Payment failed: ' + (confirmRes.error || 'Unknown error'));
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
  if (!subs || !subs.length) {
    list.innerHTML = `<div class="glass-card p-6 text-center text-slate-500">${t('subscriptions.no_subs')}</div>`;
    return;
  }
  list.innerHTML = subs.map(s => `
    <div class="glass-card p-5 hover:shadow-lg transition">
      <div class="flex justify-between items-start">
        <div>
          <h3 class="font-semibold text-white text-lg">${s.channel?.channel_name || 'Channel'}</h3>
          <p class="text-slate-400 text-sm">${t('subscriptions.expires')} ${new Date(s.end_date).toLocaleDateString()}</p>
        </div>
        <span class="badge ${s.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}">${s.status === 'active' ? t('subscriptions.status.active') : t('subscriptions.status.expired')}</span>
      </div>
      <div class="flex gap-4 mt-4">
        <button onclick="openRating('${s.channel_id}')" class="text-sm text-amber-400 hover:text-amber-300 transition">⭐ ${t('subscriptions.rate')}</button>
        <button onclick="openReport('${s.channel_id}')" class="text-sm text-red-400 hover:text-red-300 transition">🚩 ${t('subscriptions.report')}</button>
      </div>
      ${s.status !== 'active' ? `<button onclick="renewSubscription('${s.id}')" class="btn-primary mt-3 w-full text-white text-sm px-4 py-2 rounded-xl">${t('subscriptions.renew')}</button>` : ''}
    </div>
  `).join('');
  lucide.createIcons();
}

async function renewSubscription(subId) {
  alert('Renewal not implemented yet');
}

// ========== OWNER DASHBOARD ==========
async function loadOwnerDashboard() {
  const channels = await apiFetch('/api/channels/my');
  const container = document.getElementById('channels-list');
  container.innerHTML = channels.map(ch => `
    <div class="glass-card p-5 hover:shadow-lg transition">
      <div class="flex justify-between items-start">
        <div>
          <h3 class="font-semibold text-white text-lg">${ch.channel_name}</h3>
          <p class="text-slate-400 text-sm">${ch.subscription_price} TON / ${ch.duration_days} ${t('purchase.days')}</p>
        </div>
        <label class="flex items-center gap-2 text-sm text-slate-300">
          ${t('owner.active')}: <input type="checkbox" ${ch.is_active ? 'checked' : ''} onchange="toggleChannel('${ch.id}', this.checked)" class="accent-blue-500">
        </label>
      </div>
      <div class="flex items-center gap-4 mt-4">
        <button onclick="openEditModal('${ch.id}')" class="text-blue-400 hover:text-blue-300 text-sm transition">${t('owner.edit')}</button>
        <button onclick="copyDeepLink('${ch.id}')" class="text-blue-400 hover:text-blue-300 text-sm transition">${t('owner.copy_link')}</button>
      </div>
    </div>
  `).join('');

  const walletDiv = document.getElementById('wallet-section');
  walletDiv.innerHTML = `
    <h3 class="text-lg font-semibold text-white mb-2 flex items-center gap-2"><i data-lucide="wallet" class="w-5 h-5 text-blue-400"></i>${t('owner.wallet')}</h3>
    <p id="current-wallet" class="text-slate-400 font-mono text-sm break-all">${t('owner.wallet_not_set')}</p>
    <button id="btn-connect-wallet" class="btn-primary mt-3 text-white px-4 py-2 rounded-xl text-sm shadow-lg shadow-blue-500/20">${t('owner.connect_wallet')}</button>
  `;
  document.getElementById('btn-connect-wallet').onclick = async () => {
    try {
      const connected = await tonConnectUI.connectWallet();
      let walletAddress = "";
      if (typeof connected.account.address === "string") {
        walletAddress = connected.account.address;
      } else if (connected.account.address?.toString) {
        walletAddress = connected.account.address.toString(true, true, true);
      } else {
        throw new Error("Could not extract wallet address");
      }
      const res = await apiFetch('/api/auth/wallet', {
        method: 'POST',
        body: JSON.stringify({ wallet_address: walletAddress }),
      });
      if (res.success) {
        document.getElementById('current-wallet').innerText = walletAddress;
        alert(t('owner.wallet_saved'));
      } else {
        alert(t('error.generic') + res.error);
      }
    } catch (e) {
      console.error("Wallet connection error:", e);
      alert(t('owner.wallet_connection_failed') + ': ' + e.message);
    }
  };

  loadWithdrawalSection();
  lucide.createIcons();
}

// ========== CHANNEL EDIT ==========
let editingChannelId = null;
function openEditModal(channelId) {
  editingChannelId = channelId;
  supabaseClient.from('channels').select('*').eq('id', channelId).single().then(({ data }) => {
    document.getElementById('edit-price').value = data.subscription_price;
    document.getElementById('edit-duration').value = data.duration_days;
    document.getElementById('edit-renewal').checked = data.auto_renewal_reminders;
    document.getElementById('edit-modal').classList.remove('hidden');
  });
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
    <p class="text-slate-400">${t('owner.withdrawal_pending')} <strong class="text-white">${data.pendingEarnings.toFixed(6)} TON</strong></p>
    <button onclick="requestWithdrawal()" class="btn-primary mt-3 text-white px-4 py-2 rounded-xl text-sm shadow-lg shadow-emerald-500/20">${t('owner.withdrawal_request')}</button>
    <div class="mt-4 space-y-2">${data.withdrawals?.map(w => `<p class="text-sm text-slate-400">${w.amount} TON - <span class="text-amber-400">${w.status}</span></p>`).join('')}</div>
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
    alert(t('owner.withdrawal_request_error') + ' ' + res.error);
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
    alert(t('error.generic') + res.error);
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
      // Optionally reload purchase page if needed
      break;
  }
};

window.onload = init;
