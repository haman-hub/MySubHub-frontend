// app.js
const TG = window.Telegram.WebApp;
TG.ready();
TG.expand();

// ========== CONFIG – REPLACE THESE ==========
const SUPABASE_URL = 'https://mslxnegbtstpdwauugmq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zbHhuZWdidHN0cGR3YXV1Z21xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1Mjk0NDUsImV4cCI6MjEwMjEwNTQ0NX0.l1rEfiEmPSPItqx1OdvX1T52LpwP5DlJr8gWhbJXcgA'; // ← replace with real anon key from Supabase
const API_BASE = 'https://mslxnegbtstpdwauugmq.supabase.co/functions/v1/mainbot';
const ADMIN_TELEGRAM_ID = '8876444295'; // your Telegram ID

// ========== SUPABASE CLIENT ==========
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== TON CONNECT ==========
const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
  manifestUrl: 'https://haman-hub.github.io/MySubHub-frontend/manifest.json',
  buttonRootId: 'ton-connect-button'
});

// ========== STATE ==========
let currentUser = null;
let isOwner = false;
let isAdmin = false;

// ========== UTILITY ==========
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
}

// ========== INIT ==========
async function init() {
  try {
    const res = await apiFetch('/api/auth/validate', { method: 'POST', body: JSON.stringify({}) });
    if (res.user) {
      currentUser = res.user;
      document.getElementById('nav-bar').classList.remove('hidden');
      // Check if owner
      const channelsRes = await apiFetch('/api/channels/my');
      isOwner = Array.isArray(channelsRes) && channelsRes.length > 0;
      if (isOwner) {
        document.getElementById('nav-owner').style.display = 'inline-block';
      }
      if (currentUser.id.toString() === ADMIN_TELEGRAM_ID) {
        isAdmin = true;
        document.getElementById('nav-admin').style.display = 'inline-block';
      }

      const startParam = TG.initDataUnsafe?.start_param;
      if (startParam && /^[0-9a-fA-F-]{36}$/.test(startParam)) {
        loadPurchasePage(startParam);
        showPage('purchase');
      } else if (startParam === 'owner' && isOwner) {
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
    card.innerHTML = '<p class="text-red-400">Channel not found.</p>';
    return;
  }
  card.innerHTML = `
    <h2 class="text-2xl font-bold">${data.channel_name}</h2>
    <p class="text-slate-400 mt-2">Subscription: <strong class="text-white">${data.subscription_price} TON</strong> / ${data.duration_days} days</p>
    <button id="btn-pay" class="mt-6 w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/20">Pay with TON</button>
  `;
  document.getElementById('btn-pay').onclick = () => initiatePayment(data.id, data.subscription_price);
}

async function initiatePayment(channelId, price) {
  const initRes = await apiFetch('/api/subscriptions/initiate', {
    method: 'POST',
    body: JSON.stringify({ channel_id: channelId }),
  });
  if (!initRes.wallet) return alert('Failed to initiate payment');
  // TON Connect transaction will be implemented later
  alert('TON payment not yet implemented in this test.');
}

// ========== SUBSCRIPTIONS PAGE ==========
async function loadSubscriptions() {
  const subs = await apiFetch('/api/subscriptions/my');
  const list = document.getElementById('subscriptions-list');
  if (!subs || !subs.length) {
    list.innerHTML = '<p class="text-slate-500">No subscriptions yet.</p>';
    return;
  }
  list.innerHTML = subs.map(s => `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <h3 class="font-semibold text-white">${s.channel?.channel_name || 'Channel'}</h3>
      <p class="text-slate-400 text-sm">Expires: ${new Date(s.end_date).toLocaleDateString()}</p>
      <span class="px-2 py-0.5 rounded text-xs font-medium ${s.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}">${s.status}</span>
    </div>
  `).join('');
}

// ========== OWNER DASHBOARD ==========
async function loadOwnerDashboard() {
  const channels = await apiFetch('/api/channels/my');
  const container = document.getElementById('channels-list');
  container.innerHTML = channels.map(ch => `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <h3 class="font-semibold text-white">${ch.channel_name}</h3>
      <p class="text-slate-400 text-sm">${ch.subscription_price} TON / ${ch.duration_days} days</p>
      <label class="flex items-center gap-2 text-sm text-slate-300 mt-2">
        Active: <input type="checkbox" ${ch.is_active ? 'checked' : ''} onchange="toggleChannel('${ch.id}', this.checked)" class="accent-blue-500">
      </label>
      <button onclick="openEditModal('${ch.id}')" class="text-blue-400 hover:text-blue-300 text-sm mt-2">Edit</button>
    </div>
  `).join('');
  lucide.createIcons();
}

async function toggleChannel(channelId, isActive) {
  await apiFetch(`/api/channels/${channelId}`, {
    method: 'PUT',
    body: JSON.stringify({ is_active: isActive }),
  });
}

// Edit modal
let editingChannelId = null;
function openEditModal(channelId) {
  editingChannelId = channelId;
  // fetch channel data and fill modal (simplified)
  document.getElementById('edit-modal').classList.remove('hidden');
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
  if (!channel_name || !channel_invite_link) return alert('Please fill all fields');
  const res = await apiFetch('/api/channels/register', {
    method: 'POST',
    body: JSON.stringify({ channel_name, channel_invite_link }),
  });
  if (res.error) return alert('Error: ' + res.error);
  closeAddChannelModal();
  loadOwnerDashboard();
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
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4">
      <p class="text-white">${r.channel?.channel_name}</p>
      <p class="text-slate-400 text-sm">${r.reason} – ${r.description}</p>
    </div>
  `).join('');
}
async function loadAdminWithdrawals() {
  const withdrawals = await apiFetch('/api/admin/withdrawals');
  const container = document.getElementById('admin-withdrawals');
  container.innerHTML = withdrawals.map(w => `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4">
      <p class="text-white">${w.owner?.first_name} – ${w.amount} TON</p>
    </div>
  `).join('');
}
// Copy channel deep link
function copyDeepLink(channelId) {
  const link = `https://t.me/MySubsHub_bot?start=${channelId}`;
  navigator.clipboard.writeText(link).then(() => {
    alert('Link copied!');
  }).catch(() => {
    prompt('Copy link:', link);
  });
}

// Approve withdrawal (admin)
async function approveWithdrawal(id) {
  const res = await apiFetch(`/api/admin/withdrawals/${id}/approve`, { method: 'POST' });
  if (res.success) {
    alert('Withdrawal processed.');
    loadAdminWithdrawals();
  } else {
    alert('Failed: ' + res.error);
  }
}
// ========== START ==========
window.onload = init;
