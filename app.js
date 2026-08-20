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
  buttonRootId: 'ton-connect-button'
});


let currentUser = null;
let isAdmin = false;

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
  document.querySelectorAll('.hidden-page').forEach(el => el.classList.add('hidden-page'));
  const page = document.getElementById(`page-${pageId}`);
  if (page) page.classList.remove('hidden-page');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

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

      const startParam = TG.initDataUnsafe?.start_param;
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
  card.innerHTML = `
    <div class="text-center mb-6">
      <div class="w-16 h-16 mx-auto rounded-2xl bg-blue-600/20 flex items-center justify-center mb-3">
        <i data-lucide="zap" class="w-8 h-8 text-blue-400"></i>
      </div>
      <h2 class="text-2xl font-bold">${data.channel_name}</h2>
      <p class="text-slate-400 mt-2">${t('purchase.subscription')} <strong class="text-white">${data.subscription_price} TON</strong> ${t('purchase.per')} ${data.duration_days} ${t('purchase.days')}</p>
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

    const tonweb = new TonWeb();
    const commentCell = new TonWeb.boc.Cell();
    commentCell.bits.writeUint(0, 32);
    commentCell.bits.writeString(initRes.memo);
    const payloadBoc = await commentCell.toBoc();
    const payloadBase64 = TonWeb.utils.bytesToBase64(payloadBoc);

    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 360,
      messages: [{
        address: initRes.wallet,
        amount: initRes.amountNano,
        payload: payloadBase64,
      }],
    };

    const result = await tonConnectUI.sendTransaction(transaction);
    const boc = result.boc;

    const confirmRes = await apiFetch('/api/subscriptions/confirm', {
      method: 'POST',
      body: JSON.stringify({ channel_id: channelId, boc }),
    });

    if (confirmRes.success) {
      alert(t('owner.wallet_saved')); // Replace with proper success message
      showPage('subscriptions');
      loadSubscriptions();
    } else {
      alert(t('error.generic') + (confirmRes.error || 'Unknown error'));
    }
  } catch (e) {
    console.error('Payment error:', e);
    alert(t('owner.wallet_connection_failed') + ': ' + e.message);
  }
}

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

// Rating & Reporting functions (unchanged, but modals now have new styles)
let ratingChannelId = null, reportChannelId = null, selectedRating = 0;
function openRating(channelId) { ... } // same as before
function closeRating() { ... }
async function submitRating() { ... }
function openReport(channelId) { ... }
function closeReport() { ... }
async function submitReport() { ... }

// Admin dashboard functions (unchanged, but updated HTML classes)
async function loadAdminDashboard() { ... }
async function loadAdminReports() { ... }
async function reviewReport(reportId, action) { ... }
async function loadAdminWithdrawals() { ... }
async function approveWithdrawal(id) { ... }

window.onload = init;
