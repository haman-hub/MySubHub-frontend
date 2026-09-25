// MySubHub - Production app.js v3.0
// All 40 issues from deep analysis addressed

// ================== SECURITY: HTML ESCAPING ==================
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

// ================== CONFIG ==================
const API_BASE = window.MYSUBHUB_API || 'https://mslxnegbtstpdwauugmq.supabase.co/functions/v1/mainbot';
const BOT_USERNAME = window.MYSUBHUB_BOT || '@MySubsHub_bot'; // ← Change to your actual bot username

// ================== TOAST NOTIFICATION SYSTEM ==================
const Toast = {
  container: null,
  init() {
    if (this.container) return;
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.style.cssText = 'position:fixed;top:80px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none;max-width:340px;';
    document.body.appendChild(this.container);
  },
  show(message, type = 'info', duration = 3000) {
    this.init();
    const toast = document.createElement('div');
    const colors = { success: 'bg-emerald-500/90 border-emerald-400', error: 'bg-red-500/90 border-red-400', warning: 'bg-amber-500/90 border-amber-400', info: 'bg-blue-500/90 border-blue-400' };
    const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    toast.style.cssText = `pointer-events:auto;padding:12px 16px;border-radius:12px;border:1px solid;color:white;font-size:13px;font-weight:500;backdrop-filter:blur(12px);box-shadow:0 8px 24px rgba(0,0,0,0.4);animation:slideIn 0.3s ease;display:flex;align-items:center;gap:8px;`;
    toast.className = colors[type] || colors.info;
    toast.innerHTML = `<span style="font-size:16px">${icons[type] || icons.info}</span><span>${escapeHtml(message)}</span>`;
    this.container.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'slideOut 0.3s ease forwards'; setTimeout(() => toast.remove(), 300); }, duration);
  },
  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error', 5000); },
  warning(msg) { this.show(msg, 'warning', 4000); },
  info(msg) { this.show(msg, 'info'); },
};

const toastStyle = document.createElement('style');
toastStyle.textContent = `@keyframes slideIn{from{opacity:0;transform:translateX(100%)}to{opacity:1;transform:translateX(0)}}@keyframes slideOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(100%)}}`;
document.head.appendChild(toastStyle);

// ================== API HELPER (with retry) ==================
async function apiFetch(url, options = {}, retries = 1) {
  const TG = window.Telegram?.WebApp || {};
  const initData = TG.initData || '';
  const headers = { 'x-telegram-initdata': initData, 'Content-Type': 'application/json', ...options.headers };

  if (!initData) {
    if (url === '/api/auth/validate') return { user: null, error: 'Not in Telegram' };
    if (['/api/subscriptions/my', '/api/channels/my', '/api/referrals/stats'].includes(url)) return { error: 'Open via Telegram bot' };
    return { success: true };
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`${API_BASE}${url}`, { ...options, headers });

      if (res.status === 401 || res.status === 403) {
        if (url === '/api/auth/validate') return { user: null };
        return { error: 'Unauthorized - restart the app' };
      }
      if (res.status === 429) return { error: 'Too many requests. Please wait.' };
      if (res.status === 409) return await res.json();
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        return { error: error.error || 'Request failed' };
      }
      return await res.json();
    } catch (err) {
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      console.error('API fetch error:', err);
      return { error: 'Network error - check connection' };
    }
  }
}

// ================== STATE ==================
window.currentUser = null;
window.isAdmin = false;
window.currentPage = 'subscriptions';
window.currentEditChannelId = null;
window.currentRatingChannelId = null;
window.currentRating = 0;
window.currentReportChannelId = null;
let tonConnectUI = null;
let userWallet = null;

// ================== AUTH & INIT ==================
async function authenticateUser() {
  const auth = await apiFetch('/api/auth/validate');
  if (auth && auth.user) {
    window.currentUser = auth.user;
    window.isAdmin = auth.isAdmin === true;
    // Show admin tab if admin
    const adminTab = document.getElementById('nav-admin');
    if (adminTab && window.isAdmin) {
      adminTab.style.setProperty('display', 'flex', 'important');
    }
  }
  return auth;
}

// ================== PAGE NAVIGATION ==================
window.switchPage = function(pageId) {
  if (pageId === 'admin' && !window.isAdmin) pageId = 'subscriptions';
  const allPages = ['purchase', 'subscriptions', 'owner', 'referrals', 'admin'];
  allPages.forEach(p => {
    const sec = document.getElementById(`page-${p}`);
    if (sec) { sec.style.display = 'none'; sec.classList.add('hidden-page'); }
  });
  const target = document.getElementById(`page-${pageId}`);
  if (target) { target.style.display = 'block'; target.classList.remove('hidden-page'); }

  const navMap = { subscriptions: 'nav-subscriptions', owner: 'nav-owner', referrals: 'nav-referrals', admin: 'nav-admin' };
  Object.values(navMap).forEach(id => {
    const btn = document.getElementById(id);
    if (btn) { btn.classList.remove('active', 'text-ton-400', 'text-emerald-400', 'text-amber-400', 'text-purple-400'); btn.classList.add('text-slate-400'); }
  });
  const activeBtn = document.getElementById(navMap[pageId]);
  if (activeBtn) {
    activeBtn.classList.add('active'); activeBtn.classList.remove('text-slate-400');
    const colors = { subscriptions: 'text-ton-400', owner: 'text-emerald-400', referrals: 'text-purple-400', admin: 'text-amber-400' };
    activeBtn.classList.add(colors[pageId] || 'text-ton-400');
  }

  const loaders = { subscriptions: loadSubscriptions, owner: loadOwnerDashboard, referrals: loadReferralDashboard, admin: loadAdminDashboard };
  if (loaders[pageId]) loaders[pageId]();
  window.currentPage = pageId;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ================== THEME ==================
window.toggleTheme = function() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  document.body.className = next === 'dark' ? 'theme-dark' : 'theme-light';
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.innerHTML = next === 'dark' ? '☀️' : '🌙';
};

