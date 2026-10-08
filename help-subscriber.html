// MySubHub Frontend v3.2 - COMPLETE WITH ALL FEATURES
// Includes: All v3.0 features + v3.1 expiration + v3.2 new features (10% credits, ratings, preset durations, admin channels, renewal)

// ================== SECURITY ==================
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

// ================== CONFIG ==================
const API_BASE = window.MYSUBHUB_API || 'https://mslxnegbtstpdwauugmq.supabase.co/functions/v1/mainbot';
const BOT_USERNAME = window.MYSUBHUB_BOT || 'MySubsHub_bot';

// ================== TOAST ==================
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

// ================== API HELPER ==================
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
        return { error: 'Unauthorized' };
      }
      if (res.status === 429) return { error: 'Too many requests' };
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
      console.error('API error:', err);
      return { error: 'Network error' };
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

// ================== AUTH ==================
async function authenticateUser() {
  const auth = await apiFetch('/api/auth/validate');
  if (auth && auth.user) {
    window.currentUser = auth.user;
    window.isAdmin = auth.isAdmin === true;
    const adminTab = document.getElementById('nav-admin');
    if (adminTab && window.isAdmin) {
      adminTab.style.setProperty('display', 'flex', 'important');
    }
  }
  return auth;
}

// ================== NAVIGATION ==================
window.switchPage = function(pageId) {
  if (pageId === 'admin' && !window.isAdmin) pageId = 'subscriptions';
  const allPages = ['purchase', 'subscriptions', 'owner', 'referrals', 'admin', 'admin-channels'];
  allPages.forEach(p => {
    const sec = document.getElementById(`page-${p}`);
    if (sec) { sec.style.display = 'none'; sec.classList.add('hidden-page'); }
  });
  const target = document.getElementById(`page-${pageId}`);
  if (target) { target.style.display = 'block'; target.classList.remove('hidden-page'); }

  const navMap = { subscriptions: 'nav-subscriptions', owner: 'nav-owner', referrals: 'nav-referrals', admin: 'nav-admin', 'admin-channels': 'nav-admin-channels' };
  Object.values(navMap).forEach(id => {
    const btn = document.getElementById(id);
    if (btn) { btn.classList.remove('active', 'text-ton-400', 'text-emerald-400', 'text-amber-400', 'text-purple-400', 'text-pink-400'); btn.classList.add('text-slate-400'); }
  });
  const activeBtn = document.getElementById(navMap[pageId]);
  if (activeBtn) {
    activeBtn.classList.add('active'); activeBtn.classList.remove('text-slate-400');
    const colors = { subscriptions: 'text-ton-400', owner: 'text-emerald-400', referrals: 'text-purple-400', admin: 'text-amber-400', 'admin-channels': 'text-pink-400' };
    activeBtn.classList.add(colors[pageId] || 'text-ton-400');
  }

  const loaders = { subscriptions: loadSubscriptions, owner: loadOwnerDashboard, referrals: loadReferralDashboard, admin: loadAdminDashboard, 'admin-channels': loadAdminChannels };
  if (loaders[pageId]) loaders[pageId]();
  window.currentPage = pageId;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ================== SUBSCRIPTIONS (with renewal button) ==================
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
    list.innerHTML = '<div class="glass-card p-10 text-center text-slate-400">No subscriptions yet.</div>';
    updateSubStats(0, 0, 0);
    return;
  }

  let active = 0, expiring = 0, spent = 0;
  
  list.innerHTML = subs.map(s => {
    const ch = s.channel || {};
    const endDate = new Date(s.end_date);
    const daysLeft = Math.ceil((endDate - Date.now()) / 86400000);
    const isExpired = s.is_expired || s.status === 'expired' || daysLeft < 0;
    const isExpiring = !isExpired && daysLeft >= 0 && daysLeft <= 7;
    
    if (!isExpired) {
      active++;
      if (isExpiring) expiring++;
    }
    spent += parseFloat(s.amount || 0);
    
    const inviteLink = escapeHtml(ch.channel_invite_link || '');
    const name = escapeHtml(ch.channel_name || 'Unknown');
    const channelId = s.channel_id;

    // EXPIRED SUBSCRIPTION
    if (isExpired) {
      return `
        <div class="glass-card p-4 mb-3 border-2 border-red-500/30 bg-red-500/5 opacity-75">
          <div class="flex justify-between items-start mb-2">
            <div class="flex items-center gap-2">
              <h3 class="font-semibold text-slate-400">${name}</h3>
              ${ch.is_verified ? '<span class="text-blue-400 text-sm" title="Verified">✓</span>' : ''}
            </div>
            <span class="badge bg-red-500/20 text-red-400 border border-red-500/30">
              ⚠️ Expired
            </span>
          </div>
          <p class="text-slate-500 text-xs mb-3">
            Expired: ${endDate.toLocaleDateString()} • ${parseFloat(s.amount || 0).toFixed(4)} TON
          </p>
          <div class="flex gap-2 flex-wrap">
            <button onclick="renewSubscription('${channelId}')" class="btn-primary px-4 py-2 rounded-xl text-xs text-white font-semibold flex-1">
              🔄 Renew Subscription
            </button>
            <button onclick="openReport('${channelId}')" class="btn-secondary px-3 py-2 rounded-xl text-xs">
              🚩 Report
            </button>
          </div>
          <p class="text-[10px] text-slate-500 mt-2 text-center">
            Tap "Renew" to restore access
          </p>
        </div>
      `;
    }

    // ACTIVE SUBSCRIPTION (with renewal button)
    return `
      <div class="glass-card p-4 mb-3 cursor-pointer hover:border-blue-500/50 transition-all" onclick="${inviteLink ? `joinChannel('${inviteLink}')` : ''}">
        <div class="flex justify-between items-start mb-2">
          <div class="flex items-center gap-2">
            <h3 class="font-semibold text-white">${name}</h3>
            ${ch.is_verified ? '<span class="text-blue-400 text-sm" title="Verified">✓</span>' : ''}
          </div>
          <span class="badge ${isExpiring ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}">
            ${isExpiring ? '⚠️ ' + daysLeft + 'd left' : 'Active'}
          </span>
        </div>
        <p class="text-slate-400 text-xs mb-3">Expires: ${endDate.toLocaleDateString()} • ${parseFloat(s.amount || 0).toFixed(4)} TON</p>
        <div class="flex gap-2 flex-wrap">
          ${!isExpired && inviteLink ? `<button onclick="event.stopPropagation();joinChannel('${inviteLink}')" class="btn-primary px-3 py-1.5 rounded-xl text-xs text-white">📺 Open</button>` : ''}
          <button onclick="event.stopPropagation();renewSubscription('${channelId}')" class="btn-secondary px-3 py-1.5 rounded-xl text-xs">🔄 Renew</button>
          <button onclick="event.stopPropagation();openRating('${channelId}')" class="btn-secondary px-3 py-1.5 rounded-xl text-xs">⭐ Rate</button>
          <button onclick="event.stopPropagation();openReport('${channelId}')" class="btn-secondary px-3 py-1.5 rounded-xl text-xs">🚩 Report</button>
        </div>
      </div>
    `;
  }).join('');
  
  updateSubStats(active, expiring, spent);
};

