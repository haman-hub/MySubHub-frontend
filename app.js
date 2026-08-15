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

// ========== STATE ==========
let currentUser = null;
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

      // Always show owner tab (users can add channels)
      document.getElementById('nav-owner').style.display = 'inline-block';

      if (currentUser.id.toString() === ADMIN_TELEGRAM_ID) {
        isAdmin = true;
        document.getElementById('nav-admin').style.display = 'inline-block';
      }

      // ========== Add TON Connect status listener here ==========
      tonConnectUI.onStatusChange((wallet) => {
        if (wallet) {
          const walletAddress = typeof wallet.account.address === "string"
            ? wallet.account.address
            : wallet.account.address?.toString(true, true, true);
          const walletDisplay = document.getElementById('current-wallet');
          if (walletDisplay) {
            walletDisplay.innerText = walletAddress || 'Not connected';
          }
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
  try {
    // 1. Get payment details from backend
    const initRes = await apiFetch('/api/subscriptions/initiate', {
      method: 'POST',
      body: JSON.stringify({ channel_id: channelId }),
    });
    if (!initRes.wallet) throw new Error('Failed to initiate payment');

    // 2. Build comment cell (op=0, string memo)
    const tonweb = new TonWeb();
    const commentCell = new TonWeb.boc.Cell();
    commentCell.bits.writeUint(0, 32); // op: 0 for text comment
    commentCell.bits.writeString(initRes.memo);
    const payloadBoc = await commentCell.toBoc();
    const payloadBase64 = TonWeb.utils.bytesToBase64(payloadBoc);

    // 3. Prepare transaction
    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 360,
      messages: [
        {
          address: initRes.wallet,
          amount: initRes.amountNano,   // string in nanoTON
          payload: payloadBase64,
        },
      ],
    };

    // 4. Send via TON Connect
    const result = await tonConnectUI.sendTransaction(transaction);
    const boc = result.boc;

    // 5. Confirm payment on backend
    const confirmRes = await apiFetch('/api/subscriptions/confirm', {
      method: 'POST',
      body: JSON.stringify({ channel_id: channelId, boc }),
    });

    if (confirmRes.success) {
      alert('Subscription activated! Check your Telegram for the invite link.');
      showPage('subscriptions');
      loadSubscriptions();
    } else {
      alert('Payment verification failed: ' + (confirmRes.error || 'Unknown error'));
    }
  } catch (e) {
    console.error('Payment error:', e);
    alert('Transaction failed: ' + e.message);
  }
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
      <div class="flex gap-2 mt-2">
        <button onclick="openRating('${s.channel_id}')" class="text-sm text-amber-400">⭐ Rate</button>
        <button onclick="openReport('${s.channel_id}')" class="text-sm text-red-400">🚩 Report</button>
      </div>
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
      <div class="flex items-center gap-4 mt-2">
        <label class="flex items-center gap-2 text-sm text-slate-300">
          Active: <input type="checkbox" ${ch.is_active ? 'checked' : ''} onchange="toggleChannel('${ch.id}', this.checked)" class="accent-blue-500">
        </label>
        <button onclick="openEditModal('${ch.id}')" class="text-blue-400 hover:text-blue-300 text-sm">Edit</button>
        <button onclick="copyDeepLink('${ch.id}')" class="text-blue-400 hover:text-blue-300 text-sm">Copy Link</button>
      </div>
    </div>
  `).join('');

  // Wallet section
// Inside loadOwnerDashboard(), replace the walletDiv block and btn-connect-wallet handler with:

const walletDiv = document.getElementById('wallet-section');
walletDiv.innerHTML = `
  <h3 class="text-lg font-semibold text-white mb-2">Payout Wallet</h3>
  <p id="current-wallet" class="text-slate-400 font-mono text-sm break-all">Not connected</p>
  <button id="btn-connect-wallet" class="mt-3 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm">Connect TON Wallet</button>
`;

// Function to get wallet address from TON Connect
async function getWalletAddress() {
  // If already connected, return address immediately
  if (tonConnectUI.connected && tonConnectUI.account?.address) {
    return tonConnectUI.account.address;
  }

  // Otherwise, try to connect
  await tonConnectUI.connectWallet();

  // After connection, the address should be available
  if (tonConnectUI.connected && tonConnectUI.account?.address) {
    return tonConnectUI.account.address;
  }
  throw new Error("Could not get wallet address");
}

document.getElementById('btn-connect-wallet').onclick = async () => {
  try {
    const address = await getWalletAddress();
    // Extract friendly string
    let walletAddress = "";
    if (typeof address === "string") {
      walletAddress = address;
    } else if (address?.toString) {
      walletAddress = address.toString(true, true, true); // bounceable, testOnly, urlSafe
    } else {
      throw new Error("Invalid address format");
    }

    console.log("Wallet address:", walletAddress);

    const res = await apiFetch('/api/auth/wallet', {
      method: 'POST',
      body: JSON.stringify({ wallet_address: walletAddress }),
    });

    if (res.success) {
      document.getElementById('current-wallet').innerText = walletAddress;
      alert('Wallet saved!');
    } else {
      alert('Failed to save wallet: ' + res.error);
    }
  } catch (e) {
    console.error("Wallet connection error:", e);
    alert('Connection failed: ' + e.message);
  }
};

  loadWithdrawalSection();
  lucide.createIcons();
}

// Channel Edit Modal
let editingChannelId = null;
function openEditModal(channelId) {
  editingChannelId = channelId;
  // Fetch channel data and fill modal
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

// Add Channel Modal
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

// Copy deep link
function copyDeepLink(channelId) {
  const link = `https://t.me/MySubsHub_bot?start=${channelId}`;
  navigator.clipboard.writeText(link).then(() => {
    alert('Link copied!');
  }).catch(() => {
    prompt('Copy link:', link);
  });
}

// Toggle channel active
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
    <h3 class="text-lg font-semibold text-white mb-2">Earnings</h3>
    <p class="text-slate-400">Pending: <strong class="text-white">${data.pendingEarnings.toFixed(6)} TON</strong></p>
    <button onclick="requestWithdrawal()" class="mt-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-xl text-sm">Request Withdrawal</button>
    <div class="mt-4">${data.withdrawals?.map(w => `<p class="text-sm text-slate-400">${w.amount} TON - <span class="text-amber-400">${w.status}</span></p>`).join('')}</div>
  `;
}
async function requestWithdrawal() {
  const amount = prompt('Enter amount in TON to withdraw:');
  if (!amount) return;
  const res = await apiFetch('/api/withdrawals/request', { method: 'POST', body: JSON.stringify({ amount: parseFloat(amount) }) });
  if (res.success) {
    alert('Withdrawal requested.');
    loadOwnerDashboard();
  } else {
    alert('Error: ' + res.error);
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
    star.className = 'cursor-pointer text-amber-400';
    star.onclick = () => { selectedRating = i; openRating(channelId); };
    container.appendChild(star);
  }
}
function closeRating() {
  document.getElementById('rating-modal').classList.add('hidden');
  ratingChannelId = null; selectedRating = 0;
}
async function submitRating() {
  if (!selectedRating) return alert('Select a rating');
  const comment = document.getElementById('rating-comment').value;
  await apiFetch('/api/reviews', { method: 'POST', body: JSON.stringify({ channel_id: ratingChannelId, rating: selectedRating, comment }) });
  closeRating();
  alert('Review submitted!');
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
  alert('Report submitted.');
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
      <button onclick="reviewReport('${r.id}', 'ban')" class="mt-2 bg-red-600/20 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-xl text-sm">Ban</button>
      <button onclick="reviewReport('${r.id}', 'dismiss')" class="mt-2 bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl text-sm ml-2">Dismiss</button>
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
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4">
      <p class="text-white">${w.owner?.first_name} – ${w.amount} TON</p>
      <p class="text-slate-400 text-sm">${w.status}</p>
      <button onclick="approveWithdrawal('${w.id}')" class="mt-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-sm">Approve & Pay</button>
    </div>
  `).join('');
}
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