// ================== LANGUAGE ==================
window.openLanguageModal = function() { document.getElementById('language-modal')?.classList.remove('hidden'); };
window.closeLanguageModal = function() { document.getElementById('language-modal')?.classList.add('hidden'); };
window.selectLanguage = function(lang) {
  if (typeof setLanguage === 'function') setLanguage(lang);
  window.closeLanguageModal();
  Toast.success('Language updated');
};

// ================== PURCHASE PAGE (FIX #21 - was missing!) ==================
window.loadPurchasePage = async function(channelId) {
  const card = document.getElementById('purchase-card');
  if (!card) return;
  card.innerHTML = '<div class="text-center py-8 text-slate-400"><div class="animate-pulse">Loading channel...</div></div>';

  try {
    const channel = await apiFetch(`/api/channels/${channelId}`);
    if (channel.error || !channel.id) {
      card.innerHTML = `<div class="text-center py-8"><p class="text-red-400 mb-3">Channel not found</p><button onclick="switchPage('subscriptions')" class="btn-primary px-4 py-2 rounded-xl text-sm text-white">Go Back</button></div>`;
      return;
    }

    const price = parseFloat(channel.subscription_price || 0).toFixed(4);
    const days = channel.duration_days || 30;
    const name = escapeHtml(channel.channel_name || 'Unknown');
    const platformFee = (parseFloat(channel.subscription_price || 0) * 0.01).toFixed(4);

    card.innerHTML = `
      <div class="text-center mb-6">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-4">
          <span class="text-3xl">📺</span>
        </div>
        <h2 class="text-xl font-bold text-white mb-1">${name}</h2>
        ${channel.is_verified ? '<span class="text-xs text-blue-400">✓ Verified Channel</span>' : ''}
      </div>
      <div class="bg-slate-800/50 rounded-xl p-4 mb-4 space-y-3">
        <div class="flex justify-between items-center">
          <span class="text-sm text-slate-400">Subscription Price</span>
          <span class="text-lg font-bold text-white font-mono">${price} TON</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-sm text-slate-400">Duration</span>
          <span class="text-sm font-semibold text-white">${days} days</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-sm text-slate-400">Platform Fee (1%)</span>
          <span class="text-xs text-slate-500 font-mono">${platformFee} TON</span>
        </div>
        <div class="border-t border-slate-700 pt-2 flex justify-between items-center">
          <span class="text-sm font-semibold text-slate-300">Owner Receives (99%)</span>
          <span class="text-sm font-bold text-emerald-400 font-mono">${(parseFloat(price) * 0.99).toFixed(4)} TON</span>
        </div>
      </div>
      <div id="purchase-credits-section" class="mb-4"></div>
      <button onclick="initiatePurchase('${channelId}')" id="purchase-btn" class="btn-primary w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2">
        💎 Pay with TON
      </button>
      <div id="purchase-status" class="mt-3"></div>
      <div class="mt-4 flex gap-2">
        <button onclick="openRating('${channelId}')" class="btn-secondary flex-1 px-3 py-2 rounded-xl text-xs">⭐ Rate</button>
        <button onclick="openReport('${channelId}')" class="btn-secondary flex-1 px-3 py-2 rounded-xl text-xs">🚩 Report</button>
      </div>
    `;

    // Load credits info
    loadCreditsForPurchase(channelId);
  } catch (e) {
    card.innerHTML = `<div class="text-center py-8"><p class="text-red-400 mb-3">Failed to load channel</p><button onclick="switchPage('subscriptions')" class="btn-primary px-4 py-2 rounded-xl text-sm text-white">Go Back</button></div>`;
  }
};

async function loadCreditsForPurchase(channelId) {
  const section = document.getElementById('purchase-credits-section');
  if (!section) return;
  const stats = await apiFetch('/api/referrals/stats');
  if (stats.currentBalance > 0) {
    section.innerHTML = `
      <div class="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3">
        <p class="text-xs text-purple-300 mb-2">💰 You have <strong>${parseFloat(stats.currentBalance).toFixed(4)} TON</strong> in credits</p>
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" id="use-credits-check" onchange="toggleCreditsUsage()" class="rounded">
          <span class="text-xs text-slate-300">Use credits to reduce payment</span>
        </label>
        <input type="number" id="credits-amount" step="0.0001" min="0" max="${stats.currentBalance}" placeholder="0.0000" class="w-full mt-2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono hidden" />
      </div>
    `;
  }
}