function updateSubStats(active, expiring, spent) {
  const a = document.getElementById('stat-active'); if (a) a.textContent = active;
  const e = document.getElementById('stat-expiring'); if (e) e.textContent = expiring;
  const s = document.getElementById('stat-spent'); if (s) s.textContent = spent.toFixed(2);
}

// ================== RENEW SUBSCRIPTION ==================
window.renewSubscription = function(channelId) {
  if (window.loadPurchasePage) {
    window.loadPurchasePage(channelId);
    window.switchPage('purchase');
  } else {
    Toast.error('Renewal not available');
  }
};

window.joinChannel = function(link) {
  if (!link) { Toast.warning('No invite link'); return; }
  const TG = window.Telegram?.WebApp;
  if (TG?.openLink) TG.openLink(link); else window.open(link, '_blank');
};

// ================== PURCHASE PAGE (with ratings display) ==================
window.loadPurchasePage = async function(channelId) {
  const card = document.getElementById('purchase-card');
  if (!card) return;
  card.innerHTML = '<div class="text-center py-8 text-slate-400"><div class="animate-pulse">Loading...</div></div>';

  try {
    const channel = await apiFetch(`/api/channels/${channelId}`);
    if (channel.error || !channel.id) {
      card.innerHTML = `<div class="text-center py-8"><p class="text-red-400 mb-3">Channel not found or unavailable</p><button onclick="switchPage('subscriptions')" class="btn-primary px-4 py-2 rounded-xl text-sm text-white">Go Back</button></div>`;
      return;
    }

    const price = parseFloat(channel.subscription_price || 0).toFixed(4);
    const days = channel.duration_days || 30;
    const name = escapeHtml(channel.channel_name || 'Unknown');
    const reviews = channel.reviews || [];
    const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0.0';

    card.innerHTML = `
      <div class="text-center mb-6">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-4">
          <span class="text-3xl">📺</span>
        </div>
        <h2 class="text-xl font-bold text-white mb-1">${name}</h2>
        ${channel.is_verified ? '<span class="text-xs text-blue-400">✓ Verified</span>' : ''}
      </div>
      
      ${reviews.length > 0 ? `
        <div class="bg-slate-800/50 rounded-xl p-4 mb-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold text-white">⭐ Channel Ratings</h3>
            <span class="text-lg font-bold text-yellow-400">${avgRating}/5</span>
          </div>
          <div class="space-y-2 max-h-40 overflow-y-auto">
            ${reviews.slice(0, 5).map(r => `
              <div class="bg-slate-900/60 rounded-lg p-2">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-semibold text-white">${'⭐'.repeat(r.rating)}</span>
                  <span class="text-[10px] text-slate-500">${new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                ${r.comment ? `<p class="text-xs text-slate-300">${escapeHtml(r.comment)}</p>` : ''}
              </div>
            `).join('')}
            ${reviews.length > 5 ? `<p class="text-[10px] text-slate-500 text-center">+${reviews.length - 5} more reviews</p>` : ''}
          </div>
        </div>
      ` : ''}
      
      <div class="bg-slate-800/50 rounded-xl p-4 mb-4 space-y-3">
        <div class="flex justify-between items-center">
          <span class="text-sm text-slate-400">Price</span>
          <span class="text-lg font-bold text-white font-mono">${price} TON</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-sm text-slate-400">Duration</span>
          <span class="text-sm font-semibold text-white">${days} days</span>
        </div>
      </div>
      <div id="purchase-credits-section" class="mb-4"></div>
      <button onclick="initiatePurchase('${channelId}')" id="purchase-btn" class="btn-primary w-full py-3.5 rounded-xl text-white font-bold text-sm">
        💎 Pay with TON
      </button>
      <div id="purchase-status" class="mt-3"></div>
    `;

    loadCreditsForPurchase(channelId);
  } catch (e) {
    card.innerHTML = `<div class="text-center py-8"><p class="text-red-400 mb-3">Failed to load</p><button onclick="switchPage('subscriptions')" class="btn-primary px-4 py-2 rounded-xl text-sm text-white">Go Back</button></div>`;
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

    if (!tonConnectUI) {
      status.innerHTML = '<p class="text-amber-400 text-xs text-center">Connect wallet first</p>';
      btn.disabled = false;
      btn.innerHTML = '💎 Pay with TON';
      return;
    }

    const txResult = await tonConnectUI.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 600,
      messages: [{
        address: initiation.paymentDetails.wallet,
        amount: initiation.paymentDetails.amountNano,
      }]
    });

    status.innerHTML = '<p class="text-blue-400 text-xs text-center">Verifying payment...</p>';

    const confirmation = await apiFetch('/api/subscriptions/confirm', {
      method: 'POST',
      body: JSON.stringify({
        channel_id: channelId,
        transaction_hash: txResult,
        nonce: initiation.nonce,
      })
    });

    if (confirmation.success) {
      status.innerHTML = '<p class="text-emerald-400 text-xs text-center">✅ Subscription activated!</p>';
      Toast.success('Subscription activated!');
      setTimeout(() => switchPage('subscriptions'), 2000);
    } else {
      status.innerHTML = `<p class="text-amber-400 text-xs text-center">Payment sent but verification pending</p>`;
    }
  } catch (e) {
    status.innerHTML = `<p class="text-red-400 text-xs text-center">${escapeHtml(e.message || 'Failed')}</p>`;
  }

  btn.disabled = false;
  btn.innerHTML = '💎 Pay with TON';
};