window.toggleCreditsUsage = function() {
  const input = document.getElementById('credits-amount');
  const check = document.getElementById('use-credits-check');
  if (input && check) input.classList.toggle('hidden', !check.checked);
};

window.initiatePurchase = async function(channelId) {
  const btn = document.getElementById('purchase-btn');
  const status = document.getElementById('purchase-status');
  if (!btn || !status) return;

  const useCredits = document.getElementById('use-credits-check')?.checked || false;
  const creditsAmount = parseFloat(document.getElementById('credits-amount')?.value || '0');

  btn.disabled = true;
  btn.innerHTML = '<div class="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div> Processing...';
  status.innerHTML = '';

  try {
    const initiation = await apiFetch('/api/subscriptions/initiate', {
      method: 'POST',
      body: JSON.stringify({ channel_id: channelId, credits_used: useCredits ? creditsAmount : 0 })
    });

    if (initiation.error) {
      status.innerHTML = `<p class="text-red-400 text-xs text-center">${escapeHtml(initiation.error)}</p>`;
      btn.disabled = false;
      btn.innerHTML = '💎 Pay with TON';
      return;
    }

    if (!initiation.paymentDetails || parseFloat(initiation.paymentDetails.amount) <= 0) {
      // Full credits payment - no TON needed
      const confirm = await apiFetch('/api/subscriptions/confirm', {
        method: 'POST',
        body: JSON.stringify({ channel_id: channelId, credits_used: creditsAmount, nonce: initiation.nonce })
      });
      if (confirm.success) {
        status.innerHTML = '<p class="text-emerald-400 text-xs text-center">✅ Subscription activated with credits!</p>';
        Toast.success('Subscription activated!');
        setTimeout(() => switchPage('subscriptions'), 2000);
      } else {
        status.innerHTML = `<p class="text-red-400 text-xs text-center">${escapeHtml(confirm.error || 'Failed')}</p>`;
      }
      btn.disabled = false;
      btn.innerHTML = '💎 Pay with TON';
      return;
    }

    // TON Connect payment
    if (!tonConnectUI) {
      status.innerHTML = '<p class="text-amber-400 text-xs text-center">Please connect your TON wallet first</p>';
      btn.disabled = false;
      btn.innerHTML = '💎 Pay with TON';
      return;
    }

    const txResult = await tonConnectUI.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [{
        address: initiation.paymentDetails.wallet,
        amount: initiation.paymentDetails.amountNano,
        payload: initiation.nonce ? btoa(initiation.nonce) : undefined,
      }]
    });

    status.innerHTML = '<p class="text-blue-400 text-xs text-center">Payment sent! Verifying...</p>';

    // Confirm subscription
    const confirmation = await apiFetch('/api/subscriptions/confirm', {
      method: 'POST',
      body: JSON.stringify({
        channel_id: channelId,
        transaction_hash: txResult,
        credits_used: useCredits ? creditsAmount : 0,
        nonce: initiation.nonce,
        boc: txResult.boc || undefined,
      })
    });

    if (confirmation.success) {
      status.innerHTML = '<p class="text-emerald-400 text-xs text-center">✅ Subscription activated!</p>';
      Toast.success('Subscription activated!');
      setTimeout(() => switchPage('subscriptions'), 2000);
    } else {
      status.innerHTML = `<p class="text-amber-400 text-xs text-center">Payment sent but verification pending. Contact support if not activated within 10 minutes.</p>`;
    }
  } catch (e) {
    status.innerHTML = `<p class="text-red-400 text-xs text-center">${escapeHtml(e.message || 'Payment failed')}</p>`;
  }

  btn.disabled = false;
  btn.innerHTML = '💎 Pay with TON';
};

// ================== SUBSCRIPTIONS ==================
window.loadSubscriptions = async function() {
  const list = document.getElementById('subscriptions-list');
  if (!list) return;
  list.innerHTML = '<div class="glass-card p-10 text-center text-slate-400"><div class="animate-pulse">Loading...</div></div>';

  const subs = await apiFetch('/api/subscriptions/my');
  if (subs.error) {
    list.innerHTML = `<div class="glass-card p-6 text-center"><p class="text-red-400 mb-2">${escapeHtml(subs.error)}</p><button onclick="loadSubscriptions()" class="btn-primary px-4 py-2 rounded-lg text-xs text-white">Retry</button></div>`;
    return;
  }
  if (!subs || !subs.length) {
    list.innerHTML = '<div class="glass-card p-10 text-center text-slate-400">No subscriptions yet. Subscribe to a channel to get started!</div>';
    updateSubStats(0, 0, 0);
    return;
  }

  let active = 0, expiring = 0, spent = 0;
  list.innerHTML = subs.map(s => {
    const ch = s.channel || {};
    const daysLeft = Math.ceil((new Date(s.end_date) - Date.now()) / 86400000);
    const isExpired = daysLeft < 0;
    const isExpiring = daysLeft >= 0 && daysLeft <= 7;
    if (!isExpired) active++;
    if (isExpiring) expiring++;
    spent += parseFloat(s.amount || 0);
    const inviteLink = escapeHtml(ch.channel_invite_link || '');
    const name = escapeHtml(ch.channel_name || 'Unknown');

    return `
      <div class="glass-card p-4 mb-3 cursor-pointer hover:border-blue-500/50 transition-all" onclick="${inviteLink ? `joinChannel('${inviteLink}')` : ''}">
        <div class="flex justify-between items-start mb-2">
          <div class="flex items-center gap-2">
            <h3 class="font-semibold text-white">${name}</h3>
            ${ch.is_verified ? '<span class="text-blue-400 text-sm" title="Verified">✓</span>' : ''}
          </div>
          <span class="badge ${isExpired ? 'bg-red-500/10 text-red-400' : isExpiring ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}">
            ${isExpired ? 'Expired' : isExpiring ? '⚠️ ' + daysLeft + 'd' : 'Active'}
          </span>
        </div>
        <p class="text-slate-400 text-xs mb-3">Expires: ${new Date(s.end_date).toLocaleDateString()} • ${parseFloat(s.amount || 0).toFixed(4)} TON</p>
        <div class="flex gap-2 flex-wrap">
          ${!isExpired && inviteLink ? `<button onclick="event.stopPropagation();joinChannel('${inviteLink}')" class="btn-primary px-3 py-1.5 rounded-xl text-xs text-white">📺 Open</button>` : ''}
          <button onclick="event.stopPropagation();openRating('${s.channel_id}')" class="btn-secondary px-3 py-1.5 rounded-xl text-xs">⭐ Rate</button>
          <button onclick="event.stopPropagation();openReport('${s.channel_id}')" class="btn-secondary px-3 py-1.5 rounded-xl text-xs">🚩 Report</button>
          ${isExpired ? `<button onclick="event.stopPropagation();loadPurchasePage('${s.channel_id}');switchPage('purchase')" class="btn-primary px-3 py-1.5 rounded-xl text-xs text-white">🔄 Renew</button>` : ''}
        </div>
      </div>`;
  }).join('');
  updateSubStats(active, expiring, spent);
};

function updateSubStats(active, expiring, spent) {
  const a = document.getElementById('stat-active'); if (a) a.textContent = active;
  const e = document.getElementById('stat-expiring'); if (e) e.textContent = expiring;
  const s = document.getElementById('stat-spent'); if (s) s.textContent = spent.toFixed(2);
}

window.joinChannel = function(link) {
  if (!link) { Toast.warning('No invite link'); return; }
  const TG = window.Telegram?.WebApp;
  if (TG?.openLink) TG.openLink(link); else window.open(link, '_blank');
};

// ================== OWNER DASHBOARD (FIX #22 - correct element ID) ==================
window.loadOwnerDashboard = async function() {
  // FIX: Use correct element ID that exists in HTML
  const container = document.getElementById('channels-list') || document.getElementById('owner-dashboard');
  if (!container) { console.error('Owner container not found'); return; }
  container.innerHTML = '<div class="glass-card p-10 text-center text-slate-400"><div class="animate-pulse">Loading channels...</div></div>';

  const channels = await apiFetch('/api/channels/my');
  if (channels.error) {
    container.innerHTML = `<div class="glass-card p-6 text-center"><p class="text-red-400 mb-2">${escapeHtml(channels.error)}</p><button onclick="loadOwnerDashboard()" class="btn-primary px-4 py-2 rounded-lg text-xs text-white">Retry</button></div>`;
    return;
  }

  // FIX #24: Populate wallet & withdrawal sections
  loadWalletSection();
  loadWithdrawalSection();

  if (!channels || !channels.length) {
    container.innerHTML = `<div class="glass-card p-8 text-center"><p class="text-slate-400 mb-4">No channels yet.</p><button onclick="openAddChannelModal()" class="btn-primary text-white px-6 py-3 rounded-xl font-semibold">+ Add Channel</button></div>`;
    return;
  }

  container.innerHTML = channels.map(ch => {
    const name = escapeHtml(ch.channel_name || 'Unknown');
    const price = parseFloat(ch.subscription_price || 0).toFixed(2);
    const days = ch.duration_days || 30;
    const subs = ch.active_subscribers || 0;
    const rating = ch.avg_rating || 0;
    // FIX #26: Use actual bot username
    const shareLink = `https://t.me/${BOT_USERNAME}?start=${ch.id}`;

    return `
      <div class="glass-card p-4 mb-3">
        <div class="flex justify-between items-start mb-3">
          <div>
            <h3 class="font-semibold text-white flex items-center gap-2">${name} ${ch.is_verified ? '<span class="text-blue-400 text-xs">✓</span>' : ''}</h3>
            <p class="text-slate-400 text-xs mt-1">${price} TON / ${days} days</p>
          </div>
          <span class="badge ${ch.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}">${ch.is_active ? '● Active' : '○ Inactive'}</span>
        </div>
        <div class="grid grid-cols-3 gap-2 mb-3">
          <div class="bg-slate-800/50 rounded-lg p-2 text-center"><p class="text-[10px] text-slate-400">Subs</p><p class="text-lg font-bold text-white">${subs}</p></div>
          <div class="bg-slate-800/50 rounded-lg p-2 text-center"><p class="text-[10px] text-slate-400">Rating</p><p class="text-lg font-bold text-yellow-400">${rating > 0 ? '⭐' + rating.toFixed(1) : '—'}</p></div>
          <div class="bg-slate-800/50 rounded-lg p-2 text-center"><p class="text-[10px] text-slate-400">Reviews</p><p class="text-lg font-bold text-white">${ch.review_count || 0}</p></div>
        </div>
        <div class="flex gap-2 flex-wrap">
          <button onclick="openEditModal('${ch.id}')" class="btn-secondary px-3 py-1.5 rounded-xl text-xs">⚙️ Edit</button>
          <button onclick="copyToClipboard('${escapeHtml(shareLink)}', 'Share link copied!')" class="btn-secondary px-3 py-1.5 rounded-xl text-xs">📋 Share</button>
        </div>
      </div>`;
  }).join('');
};