// ================== OWNER DASHBOARD ==================
window.loadOwnerDashboard = async function() {
  const container = document.getElementById('channels-list') || document.getElementById('owner-dashboard');
  if (!container) return;
  container.innerHTML = '<div class="glass-card p-10 text-center text-slate-400"><div class="animate-pulse">Loading...</div></div>';

  const channels = await apiFetch('/api/channels/my');
  if (channels.error) {
    container.innerHTML = `<div class="glass-card p-6 text-center"><p class="text-red-400 mb-2">${escapeHtml(channels.error)}</p><button onclick="loadOwnerDashboard()" class="btn-primary px-4 py-2 rounded-lg text-xs text-white">Retry</button></div>`;
    return;
  }

  if (!channels || !channels.length) {
    container.innerHTML = `
      <div class="glass-card p-8">
        <div class="text-center mb-6">
          <div class="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-4">
            <span class="text-3xl">🤖</span>
          </div>
          <h3 class="text-lg font-bold text-white mb-2">Add Your First Channel</h3>
          <p class="text-sm text-slate-400 mb-4">To add your channel, you must first add <strong class="text-blue-400">@MySubsHub_bot</strong> to your channel as an administrator with maximum permissions.</p>
        </div>
        
        <div class="bg-slate-800/50 rounded-xl p-4 mb-4">
          <h4 class="text-sm font-bold text-white mb-3">How to add the bot:</h4>
          <ol class="text-xs text-slate-300 space-y-2 list-decimal list-inside">
            <li>Open your Telegram channel</li>
            <li>Go to Channel Settings → Administrators</li>
            <li>Click "Add Administrator"</li>
            <li>Search for <strong class="text-blue-400">@MySubsHub_bot</strong></li>
            <li>Select the bot and grant ALL permissions</li>
            <li>Click "Save" or "Done"</li>
            <li>Return here and refresh this page</li>
          </ol>
        </div>
        
        <div class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
          <p class="text-xs text-amber-300">⚠️ <strong>Important:</strong> The bot must be added as administrator before you can register your channel. This allows the bot to manage subscribers automatically.</p>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = channels.map(ch => {
    const name = escapeHtml(ch.channel_name || 'Unknown');
    const price = parseFloat(ch.subscription_price || 0).toFixed(2);
    const days = ch.duration_days || 30;

    return `
      <div class="glass-card p-4 mb-3">
        <div class="flex justify-between items-start mb-3">
          <div>
            <h3 class="font-semibold text-white">${name}</h3>
            <p class="text-slate-400 text-xs mt-1">${price} TON / ${days} days</p>
          </div>
          <span class="badge ${ch.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}">${ch.is_active ? '● Active' : '○ Inactive'}</span>
        </div>
        <div class="flex gap-2">
          <button onclick="openEditModal('${ch.id}')" class="btn-secondary px-3 py-1.5 rounded-xl text-xs">⚙️ Edit</button>
          <button onclick="copyShareLink('${ch.id}')" class="btn-secondary px-3 py-1.5 rounded-xl text-xs">📋 Copy</button>
          <button onclick="forwardChannelLink('${ch.id}', '${escapeHtml(ch.channel_name)}')" class="btn-secondary px-3 py-1.5 rounded-xl text-xs">📤 Forward</button>
          <button onclick="deleteChannel('${ch.id}')" class="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1.5 rounded-xl text-xs">🗑️ Delete</button>
        </div>
      </div>
    `;
  }).join('');
};

// ================== ADD CHANNEL MODAL (with preset durations) ==================
window.openAddChannelModal = function() {
  const modal = document.getElementById('add-channel-modal');
  if (!modal) return;
  
  modal.innerHTML = `
    <div class="glass-card p-6 w-full max-w-md">
      <h2 class="text-lg font-bold text-white mb-4">Add Channel</h2>
      <div class="space-y-4">
        <div>
          <label class="text-xs text-slate-400 mb-1 block">Channel Name</label>
          <input type="text" id="add-channel-name" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="My Channel" />
        </div>
        <div>
          <label class="text-xs text-slate-400 mb-1 block">Invite Link</label>
          <input type="text" id="add-channel-link" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="https://t.me/..." />
        </div>
        <div>
          <label class="text-xs text-slate-400 mb-1 block">Subscription Price (TON)</label>
          <input type="number" id="add-channel-price" step="0.01" min="0.01" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="1.0" />
        </div>
        <div>
          <label class="text-xs text-slate-400 mb-2 block">Subscription Duration</label>
          <div class="grid grid-cols-3 gap-2">
            <button onclick="selectDuration(7)" class="duration-btn bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white hover:border-blue-500" data-days="7">1 Week</button>
            <button onclick="selectDuration(30)" class="duration-btn bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white hover:border-blue-500" data-days="30">1 Month</button>
            <button onclick="selectDuration(90)" class="duration-btn bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white hover:border-blue-500" data-days="90">3 Months</button>
            <button onclick="selectDuration(180)" class="duration-btn bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white hover:border-blue-500" data-days="180">6 Months</button>
            <button onclick="selectDuration(365)" class="duration-btn bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white hover:border-blue-500" data-days="365">1 Year</button>
            <button onclick="selectDuration(9999)" class="duration-btn bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white hover:border-blue-500" data-days="9999">Unlimited</button>
          </div>
          <input type="hidden" id="add-channel-duration" value="30" />
        </div>
      </div>
      <div class="flex gap-2 mt-6">
        <button onclick="closeAddChannelModal()" class="flex-1 btn-secondary px-4 py-2 rounded-xl text-sm">Cancel</button>
        <button onclick="submitAddChannel()" class="flex-1 btn-primary px-4 py-2 rounded-xl text-sm text-white">Add Channel</button>
      </div>
    </div>
  `;
  
  modal.classList.remove('hidden');
};

window.selectDuration = function(days) {
  document.getElementById('add-channel-duration').value = days;
  document.querySelectorAll('.duration-btn').forEach(btn => {
    btn.classList.remove('border-blue-500', 'bg-blue-500/20');
    btn.classList.add('border-slate-700');
  });
  const selectedBtn = document.querySelector(`.duration-btn[data-days="${days}"]`);
  if (selectedBtn) {
    selectedBtn.classList.remove('border-slate-700');
    selectedBtn.classList.add('border-blue-500', 'bg-blue-500/20');
  }
};

window.closeAddChannelModal = function() {
  document.getElementById('add-channel-modal')?.classList.add('hidden');
};

window.submitAddChannel = async function() {
  const name = document.getElementById('add-channel-name')?.value?.trim();
  const link = document.getElementById('add-channel-link')?.value?.trim();
  const price = document.getElementById('add-channel-price')?.value;
  const duration = document.getElementById('add-channel-duration')?.value;

  if (!name || !link || !price) {
    Toast.error('Please fill all fields');
    return;
  }

  const res = await apiFetch('/api/channels/register', {
    method: 'POST',
    body: JSON.stringify({
      channel_name: name,
      channel_invite_link: link,
      subscription_price: parseFloat(price),
      duration_days: parseInt(duration)
    })
  });

  if (res.error) {
    // Check if error is about bot not being admin
    if (res.error.includes('administrator') || res.error.includes('admin')) {
      showBotAdminRequiredDialog(res.error);
    } else {
      Toast.error(res.error);
    }
  } else {
    Toast.success('Channel added!');
    closeAddChannelModal();
    loadOwnerDashboard();
  }
};

// NEW: Show dialog when bot is not admin
function showBotAdminRequiredDialog(errorMessage) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 max-w-md w-full">
      <div class="text-center mb-4">
        <div class="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
          <span class="text-3xl">⚠️</span>
        </div>
        <h2 class="text-xl font-bold text-white mb-2">Bot Admin Access Required</h2>
        <p class="text-sm text-slate-300 mb-4">${escapeHtml(errorMessage)}</p>
      </div>
      
      <div class="bg-slate-800/50 rounded-xl p-4 mb-4">
        <h3 class="text-sm font-bold text-white mb-3">How to add bot as administrator:</h3>
        <ol class="text-xs text-slate-300 space-y-2 list-decimal list-inside">
          <li>Open your Telegram channel</li>
          <li>Go to Channel Settings → Administrators</li>
          <li>Click "Add Administrator"</li>
          <li>Search for your bot and select it</li>
          <li>Grant necessary permissions</li>
          <li>Click "Save" or "Done"</li>
          <li>Try adding the channel again</li>
        </ol>
      </div>
      
      <div class="flex gap-2">
        <button onclick="this.closest('.fixed').remove()" class="flex-1 btn-secondary px-4 py-2 rounded-xl text-sm">
          Close
        </button>
        <button onclick="this.closest('.fixed').remove(); openAddChannelModal()" class="flex-1 btn-primary px-4 py-2 rounded-xl text-sm text-white">
          Try Again
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// ================== EDIT CHANNEL MODAL ==================
window.openEditModal = async function(channelId) {
  window.currentEditChannelId = channelId;
  
  // Fetch channel data to pre-fill the form
  const channel = await apiFetch(`/api/channels/${channelId}`);
  if (channel.error) {
    Toast.error('Failed to load channel data');
    return;
  }
  
  const modal = document.createElement('div');
  modal.id = 'edit-modal-dynamic';
  modal.className = 'fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="glass-card p-6 w-full max-w-md">
      <h2 class="text-lg font-bold text-white mb-4">Edit Channel</h2>
      <div class="space-y-4">
        <div>
          <label class="text-xs text-slate-400 mb-1 block">Channel Name</label>
          <input type="text" id="edit-channel-name" value="${escapeHtml(channel.channel_name || '')}" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" readonly />
          <p class="text-[10px] text-slate-500 mt-1">Channel name cannot be changed</p>
        </div>
        <div>
          <label class="text-xs text-slate-400 mb-1 block">Subscription Price (TON)</label>
          <input type="number" id="edit-price" step="0.01" min="0.01" value="${channel.subscription_price || ''}" class="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" />
        </div>
        <div>
          <label class="text-xs text-slate-400 mb-2 block">Subscription Duration</label>
          <div class="grid grid-cols-3 gap-2">
            <button onclick="selectEditDuration(7)" class="edit-duration-btn bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white hover:border-blue-500" data-days="7">1 Week</button>
            <button onclick="selectEditDuration(30)" class="edit-duration-btn bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white hover:border-blue-500" data-days="30">1 Month</button>
            <button onclick="selectEditDuration(90)" class="edit-duration-btn bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white hover:border-blue-500" data-days="90">3 Months</button>
            <button onclick="selectEditDuration(180)" class="edit-duration-btn bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white hover:border-blue-500" data-days="180">6 Months</button>
            <button onclick="selectEditDuration(365)" class="edit-duration-btn bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white hover:border-blue-500" data-days="365">1 Year</button>
            <button onclick="selectEditDuration(9999)" class="edit-duration-btn bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white hover:border-blue-500" data-days="9999">Unlimited</button>
          </div>
          <input type="hidden" id="edit-duration" value="${channel.duration_days || 30}" />
        </div>
      </div>
      <div class="flex gap-2 mt-6">
        <button onclick="closeEditModal()" class="flex-1 btn-secondary px-4 py-2 rounded-xl text-sm">Cancel</button>
        <button onclick="submitEditChannel()" class="flex-1 btn-primary px-4 py-2 rounded-xl text-sm text-white">Save Changes</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Highlight current duration
  const currentDuration = channel.duration_days || 30;
  selectEditDuration(currentDuration);
};

window.selectEditDuration = function(days) {
  document.getElementById('edit-duration').value = days;
  document.querySelectorAll('.edit-duration-btn').forEach(btn => {
    btn.classList.remove('border-blue-500', 'bg-blue-500/20');
    btn.classList.add('border-slate-700');
  });
  const selectedBtn = document.querySelector(`.edit-duration-btn[data-days="${days}"]`);
  if (selectedBtn) {
    selectedBtn.classList.remove('border-slate-700');
    selectedBtn.classList.add('border-blue-500', 'bg-blue-500/20');
  }
};

window.closeEditModal = function() {
  const modal = document.getElementById('edit-modal-dynamic');
  if (modal) {
    modal.remove();
  }
  // Also hide static modal if it exists
  document.getElementById('edit-modal')?.classList.add('hidden');
};

window.submitEditChannel = async function() {
  const priceInput = document.getElementById('edit-price');
  const durationInput = document.getElementById('edit-duration');
  
  if (!priceInput || !durationInput) {
    Toast.error('Form elements not found');
    return;
  }
  
  const price = parseFloat(priceInput.value);
  const duration = parseInt(durationInput.value);
  
  console.log('Edit channel:', { price, duration, channelId: window.currentEditChannelId });
  
  if (!window.currentEditChannelId) { 
    Toast.error('No channel selected'); 
    return; 
  }
  
  if (isNaN(price) || price <= 0) { 
    Toast.error('Please enter a valid price (greater than 0)'); 
    return; 
  }
  
  if (isNaN(duration) || duration <= 0) {
    Toast.error('Please select a valid duration');
    return;
  }

  const res = await apiFetch(`/api/channels/${window.currentEditChannelId}`, {
    method: 'PUT',
    body: JSON.stringify({ 
      subscription_price: price, 
      duration_days: duration 
    })
  });
  
  if (res.error) {
    Toast.error(res.error);
  } else {
    Toast.success('Channel updated successfully!');
    closeEditModal();
    loadOwnerDashboard();
  }
};

// ================== DELETE CHANNEL ==================
window.deleteChannel = async function(channelId) {
  if (!confirm('Are you sure you want to delete this channel? This action cannot be undone.')) {
    return;
  }

  const res = await apiFetch(`/api/channels/${channelId}`, {
    method: 'DELETE'
  });

  if (res.error) {
    Toast.error(res.error);
  } else {
    Toast.success('Channel deleted successfully!');
    loadOwnerDashboard();
  }
};

// ================== REFERRALS (10% credits) ==================
window.loadReferralDashboard = async function() {
  const container = document.getElementById('referral-dashboard');
  if (!container) return;
  container.innerHTML = '<div class="glass-card p-10 text-center text-slate-400"><div class="animate-pulse">Loading...</div></div>';
  
  const stats = await apiFetch('/api/referrals/stats');
  if (stats.error) {
    container.innerHTML = `<div class="glass-card p-6 text-center"><p class="text-red-400 mb-2">${escapeHtml(stats.error)}</p></div>`;
    return;
  }

  const link = stats.referralLink || '';
  container.innerHTML = `
    <div class="glass-card p-5 mb-4">
      <h3 class="text-lg font-bold text-white mb-4">🎁 Referral Program</h3>
      <div class="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-4">
        <p class="text-xs text-blue-300">💰 Earn <strong>10% credits</strong> when friends subscribe via your link!</p>
        <p class="text-[10px] text-slate-400 mt-1">Credits can be used for subscriptions but cannot be withdrawn.</p>
      </div>
      <div class="grid grid-cols-3 gap-2 mb-4">
        <div class="bg-slate-800/50 rounded-xl p-3 text-center">
          <p class="text-[10px] text-slate-400">Balance</p>
          <p class="text-base font-bold text-emerald-400">${(stats.currentBalance || 0).toFixed(4)} TON</p>
        </div>
        <div class="bg-slate-800/50 rounded-xl p-3 text-center">
          <p class="text-[10px] text-slate-400">Referrals</p>
          <p class="text-2xl font-bold text-blue-400">${stats.totalReferrals || 0}</p>
        </div>
        <div class="bg-slate-800/50 rounded-xl p-3 text-center">
          <p class="text-[10px] text-slate-400">Earned</p>
          <p class="text-base font-bold text-white">${(stats.totalCreditsEarned || 0).toFixed(4)} TON</p>
        </div>
      </div>
      <div class="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-4 mb-4">
        <p class="text-sm text-slate-300 mb-2">🔗 Your Referral Link</p>
        <div class="flex gap-2">
          <input type="text" id="referral-link" value="${escapeHtml(link)}" class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" readonly>
          <button onclick="copyReferralLink()" class="btn-primary px-4 py-2 rounded-lg text-sm text-white">📋</button>
        </div>
      </div>
    </div>
  `;
};

window.copyReferralLink = function() {
  const input = document.getElementById('referral-link');
  if (input) {
    navigator.clipboard.writeText(input.value).then(() => Toast.success('Copied!')).catch(() => Toast.error('Failed'));
  }
};

// ================== ADMIN DASHBOARD ==================
window.loadAdminDashboard = async function() {
  if (!window.isAdmin) { Toast.error('Admin only'); return; }
  const container = document.getElementById('admin-dashboard');
  if (!container) return;
  container.innerHTML = '<div class="glass-card p-10 text-center text-slate-400">Admin Panel</div>';
};

// ================== ADMIN CHANNEL LIST (NEW v3.2) ==================
window.loadAdminChannels = async function() {
  if (!window.isAdmin) { Toast.error('Admin only'); return; }
  const container = document.getElementById('admin-channels-list');
  if (!container) return;
  container.innerHTML = '<div class="glass-card p-10 text-center text-slate-400"><div class="animate-pulse">Loading channels...</div></div>';

  const channels = await apiFetch('/api/admin/channels');
  if (channels.error) {
    container.innerHTML = `<div class="glass-card p-6 text-center"><p class="text-red-400 mb-2">${escapeHtml(channels.error)}</p></div>`;
    return;
  }

  if (!channels || !channels.length) {
    container.innerHTML = '<div class="glass-card p-10 text-center text-slate-400">No channels found.</div>';
    return;
  }

  container.innerHTML = channels.map(ch => {
    const name = escapeHtml(ch.channel_name || 'Unknown');
    const ownerName = escapeHtml(ch.owner_name || 'Unknown');
    const price = parseFloat(ch.subscription_price || 0).toFixed(2);
    const days = ch.duration_days || 30;
    const subs = ch.active_subscribers || 0;
    const rating = ch.avg_rating || 0;

    return `
      <div class="glass-card p-4 mb-3">
        <div class="flex justify-between items-start mb-3">
          <div class="flex-1">
            <h3 class="font-semibold text-white">${name}</h3>
            <p class="text-slate-400 text-xs mt-1">Owner: ${ownerName} (@${escapeHtml(ch.owner_username || 'unknown')})</p>
            <p class="text-slate-400 text-xs mt-1">${price} TON / ${days} days • ${subs} subscribers</p>
            ${rating > 0 ? `<p class="text-yellow-400 text-xs mt-1">⭐ ${rating.toFixed(1)}/5 (${ch.review_count || 0} reviews)</p>` : ''}
          </div>
          <span class="badge ${ch.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}">${ch.is_active ? '● Active' : '○ Inactive'}</span>
        </div>
        <div class="flex gap-2">
          ${ch.channel_invite_link ? `<a href="${escapeHtml(ch.channel_invite_link)}" target="_blank" class="btn-secondary px-3 py-1.5 rounded-xl text-xs">🔗 View</a>` : ''}
        </div>
      </div>
    `;
  }).join('');
};

// ================== MODALS ==================
window.openRating = function(channelId) {
  window.currentRatingChannelId = channelId;
  document.getElementById('rating-modal')?.classList.remove('hidden');
};

window.closeRating = function() {
  document.getElementById('rating-modal')?.classList.add('hidden');
};

window.submitRating = async function() {
  if (!window.currentRating || !window.currentRatingChannelId) { Toast.error('Select a rating'); return; }
  const comment = document.getElementById('rating-comment')?.value || '';
  const res = await apiFetch('/api/reviews', { method: 'POST', body: JSON.stringify({ channel_id: window.currentRatingChannelId, rating: window.currentRating, comment }) });
  if (res.error) Toast.error(res.error);
  else { Toast.success('Rating submitted!'); window.closeRating(); }
};

window.openReport = function(channelId) {
  window.currentReportChannelId = channelId;
  document.getElementById('report-modal')?.classList.remove('hidden');
};

window.closeReport = function() {
  document.getElementById('report-modal')?.classList.add('hidden');
};

window.submitReport = async function() {
  const reason = document.getElementById('report-reason')?.value;
  const description = document.getElementById('report-description')?.value;
  if (!window.currentReportChannelId) { Toast.error('No channel'); return; }
  const res = await apiFetch('/api/reports', { method: 'POST', body: JSON.stringify({ channel_id: window.currentReportChannelId, reason, description }) });
  if (res.error) Toast.error(res.error);
  else { Toast.success('Report submitted!'); window.closeReport(); }
};

// ================== UTILITIES ==================
function copyToClipboard(text, msg) {
  navigator.clipboard.writeText(text).then(() => Toast.success(msg || 'Copied!')).catch(() => {
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); Toast.success(msg || 'Copied!');
  });
}

window.copyShareLink = function(channelId) {
  copyToClipboard(`https://t.me/${BOT_USERNAME}?start=${channelId}`, 'Link copied!');
};

window.forwardChannelLink = async function(channelId, channelName) {
  const link = `https://t.me/${BOT_USERNAME}?start=${channelId}`;
  const message = `🎯 Subscribe to "${channelName}" on MySubHub!\n\n💎 Get premium content with TON payments\n🔒 Secure and private\n✨ Easy subscription management\n\nClick here to subscribe: ${link}`;
  
  // Try to use Telegram's native share functionality
  const TG = window.Telegram?.WebApp;
  if (TG?.switchInlineQuery) {
    try {
      TG.switchInlineQuery(message, ['users', 'groups', 'channels']);
      return;
    } catch (e) {
      console.log('switchInlineQuery not available, using fallback');
    }
  }
  
  // Fallback: Use Web Share API if available
  if (navigator.share) {
    try {
      await navigator.share({
        title: `Subscribe to ${channelName}`,
        text: message,
        url: link
      });
      return;
    } catch (e) {
      console.log('Web Share API cancelled or failed');
    }
  }
  
  // Final fallback: Copy to clipboard
  copyToClipboard(message, 'Message copied! Share it anywhere.');
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
      tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: 'https://haman-hub.github.io/MySubHub-frontend/manifest.json',
        buttonRootId: 'ton-connect-button'
      });
      tonConnectUI.onStatusChange(wallet => {
        userWallet = wallet || null;
        updateWalletUI();
        if (wallet) saveWalletToBackend(wallet.account.address);
      });
      if (tonConnectUI.wallet) { userWallet = tonConnectUI.wallet; updateWalletUI(); }
    }
  } catch (e) {
    console.error('TON Connect error:', e);
  }
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