// FIX #24: Wallet section
async function loadWalletSection() {
  const section = document.getElementById('wallet-section');
  if (!section) return;
  if (userWallet) {
    const addr = userWallet.account.address;
    const short = addr.substring(0, 8) + '...' + addr.substring(addr.length - 6);
    section.innerHTML = `<div class="flex items-center gap-2"><span class="text-emerald-400">✓</span><span class="text-sm text-white font-mono">${escapeHtml(short)}</span></div>`;
  } else {
    section.innerHTML = `<button onclick="connectWallet()" class="btn-primary px-4 py-2 rounded-lg text-xs text-white">Connect Wallet</button>`;
  }
}

// FIX #24: Withdrawal section
async function loadWithdrawalSection() {
  const section = document.getElementById('withdrawal-section');
  if (!section) return;
  const data = await apiFetch('/api/withdrawals/my');
  if (data.error) { section.innerHTML = `<p class="text-xs text-slate-500">${escapeHtml(data.error)}</p>`; return; }
  const pending = parseFloat(data.pendingEarnings || 0).toFixed(4);
  section.innerHTML = `
    <div class="space-y-2">
      <div class="flex justify-between"><span class="text-xs text-slate-400">Pending Earnings:</span><span class="text-sm font-bold text-emerald-400">${pending} TON</span></div>
      <button onclick="requestWithdrawal()" class="btn-primary w-full py-2 rounded-lg text-xs text-white" ${parseFloat(pending) < 1 ? 'disabled title="Minimum 1 TON"' : ''}>Request Withdrawal</button>
    </div>`;
}

window.requestWithdrawal = async function() {
  const amount = prompt('Enter withdrawal amount (TON):');
  if (!amount || parseFloat(amount) <= 0) return;
  if (!userWallet) { Toast.error('Connect wallet first'); return; }
  const res = await apiFetch('/api/withdrawals/request', {
    method: 'POST',
    body: JSON.stringify({ amount: parseFloat(amount), wallet_address: userWallet.account.address })
  });
  if (res.success) Toast.success('Withdrawal requested!');
  else Toast.error(res.error || 'Failed');
};

// ================== ADD/EDIT CHANNEL ==================
window.openAddChannelModal = function() { document.getElementById('add-channel-modal')?.classList.remove('hidden'); };
window.closeAddChannelModal = function() { document.getElementById('add-channel-modal')?.classList.add('hidden'); };

window.submitAddChannel = async function() {
  const name = document.getElementById('add-channel-name')?.value?.trim();
  const link = document.getElementById('add-channel-link')?.value?.trim();
  const price = document.getElementById('add-channel-price')?.value;
  const duration = document.getElementById('add-channel-duration')?.value;
  if (!name || !link) { Toast.error('Fill in name and invite link'); return; }
  if (!link.match(/^https:\/\/t\.me\/\+?[A-Za-z0-9_-]+/)) { Toast.error('Invalid invite link'); return; }
  if (!price || parseFloat(price) <= 0) { Toast.error('Invalid price'); return; }

  const res = await apiFetch('/api/channels/register', {
    method: 'POST',
    body: JSON.stringify({ channel_name: name, channel_invite_link: link, subscription_price: parseFloat(price), duration_days: parseInt(duration) || 30 })
  });
  if (res.error) Toast.error(res.error);
  else { Toast.success('Channel added!'); window.closeAddChannelModal(); loadOwnerDashboard(); }
};

// FIX #25: Edit modal with proper button connections
window.openEditModal = function(channelId) {
  window.currentEditChannelId = channelId;
  document.getElementById('edit-modal')?.classList.remove('hidden');
};
window.closeEditModal = function() { document.getElementById('edit-modal')?.classList.add('hidden'); };

window.submitEditChannel = async function() {
  const price = document.getElementById('edit-price')?.value;
  const duration = document.getElementById('edit-duration')?.value;
  if (!window.currentEditChannelId) { Toast.error('No channel selected'); return; }
  if (!price || parseFloat(price) <= 0) { Toast.error('Invalid price'); return; }

  const res = await apiFetch(`/api/channels/${window.currentEditChannelId}`, {
    method: 'PUT',
    body: JSON.stringify({ subscription_price: parseFloat(price), duration_days: parseInt(duration) })
  });
  if (res.error) Toast.error(res.error);
  else { Toast.success('Channel updated!'); window.closeEditModal(); loadOwnerDashboard(); }
};

// ================== RATING ==================
window.openRating = function(channelId) {
  window.currentRatingChannelId = channelId;
  window.currentRating = 0;
  document.getElementById('rating-modal')?.classList.remove('hidden');
  const container = document.getElementById('star-rating');
  if (container) {
    container.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('span');
      star.textContent = '☆';
      star.className = 'text-3xl cursor-pointer text-yellow-500 hover:scale-110 transition-transform';
      star.onclick = () => window.selectRating(i);
      container.appendChild(star);
    }
  }
};
window.closeRating = function() { document.getElementById('rating-modal')?.classList.add('hidden'); };
window.selectRating = function(r) {
  window.currentRating = r;
  document.querySelectorAll('#star-rating span').forEach((s, i) => s.textContent = i < r ? '★' : '☆');
};
window.submitRating = async function() {
  if (!window.currentRating || !window.currentRatingChannelId) { Toast.error('Select a rating'); return; }
  const comment = document.getElementById('rating-comment')?.value || '';
  const res = await apiFetch('/api/reviews', { method: 'POST', body: JSON.stringify({ channel_id: window.currentRatingChannelId, rating: window.currentRating, comment }) });
  if (res.error) Toast.error(res.error);
  else { Toast.success('Rating submitted!'); window.closeRating(); }
};

// ================== REPORT ==================
window.openReport = function(channelId) { window.currentReportChannelId = channelId; document.getElementById('report-modal')?.classList.remove('hidden'); };
window.closeReport = function() { document.getElementById('report-modal')?.classList.add('hidden'); };
window.submitReport = async function() {
  const reason = document.getElementById('report-reason')?.value;
  const description = document.getElementById('report-description')?.value;
  if (!window.currentReportChannelId) { Toast.error('No channel'); return; }
  const res = await apiFetch('/api/reports', { method: 'POST', body: JSON.stringify({ channel_id: window.currentReportChannelId, reason, description }) });
  if (res.error) Toast.error(res.error);
  else { Toast.success('Report submitted!'); window.closeReport(); }
};

// ================== REFERRALS ==================
window.loadReferralDashboard = async function() {
  const container = document.getElementById('referral-dashboard');
  if (!container) return;
  container.innerHTML = '<div class="glass-card p-10 text-center text-slate-400"><div class="animate-pulse">Loading...</div></div>';
  const stats = await apiFetch('/api/referrals/stats');
  if (stats.error) {
    container.innerHTML = `<div class="glass-card p-6 text-center"><p class="text-red-400 mb-2">${escapeHtml(stats.error)}</p><button onclick="loadReferralDashboard()" class="btn-primary px-4 py-2 rounded-lg text-xs text-white">Retry</button></div>`;
    return;
  }
  const link = stats.referralLink || '';
  container.innerHTML = `
    <div class="glass-card p-5 mb-4">
      <h3 class="text-lg font-bold text-white mb-4">🎁 Referral Program</h3>
      <div class="grid grid-cols-3 gap-2 mb-4">
        <div class="bg-slate-800/50 rounded-xl p-3 text-center"><p class="text-[10px] text-slate-400">Balance</p><p class="text-base font-bold text-emerald-400">${(stats.currentBalance || 0).toFixed(4)} TON</p></div>
        <div class="bg-slate-800/50 rounded-xl p-3 text-center"><p class="text-[10px] text-slate-400">Referrals</p><p class="text-2xl font-bold text-blue-400">${stats.totalReferrals || 0}</p></div>
        <div class="bg-slate-800/50 rounded-xl p-3 text-center"><p class="text-[10px] text-slate-400">Earned</p><p class="text-base font-bold text-white">${(stats.totalCreditsEarned || 0).toFixed(4)} TON</p></div>
      </div>
      <div class="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-4 mb-4">
        <p class="text-sm text-slate-300 mb-2">🔗 Your Referral Link</p>
        <div class="flex gap-2">
          <input type="text" id="referral-link" value="${escapeHtml(link)}" class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" readonly>
          <button onclick="copyReferralLink()" class="btn-primary px-4 py-2 rounded-lg text-sm text-white">📋</button>
        </div>
        <p class="text-xs text-slate-400 mt-2">Earn 5% credits on every subscription via your link!</p>
      </div>
      <button onclick="shareReferralLink()" class="btn-primary w-full py-3 rounded-xl text-sm font-semibold text-white">📤 Share</button>
    </div>`;
};

window.copyReferralLink = function() {
  const input = document.getElementById('referral-link');
  if (input) copyToClipboard(input.value, 'Link copied!');
};

window.shareReferralLink = async function() {
  const input = document.getElementById('referral-link');
  if (!input) return;
  const link = input.value;
  const message = `🎁 Join MySubHub - subscribe to premium Telegram channels!\n\n${link}\n\nEarn credits when friends subscribe! 🚀`;
  if (navigator.share) { try { await navigator.share({ title: 'MySubHub', text: message, url: link }); return; } catch {} }
  copyToClipboard(message, 'Share message copied!');
};