// ================== HELP GUIDES ==================
window.showSubscriberGuide = function() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md overflow-y-auto';
  modal.innerHTML = `
    <div class="min-h-screen p-4">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-8">
          <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <span class="text-4xl">👤</span>
          </div>
          <h1 class="text-3xl font-bold mb-2">Subscriber Guide</h1>
          <p class="text-slate-400">Learn how to use MySubHub as a subscriber</p>
        </div>

        <div class="space-y-6">
          <div class="glass-card p-6">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <span class="text-2xl">1️⃣</span>
              </div>
              <div>
                <h2 class="text-xl font-bold mb-2">Browse Channels</h2>
                <p class="text-slate-300 mb-3">Discover premium Telegram channels and groups that offer exclusive content.</p>
                <ul class="text-sm text-slate-400 space-y-1 list-disc list-inside">
                  <li>Channels are listed in the main dashboard</li>
                  <li>Each channel shows price, duration, and ratings</li>
                  <li>Click on a channel to see more details</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="glass-card p-6">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <span class="text-2xl">2️⃣</span>
              </div>
              <div>
                <h2 class="text-xl font-bold mb-2">Subscribe with TON</h2>
                <p class="text-slate-300 mb-3">Pay securely using your TON wallet to access premium content.</p>
                <ul class="text-sm text-slate-400 space-y-1 list-disc list-inside">
                  <li>Connect your TON wallet (Tonkeeper, Tonhub, etc.)</li>
                  <li>Review the subscription price and duration</li>
                  <li>Confirm the payment in your wallet</li>
                  <li>You'll be automatically added to the channel</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="glass-card p-6">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <span class="text-2xl">3️⃣</span>
              </div>
              <div>
                <h2 class="text-xl font-bold mb-2">Earn Referral Credits</h2>
                <p class="text-slate-300 mb-3">Invite friends and earn 10% credits on their subscriptions!</p>
                <ul class="text-sm text-slate-400 space-y-1 list-disc list-inside">
                  <li>Go to the "Referrals" tab</li>
                  <li>Copy your unique referral link</li>
                  <li>Share it with friends</li>
                  <li>Earn 10% credits when they subscribe</li>
                  <li>Use credits for your own subscriptions</li>
                </ul>
                <div class="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                  <p class="text-xs text-blue-300">💡 <strong>Note:</strong> Credits can only be used for subscriptions and cannot be withdrawn as TON.</p>
                </div>
              </div>
            </div>
          </div>

          <div class="text-center">
            <button onclick="this.closest('.fixed').remove()" class="btn-primary px-6 py-3 rounded-xl text-sm font-semibold text-white">
              ← Back to App
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
};

window.showOwnerGuide = function() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md overflow-y-auto';
  modal.innerHTML = `
    <div class="min-h-screen p-4">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-8">
          <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
            <span class="text-4xl">📺</span>
          </div>
          <h1 class="text-3xl font-bold mb-2">Channel Owner Guide</h1>
          <p class="text-slate-400">Learn how to monetize your Telegram channel</p>
        </div>

        <div class="space-y-6">
          <div class="glass-card p-6">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <span class="text-2xl">1️⃣</span>
              </div>
              <div>
                <h2 class="text-xl font-bold mb-2">Add Bot as Administrator</h2>
                <p class="text-slate-300 mb-3">First, add @MySubsHub_bot to your channel as an administrator.</p>
                <ul class="text-sm text-slate-400 space-y-1 list-disc list-inside">
                  <li>Open your Telegram channel</li>
                  <li>Go to Channel Settings → Administrators</li>
                  <li>Click "Add Administrator"</li>
                  <li>Search for <strong class="text-blue-400">@MySubsHub_bot</strong></li>
                  <li>Grant ALL permissions (important!)</li>
                  <li>Click "Save" or "Done"</li>
                </ul>
                <div class="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <p class="text-xs text-amber-300">⚠️ <strong>Important:</strong> The bot needs full admin permissions to manage subscribers and verify payments.</p>
                </div>
              </div>
            </div>
          </div>

          <div class="glass-card p-6">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <span class="text-2xl">2️⃣</span>
              </div>
              <div>
                <h2 class="text-xl font-bold mb-2">Register Your Channel</h2>
                <p class="text-slate-300 mb-3">Add your channel to MySubHub platform.</p>
                <ul class="text-sm text-slate-400 space-y-1 list-disc list-inside">
                  <li>Go to "My Channels" tab</li>
                  <li>Fill in channel details:
                    <ul class="ml-4 mt-1 space-y-1">
                      <li>• Channel name</li>
                      <li>• Invite link</li>
                      <li>• Subscription price (in TON)</li>
                      <li>• Duration (1 week to unlimited)</li>
                    </ul>
                  </li>
                  <li>Click "Add Channel"</li>
                </ul>
              </div>
            </div>
          </div>

          <div class="glass-card p-6">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <span class="text-2xl">3️⃣</span>
              </div>
              <div>
                <h2 class="text-xl font-bold mb-2">Earn 99% of Revenue</h2>
                <p class="text-slate-300 mb-3">You receive 99% of subscription fees. Platform takes only 1% fee.</p>
                <ul class="text-sm text-slate-400 space-y-1 list-disc list-inside">
                  <li>Payments go directly to your TON wallet</li>
                  <li>Track earnings in dashboard</li>
                  <li>Request withdrawals anytime</li>
                  <li>Minimum withdrawal: 1 TON</li>
                </ul>
                <div class="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                  <p class="text-xs text-emerald-300">💰 <strong>Revenue Split:</strong> You receive 99% of subscription fees. Platform takes 1% fee.</p>
                </div>
              </div>
            </div>
          </div>

          <div class="glass-card p-6">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <span class="text-2xl">4️⃣</span>
              </div>
              <div>
                <h2 class="text-xl font-bold mb-2">Automatic Subscriber Management</h2>
                <p class="text-slate-300 mb-3">The bot automatically manages your subscribers.</p>
                <ul class="text-sm text-slate-400 space-y-1 list-disc list-inside">
                  <li>When user pays → Bot adds them to channel</li>
                  <li>When subscription expires → Bot removes them</li>
                  <li>Users can renew with one click</li>
                  <li>Track active subscribers in dashboard</li>
                </ul>
                <div class="mt-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                  <p class="text-xs text-blue-300">🤖 <strong>Automatic:</strong> Everything is automated! You don't need to manually add/remove users.</p>
                </div>
              </div>
            </div>
          </div>

          <div class="text-center">
            <button onclick="this.closest('.fixed').remove()" class="btn-primary px-6 py-3 rounded-xl text-sm font-semibold text-white">
              ← Back to App
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
};

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
    } else if (startParam === 'help-subscriber') {
      showSubscriberGuide();
    } else if (startParam === 'help-owner') {
      showOwnerGuide();
    } else if (startParam === 'owner') {
      window.switchPage('owner');
    } else if (startParam === 'admin' && window.isAdmin) {
      window.switchPage('admin');
    } else if (startParam === 'admin-channels' && window.isAdmin) {
      window.switchPage('admin-channels');
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
console.log('MySubHub app.js v3.2 loaded');