// ================== ADMIN (FIX #23 - now works with isAdmin) ==================
window.loadAdminDashboard = async function() {
  if (!window.isAdmin) { Toast.error('Admin access only'); return; }
  const reports = await apiFetch('/api/admin/reports');
  const withdrawals = await apiFetch('/api/admin/withdrawals');
  const rc = document.getElementById('admin-reports');
  const wc = document.getElementById('admin-withdrawals');

  if (rc) {
    if (!Array.isArray(reports) || !reports.length) rc.innerHTML = '<p class="text-slate-400 text-center py-6">No reports.</p>';
    else rc.innerHTML = reports.map(r => `
      <div class="glass-card p-4 border-l-4 ${r.status === 'pending' ? 'border-amber-500' : 'border-red-500'}">
        <div class="flex justify-between mb-3"><span class="text-xs font-bold uppercase px-2 py-1 rounded ${r.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}">${escapeHtml(r.status || 'pending')}</span><span class="text-xs text-slate-500">${new Date(r.created_at).toLocaleDateString()}</span></div>
        <div class="space-y-2">
          <div class="bg-slate-800/50 rounded-lg p-2"><p class="text-[10px] text-slate-400">Reporter:</p><p class="text-sm text-white">${escapeHtml(r.reporter?.first_name || 'Unknown')}</p></div>
          <div class="bg-slate-800/50 rounded-lg p-2"><p class="text-[10px] text-slate-400">Channel:</p><p class="text-sm text-white">${escapeHtml(r.channel?.channel_name || 'Unknown')}</p></div>
          <div class="bg-slate-800/50 rounded-lg p-2"><p class="text-[10px] text-slate-400">Reason:</p><p class="text-sm text-red-400 uppercase">${escapeHtml(r.reason || '')}</p>${r.description ? `<p class="text-xs text-slate-300 mt-1">${escapeHtml(r.description)}</p>` : ''}</div>
        </div>
        ${r.status === 'pending' ? `<div class="flex gap-2 mt-3 pt-3 border-t border-slate-700"><button onclick="reviewReport('${r.id}','ban')" class="flex-1 bg-red-600/20 text-red-400 px-3 py-2 rounded-xl text-sm font-semibold">🚫 Ban</button><button onclick="reviewReport('${r.id}','dismiss')" class="flex-1 bg-green-600/20 text-green-400 px-3 py-2 rounded-xl text-sm font-semibold">✅ Dismiss</button></div>` : ''}
      </div>`).join('');
  }
  if (wc) {
    if (!Array.isArray(withdrawals) || !withdrawals.length) wc.innerHTML = '<p class="text-slate-400 text-center py-6">No pending withdrawals.</p>';
    else wc.innerHTML = withdrawals.map(w => `
      <div class="glass-card p-4"><h3 class="font-semibold text-white">Owner #${escapeHtml(String(w.channel_owner_id))}</h3><p class="text-slate-400 text-sm">${parseFloat(w.amount).toFixed(4)} TON</p><p class="text-[10px] text-slate-500">${escapeHtml((w.wallet_address || '').substring(0, 16))}...</p><button onclick="approveWithdrawal('${w.id}')" class="btn-primary mt-2 w-full text-white px-3 py-1.5 rounded-xl text-sm">Approve</button></div>
    `).join('');
  }
};

window.reviewReport = async function(id, action) {
  if (!confirm(action === 'ban' ? 'Ban this channel?' : 'Dismiss?')) return;
  const res = await apiFetch(`/api/admin/reports/${id}/review`, { method: 'POST', body: JSON.stringify({ action }) });
  if (res.success) { Toast.success(`Report ${action}ed!`); loadAdminDashboard(); } else Toast.error(res.error || 'Failed');
};

window.approveWithdrawal = async function(id) {
  if (!confirm('Approve withdrawal?')) return;
  const res = await apiFetch(`/api/admin/withdrawals/${id}/approve`, { method: 'POST' });
  if (res.success) { Toast.success('Approved!'); loadAdminDashboard(); } else Toast.error(res.error || 'Failed');
};

// ================== UTILITIES ==================
function copyToClipboard(text, msg) {
  navigator.clipboard.writeText(text).then(() => Toast.success(msg || 'Copied!')).catch(() => {
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); Toast.success(msg || 'Copied!');
  });
}

window.copyShareLink = function(channelId) {
  copyToClipboard(`https://t.me/${BOT_USERNAME}?start=${channelId}`, 'Share link copied!');
};

// ================== DIAGNOSTIC ==================
window.runDiagnostic = async function() {
  const results = { apiBase: API_BASE, hasTelegram: !!window.Telegram?.WebApp, hasInitData: !!window.Telegram?.WebApp?.initData };
  try { const r = await fetch(`${API_BASE}/health`); results.health = await r.json(); } catch (e) { results.health = { error: e.message }; }
  results.auth = await apiFetch('/api/auth/validate');
  results.subs = await apiFetch('/api/subscriptions/my');
  results.channels = await apiFetch('/api/channels/my');
  results.referrals = await apiFetch('/api/referrals/stats');
  console.log('🔍 Diagnostic:', results);
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4';
  modal.innerHTML = `<div class="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-lg w-full max-h-[80vh] overflow-y-auto"><h2 class="text-lg font-bold text-white mb-3">🔍 Diagnostic</h2><div class="space-y-2 text-xs"><div class="bg-slate-800/50 rounded-lg p-2"><span class="text-slate-400">API:</span> <span class="font-mono text-white break-all">${escapeHtml(results.apiBase)}</span></div><div class="bg-slate-800/50 rounded-lg p-2"><span class="text-slate-400">Telegram:</span> <span class="${results.hasTelegram ? 'text-emerald-400' : 'text-red-400'}">${results.hasTelegram ? '✅' : '❌'}</span></div><div class="bg-slate-800/50 rounded-lg p-2"><span class="text-slate-400">Health:</span> <span class="${results.health?.status === 'healthy' ? 'text-emerald-400' : 'text-red-400'}">${results.health?.status || results.health?.error || 'Failed'}</span></div><div class="bg-slate-800/50 rounded-lg p-2"><span class="text-slate-400">Auth:</span> <span class="${results.auth?.user ? 'text-emerald-400' : 'text-red-400'}">${results.auth?.user ? '✅ ' + escapeHtml(results.auth.user.first_name || '') : '❌ ' + escapeHtml(results.auth?.error || '')}</span></div><div class="bg-slate-800/50 rounded-lg p-2"><span class="text-slate-400">Subs:</span> <span class="${Array.isArray(results.subs) ? 'text-emerald-400' : 'text-red-400'}">${Array.isArray(results.subs) ? '✅ ' + results.subs.length : '❌ ' + escapeHtml(results.subs?.error || '')}</span></div><div class="bg-slate-800/50 rounded-lg p-2"><span class="text-slate-400">Channels:</span> <span class="${Array.isArray(results.channels) ? 'text-emerald-400' : 'text-red-400'}">${Array.isArray(results.channels) ? '✅ ' + results.channels.length : '❌ ' + escapeHtml(results.channels?.error || '')}</span></div></div><button onclick="this.closest('.fixed').remove()" class="btn-primary w-full mt-3 py-2.5 rounded-xl text-white font-semibold text-sm">Close</button></div>`;
  document.body.appendChild(modal);
};

// ================== TON CONNECT ==================
async function initTonConnect() {
  try {
    if (window.TON_CONNECT_UI) {
      tonConnectUI = new TON_CONNECT_UI.TonConnectUI({ manifestUrl: 'https://haman-hub.github.io/MySubHub-frontend/manifest.json', buttonRootId: 'ton-connect-button' });
      tonConnectUI.onStatusChange(wallet => {
        userWallet = wallet || null;
        updateWalletUI();
        if (wallet) saveWalletToBackend(wallet.account.address);
      });
      if (tonConnectUI.wallet) { userWallet = tonConnectUI.wallet; updateWalletUI(); }
    }
  } catch (e) { console.error('TON Connect error:', e); }
}

function updateWalletUI() {
  const el = document.getElementById('wallet-status');
  if (!el) return;
  if (userWallet) {
    const addr = userWallet.account.address;
    el.innerHTML = `<div class="flex items-center gap-2"><span class="text-emerald-400">✓</span><span class="text-xs text-white font-mono">${escapeHtml(addr.substring(0, 6) + '...' + addr.substring(addr.length - 4))}</span><button onclick="disconnectWallet()" class="text-[10px] text-red-400">✕</button></div>`;
  } else {
    el.innerHTML = `<button onclick="connectWallet()" class="btn-primary px-3 py-1 rounded-lg text-xs text-white">Connect</button>`;
  }
}

async function saveWalletToBackend(address) {
  try { await apiFetch('/api/auth/wallet', { method: 'POST', body: JSON.stringify({ wallet_address: address }) }); } catch {}
}

window.connectWallet = async function() { if (tonConnectUI) try { await tonConnectUI.openModal(); } catch { Toast.error('Wallet error'); } else Toast.error('Not ready'); };
window.disconnectWallet = async function() { if (tonConnectUI) try { await tonConnectUI.disconnect(); userWallet = null; updateWalletUI(); Toast.info('Disconnected'); } catch {} };

// ================== TELEGRAM INIT ==================
const TG = window.Telegram?.WebApp || { ready: () => {}, expand: () => {}, initData: '', initDataUnsafe: {}, HapticFeedback: { impactOccurred: () => {}, selectionChanged: () => {}, notificationOccurred: () => {} } };
try { TG.ready(); TG.expand(); if (TG.setHeaderColor) TG.setHeaderColor('#040711'); if (TG.setBackgroundColor) TG.setBackgroundColor('#040711'); } catch {}

// ================== MAIN INIT ==================
async function init() {
  try {
    await initTonConnect();
    await authenticateUser();

    const navBar = document.getElementById('nav-bar');
    if (navBar) navBar.classList.remove('hidden');
    const ownerTab = document.getElementById('nav-owner');
    if (ownerTab) ownerTab.style.setProperty('display', 'flex', 'important');

    const urlStart = new URLSearchParams(window.location.search).get('startapp') || new URLSearchParams(window.location.search).get('start');
    const startParam = TG.initDataUnsafe?.start_param || urlStart;

    if (startParam && /^[0-9a-fA-F-]{36}$/.test(startParam)) {
      await loadPurchasePage(startParam);
      window.switchPage('purchase');
    } else if (startParam === 'owner') {
      window.switchPage('owner');
    } else if (startParam === 'admin' && window.isAdmin) {
      window.switchPage('admin');
    } else if (startParam === 'referral') {
      window.switchPage('referrals');
    } else {
      window.switchPage('subscriptions');
    }
  } catch (error) {
    console.error('Init error:', error);
    window.switchPage('subscriptions');
  }
}

window.onload = function() { init(); };
console.log('MySubHub app.js v3.0 loaded');
