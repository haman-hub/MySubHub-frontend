// MySubHub - Fixed Production app.js
// Security fixes: XSS prevention, safe HTML rendering, modern APIs

// ================== SECURITY: HTML ESCAPING ==================
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Safe template helper - escapes all interpolated values
function safeHtml(strings, ...values) {
  return strings.reduce((result, str, i) => {
    const value = i < values.length ? escapeHtml(String(values[i] ?? '')) : '';
    return result + str + value;
  }, '');
}

// ================== TOAST NOTIFICATION SYSTEM ==================
const Toast = {
  container: null,
  
  init() {
    if (this.container) return;
    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.style.cssText = 'position:fixed;top:80px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
    document.body.appendChild(this.container);
  },

  show(message, type = 'info', duration = 3000) {
    this.init();
    const toast = document.createElement('div');
    const colors = {
      success: 'bg-emerald-500/90 border-emerald-400',
      error: 'bg-red-500/90 border-red-400',
      warning: 'bg-amber-500/90 border-amber-400',
      info: 'bg-blue-500/90 border-blue-400',
    };
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };
    
    toast.style.cssText = `
      pointer-events:auto;
      padding:12px 16px;
      border-radius:12px;
      border:1px solid;
      color:white;
      font-size:13px;
      font-weight:500;
      max-width:320px;
      backdrop-filter:blur(12px);
      box-shadow:0 8px 24px rgba(0,0,0,0.4);
      animation:slideIn 0.3s ease;
      display:flex;
      align-items:center;
      gap:8px;
    `;
    toast.className = colors[type] || colors.info;
    toast.innerHTML = `<span style="font-size:16px">${icons[type] || icons.info}</span><span>${escapeHtml(message)}</span>`;
    
    this.container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  success(msg) { this.show(msg, 'success'); },
  error(msg) { this.show(msg, 'error', 5000); },
  warning(msg) { this.show(msg, 'warning', 4000); },
  info(msg) { this.show(msg, 'info'); },
};

// Add toast animations
const toastStyle = document.createElement('style');
toastStyle.textContent = `
  @keyframes slideIn { from { opacity:0; transform:translateX(100%); } to { opacity:1; transform:translateX(0); } }
  @keyframes slideOut { from { opacity:1; transform:translateX(0); } to { opacity:0; transform:translateX(100%); } }
`;
document.head.appendChild(toastStyle);

// ================== API HELPER ==================
const API_BASE = window.MYSUBHUB_API || 'https://mslxnegbtstpdwauugmq.supabase.co/functions/v1/mainbot';

async function apiFetch(url, options = {}) {
  const TG = window.Telegram?.WebApp || {};
  const initData = TG.initData || '';
  const headers = {
    'x-telegram-initdata': initData,
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (!initData) {
    console.warn('No Telegram initData available');
    if (url === '/api/auth/validate') return { user: null, error: 'Not in Telegram' };
    if (url === '/api/subscriptions/my') return { error: 'Not authenticated - open via Telegram bot' };
    if (url === '/api/channels/my') return { error: 'Not authenticated - open via Telegram bot' };
    if (url === '/api/referrals/stats') return { error: 'Not authenticated - open via Telegram bot' };
    return { success: true };
  }

  try {
    const res = await fetch(`${API_BASE}${url}`, { ...options, headers });

    if (res.status === 401 || res.status === 403) {
      if (url === '/api/auth/validate') return { user: null };
      return { error: 'Unauthorized - please restart the app' };
    }

    if (res.status === 429) {
      return { error: 'Too many requests. Please wait.' };
    }

    if (res.status === 409) {
      const data = await res.json();
      return data;
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      return { error: error.error || `Request failed` };
    }
    return res.json();
  } catch (err) {
    console.error('API fetch error:', err);
    return { error: 'Network error - check your connection' };
  }
}

// ================== DIAGNOSTIC FUNCTION ==================
window.runDiagnostic = async function() {
  console.log('🔍 Running MySubHub Diagnostic...\n');
  
  const results = {
    apiBase: API_BASE,
    hasTelegram: !!window.Telegram?.WebApp,
    hasInitData: !!window.Telegram?.WebApp?.initData,
    healthCheck: null,
    authCheck: null,
    subscriptionsCheck: null,
    channelsCheck: null,
    referralsCheck: null,
  };
  
  // Health check
  try {
    const res = await fetch(`${API_BASE}/health`);
    results.healthCheck = { status: res.status, data: await res.json() };
    console.log('✅ Health check:', results.healthCheck);
  } catch (e) {
    results.healthCheck = { error: e.message };
    console.error('❌ Health check failed:', e.message);
  }
  
  // Auth check
  try {
    const auth = await apiFetch('/api/auth/validate');
    results.authCheck = auth;
    console.log('✅ Auth check:', auth);
  } catch (e) {
    results.authCheck = { error: e.message };
    console.error('❌ Auth check failed:', e.message);
  }
  
  // Subscriptions check
  try {
    const subs = await apiFetch('/api/subscriptions/my');
    results.subscriptionsCheck = subs;
    console.log('✅ Subscriptions check:', subs);
  } catch (e) {
    results.subscriptionsCheck = { error: e.message };
    console.error('❌ Subscriptions check failed:', e.message);
  }
  
  // Channels check
  try {
    const channels = await apiFetch('/api/channels/my');
    results.channelsCheck = channels;
    console.log('✅ Channels check:', channels);
  } catch (e) {
    results.channelsCheck = { error: e.message };
    console.error('❌ Channels check failed:', e.message);
  }
  
  // Referrals check
  try {
    const refs = await apiFetch('/api/referrals/stats');
    results.referralsCheck = refs;
    console.log('✅ Referrals check:', refs);
  } catch (e) {
    results.referralsCheck = { error: e.message };
    console.error('❌ Referrals check failed:', e.message);
  }
  
  console.log('\n📋 Full diagnostic results:', results);
  
  // Show results in UI
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
      <h2 class="text-xl font-bold text-white mb-4">🔍 Diagnostic Results</h2>
      <div class="space-y-3 text-sm">
        <div class="bg-slate-800/50 rounded-lg p-3">
          <p class="text-slate-400 text-xs mb-1">API Base URL</p>
          <p class="text-white font-mono text-xs break-all">${escapeHtml(results.apiBase)}</p>
        </div>
        <div class="bg-slate-800/50 rounded-lg p-3">
          <p class="text-slate-400 text-xs mb-1">Telegram WebApp</p>
          <p class="${results.hasTelegram ? 'text-emerald-400' : 'text-red-400'}">${results.hasTelegram ? '✅ Loaded' : '❌ Not loaded'}</p>
        </div>
        <div class="bg-slate-800/50 rounded-lg p-3">
          <p class="text-slate-400 text-xs mb-1">Init Data</p>
          <p class="${results.hasInitData ? 'text-emerald-400' : 'text-red-400'}">${results.hasInitData ? '✅ Present' : '❌ Missing'}</p>
        </div>
        <div class="bg-slate-800/50 rounded-lg p-3">
          <p class="text-slate-400 text-xs mb-1">Health Check</p>
          <p class="${results.healthCheck?.data?.status === 'healthy' ? 'text-emerald-400' : 'text-red-400'}">${results.healthCheck?.data?.status === 'healthy' ? '✅ Healthy' : '❌ ' + (results.healthCheck?.error || results.healthCheck?.data?.status || 'Failed')}</p>
        </div>
        <div class="bg-slate-800/50 rounded-lg p-3">
          <p class="text-slate-400 text-xs mb-1">Auth</p>
          <p class="${results.authCheck?.user ? 'text-emerald-400' : 'text-red-400'}">${results.authCheck?.user ? '✅ ' + escapeHtml(results.authCheck.user.first_name || 'User') : '❌ ' + escapeHtml(results.authCheck?.error || 'Failed')}</p>
        </div>
        <div class="bg-slate-800/50 rounded-lg p-3">
          <p class="text-slate-400 text-xs mb-1">Subscriptions</p>
          <p class="${Array.isArray(results.subscriptionsCheck) ? 'text-emerald-400' : 'text-red-400'}">${Array.isArray(results.subscriptionsCheck) ? '✅ ' + results.subscriptionsCheck.length + ' items' : '❌ ' + escapeHtml(results.subscriptionsCheck?.error || 'Failed')}</p>
        </div>
        <div class="bg-slate-800/50 rounded-lg p-3">
          <p class="text-slate-400 text-xs mb-1">Channels</p>
          <p class="${Array.isArray(results.channelsCheck) ? 'text-emerald-400' : 'text-red-400'}">${Array.isArray(results.channelsCheck) ? '✅ ' + results.channelsCheck.length + ' items' : '❌ ' + escapeHtml(results.channelsCheck?.error || 'Failed')}</p>
        </div>
        <div class="bg-slate-800/50 rounded-lg p-3">
          <p class="text-slate-400 text-xs mb-1">Referrals</p>
          <p class="${results.referralsCheck?.referralCode ? 'text-emerald-400' : 'text-red-400'}">${results.referralsCheck?.referralCode ? '✅ Loaded' : '❌ ' + escapeHtml(results.referralsCheck?.error || 'Failed')}</p>
        </div>
      </div>
      <button onclick="this.closest('.fixed').remove()" class="btn-primary w-full mt-4 py-3 rounded-xl text-white font-semibold">Close</button>
    </div>
  `;
  document.body.appendChild(modal);
  
  return results;
};

// ================== PAGE NAVIGATION ==================
window.switchPage = function(pageId) {
  if (pageId === 'admin' && !window.isAdmin) pageId = 'subscriptions';

  const allPages = ['purchase', 'subscriptions', 'owner', 'referrals', 'admin'];
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

  const navButtonMap = {
    'subscriptions': 'nav-subscriptions',
    'owner': 'nav-owner',
    'referrals': 'nav-referrals',
    'admin': 'nav-admin'
  };

  Object.values(navButtonMap).forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.classList.remove('active', 'text-ton-400', 'text-emerald-400', 'text-amber-400', 'text-purple-400');
      btn.classList.add('text-slate-400');
    }
  });

  const activeBtnId = navButtonMap[pageId];
  if (activeBtnId) {
    const activeBtn = document.getElementById(activeBtnId);
    if (activeBtn) {
      activeBtn.classList.add('active');
      activeBtn.classList.remove('text-slate-400');
      let colorClass = 'text-ton-400';
      if (pageId === 'owner') colorClass = 'text-emerald-400';
      else if (pageId === 'referrals') colorClass = 'text-purple-400';
      else if (pageId === 'admin') colorClass = 'text-amber-400';
      activeBtn.classList.add(colorClass);
    }
  }

  if (pageId === 'subscriptions' && window.loadSubscriptions) window.loadSubscriptions();
  else if (pageId === 'owner' && window.loadOwnerDashboard) window.loadOwnerDashboard();
  else if (pageId === 'referrals' && window.loadReferralDashboard) window.loadReferralDashboard();
  else if (pageId === 'admin' && window.loadAdminDashboard) window.loadAdminDashboard();

  window.currentPage = pageId;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ================== THEME MANAGEMENT ==================
window.toggleTheme = function() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  document.body.className = newTheme === 'dark' ? 'theme-dark' : 'theme-light';
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) themeBtn.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
};

// ================== LANGUAGE ==================
window.openLanguageModal = function() {
  const modal = document.getElementById('language-modal');
  if (modal) modal.classList.remove('hidden');
};

window.closeLanguageModal = function() {
  const modal = document.getElementById('language-modal');
  if (modal) modal.classList.add('hidden');
};

window.selectLanguage = function(lang) {
  if (typeof setLanguage === 'function') setLanguage(lang);
  window.closeLanguageModal();
  Toast.success('Language updated');
};

// ================== ADD CHANNEL MODAL ==================
window.openAddChannelModal = function() {
  const modal = document.getElementById('add-channel-modal');
  if (modal) modal.classList.remove('hidden');
};

window.closeAddChannelModal = function() {
  const modal = document.getElementById('add-channel-modal');
  if (modal) modal.classList.add('hidden');
};

window.submitAddChannel = async function() {
  const name = document.getElementById('add-channel-name')?.value?.trim();
  const link = document.getElementById('add-channel-link')?.value?.trim();
  const price = document.getElementById('add-channel-price')?.value;
  const duration = document.getElementById('add-channel-duration')?.value;

  if (!name || !link) {
    Toast.error('Please fill in channel name and invite link');
    return;
  }

  // Validate invite link format
  if (!link.match(/^https:\/\/t\.me\/\+?[A-Za-z0-9_-]+/)) {
    Toast.error('Please enter a valid Telegram invite link');
    return;
  }

  if (!price || parseFloat(price) <= 0) {
    Toast.error('Please enter a valid subscription price');
    return;
  }

  try {
    const res = await apiFetch('/api/channels/register', {
      method: 'POST',
      body: JSON.stringify({
        channel_name: name,
        channel_invite_link: link,
        subscription_price: parseFloat(price),
        duration_days: parseInt(duration) || 30,
      })
    });

    if (res.error) {
      Toast.error(res.error);
    } else {
      Toast.success('Channel added successfully!');
      window.closeAddChannelModal();
      // Clear form
      document.getElementById('add-channel-name').value = '';
      document.getElementById('add-channel-link').value = '';
      if (window.loadOwnerDashboard) window.loadOwnerDashboard();
    }
  } catch (e) {
    Toast.error('Failed to add channel: ' + e.message);
  }
};

// ================== EDIT CHANNEL MODAL ==================
window.openEditModal = function(channelId) {
  window.currentEditChannelId = channelId;
  const modal = document.getElementById('edit-modal');
  if (modal) modal.classList.remove('hidden');
};

window.closeEditModal = function() {
  const modal = document.getElementById('edit-modal');
  if (modal) modal.classList.add('hidden');
};

window.submitEditChannel = async function() {
  const price = document.getElementById('edit-price')?.value;
  const duration = document.getElementById('edit-duration')?.value;

  if (!window.currentEditChannelId) {
    Toast.error('No channel selected');
    return;
  }

  if (!price || parseFloat(price) <= 0) {
    Toast.error('Please enter a valid price');
    return;
  }

  try {
    const res = await apiFetch(`/api/channels/${window.currentEditChannelId}`, {
      method: 'PUT',
      body: JSON.stringify({
        subscription_price: parseFloat(price),
        duration_days: parseInt(duration)
      })
    });

    if (res.error) {
      Toast.error(res.error);
    } else {
      Toast.success('Channel updated!');
      window.closeEditModal();
      if (window.loadOwnerDashboard) window.loadOwnerDashboard();
    }
  } catch (e) {
    Toast.error('Failed to update: ' + e.message);
  }
};

// ================== RATING MODAL ==================
window.openRating = function(channelId) {
  window.currentRatingChannelId = channelId;
  window.currentRating = 0;

  const modal = document.getElementById('rating-modal');
  if (modal) modal.classList.remove('hidden');

  const starContainer = document.getElementById('star-rating');
  if (starContainer) {
    starContainer.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('span');
      star.textContent = '☆';
      star.className = 'text-3xl cursor-pointer text-yellow-500 hover:scale-110 transition-transform';
      star.onclick = () => window.selectRating(i);
      starContainer.appendChild(star);
    }
  }
};

window.closeRating = function() {
  const modal = document.getElementById('rating-modal');
  if (modal) modal.classList.add('hidden');
};

window.selectRating = function(rating) {
  window.currentRating = rating;
  const stars = document.querySelectorAll('#star-rating span');
  stars.forEach((star, index) => {
    star.textContent = index < rating ? '★' : '☆';
  });
};

window.submitRating = async function() {
  if (!window.currentRating || !window.currentRatingChannelId) {
    Toast.error('Please select a rating');
    return;
  }

  const comment = document.getElementById('rating-comment')?.value || '';

  try {
    const res = await apiFetch('/api/reviews', {
      method: 'POST',
      body: JSON.stringify({
        channel_id: window.currentRatingChannelId,
        rating: window.currentRating,
        comment: comment
      })
    });

    if (res.error) {
      Toast.error(res.error);
    } else {
      Toast.success('Rating submitted!');
      window.closeRating();
    }
  } catch (e) {
    Toast.error('Failed to submit rating: ' + e.message);
  }
};

// ================== REPORT MODAL ==================
window.openReport = function(channelId) {
  window.currentReportChannelId = channelId;
  const modal = document.getElementById('report-modal');
  if (modal) modal.classList.remove('hidden');
};

window.closeReport = function() {
  const modal = document.getElementById('report-modal');
  if (modal) modal.classList.add('hidden');
};

window.submitReport = async function() {
  const reason = document.getElementById('report-reason')?.value;
  const description = document.getElementById('report-description')?.value;

  if (!window.currentReportChannelId) {
    Toast.error('No channel selected');
    return;
  }

  try {
    const res = await apiFetch('/api/reports', {
      method: 'POST',
      body: JSON.stringify({
        channel_id: window.currentReportChannelId,
        reason: reason,
        description: description
      })
    });

    if (res.error) {
      Toast.error(res.error);
    } else {
      Toast.success('Report submitted. Thank you!');
      window.closeReport();
    }
  } catch (e) {
    Toast.error('Failed to submit report: ' + e.message);
  }
};

// ================== SUBSCRIPTIONS ==================
window.loadSubscriptions = async function() {
  const list = document.getElementById('subscriptions-list');
  if (!list) return;

  list.innerHTML = '<div class="glass-card p-10 text-center text-slate-400"><div class="animate-pulse">Loading subscriptions...</div></div>';

  try {
    const subs = await apiFetch('/api/subscriptions/my');

    if (subs && subs.error) {
      list.innerHTML = `
        <div class="glass-card p-6 text-center">
          <p class="text-red-400 mb-2">⚠️ Failed to load subscriptions</p>
          <p class="text-xs text-slate-500 mb-3">${escapeHtml(subs.error)}</p>
          <button onclick="loadSubscriptions()" class="btn-primary px-4 py-2 rounded-lg text-xs text-white">Retry</button>
          <button onclick="runDiagnostic()" class="btn-secondary px-4 py-2 rounded-lg text-xs ml-2">Run Diagnostic</button>
        </div>
      `;
      return;
    }

    if (!subs || !subs.length) {
      list.innerHTML = '<div class="glass-card p-10 text-center text-slate-400">No subscriptions yet. Subscribe to a channel to get started!</div>';
      return;
    }

    // Update stats
    const active = subs.filter(s => new Date(s.end_date) > new Date()).length;
    const expiring = subs.filter(s => {
      const days = Math.ceil((new Date(s.end_date) - Date.now()) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= 7;
    }).length;
    const totalSpent = subs.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);

    const statActive = document.getElementById('stat-active');
    const statExpiring = document.getElementById('stat-expiring');
    const statSpent = document.getElementById('stat-spent');
    if (statActive) statActive.textContent = active;
    if (statExpiring) statExpiring.textContent = expiring;
    if (statSpent) statSpent.textContent = totalSpent.toFixed(2);

    // SECURITY FIX: Use escapeHtml for all user-generated content
    list.innerHTML = subs.map(s => {
      const channel = s.channel || {};
      const daysLeft = Math.ceil((new Date(s.end_date) - Date.now()) / (1000 * 60 * 60 * 24));
      const isExpired = daysLeft < 0;
      const isExpiring = daysLeft >= 0 && daysLeft <= 7;
      const inviteLink = escapeHtml(channel.channel_invite_link || '');
      const channelName = escapeHtml(channel.channel_name || 'Unknown');
      const endDate = new Date(s.end_date).toLocaleDateString();

      return `
        <div class="glass-card p-4 mb-3 cursor-pointer hover:border-blue-500/50 transition-all" onclick="joinChannel('${inviteLink}')">
          <div class="flex justify-between items-start mb-2">
            <div class="flex items-center gap-2">
              <h3 class="font-semibold text-white">${channelName}</h3>
              ${channel.is_verified ? '<span class="text-blue-400 text-sm" title="Verified">✓</span>' : ''}
            </div>
            <span class="badge ${isExpired ? 'bg-red-500/10 text-red-400' : isExpiring ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}">
              ${isExpired ? 'Expired' : isExpiring ? '⚠️ ' + daysLeft + 'd' : 'Active'}
            </span>
          </div>
          <p class="text-slate-400 text-sm mb-3">Expires: ${endDate}</p>
          <div class="flex gap-2 flex-wrap">
            ${!isExpired && inviteLink ? `<button onclick="event.stopPropagation(); joinChannel('${inviteLink}')" class="btn-primary px-3 py-1.5 rounded-xl text-xs text-white">📺 Open</button>` : ''}
            <button onclick="event.stopPropagation(); openRating('${s.channel_id}')" class="btn-secondary px-3 py-1.5 rounded-xl text-xs">⭐ Rate</button>
            <button onclick="event.stopPropagation(); openReport('${s.channel_id}')" class="btn-secondary px-3 py-1.5 rounded-xl text-xs">🚩 Report</button>
            ${isExpired ? `<button onclick="event.stopPropagation(); renewSubscription('${s.channel_id}')" class="btn-primary px-3 py-1.5 rounded-xl text-xs text-white">🔄 Renew</button>` : ''}
          </div>
        </div>
      `;
    }).join('');
  } catch (e) {
    console.error('Error loading subscriptions:', e);
    list.innerHTML = '<p class="text-red-400 text-center py-6">Failed to load subscriptions. Pull to retry.</p>';
  }
};

window.joinChannel = function(inviteLink) {
  if (!inviteLink) {
    Toast.warning('No invite link available');
    return;
  }
  const TG = window.Telegram?.WebApp;
  if (TG?.openLink) {
    TG.openLink(inviteLink);
  } else {
    window.open(inviteLink, '_blank');
  }
};

window.renewSubscription = function(channelId) {
  window.switchPage('purchase');
  if (window.loadPurchasePage) window.loadPurchasePage(channelId);
};

// ================== OWNER DASHBOARD ==================
window.loadOwnerDashboard = async function() {
  const container = document.getElementById('owner-dashboard');
  if (!container) return;

  container.innerHTML = '<div class="glass-card p-10 text-center text-slate-400"><div class="animate-pulse">Loading channels...</div></div>';

  try {
    const channels = await apiFetch('/api/channels/my');

    if (channels && channels.error) {
      container.innerHTML = `
        <div class="glass-card p-6 text-center">
          <p class="text-red-400 mb-2">⚠️ Failed to load channels</p>
          <p class="text-xs text-slate-500 mb-3">${escapeHtml(channels.error)}</p>
          <button onclick="loadOwnerDashboard()" class="btn-primary px-4 py-2 rounded-lg text-xs text-white">Retry</button>
          <button onclick="runDiagnostic()" class="btn-secondary px-4 py-2 rounded-lg text-xs ml-2">Run Diagnostic</button>
        </div>
      `;
      return;
    }

    if (!channels || !channels.length) {
      container.innerHTML = `
        <div class="glass-card p-8 text-center">
          <p class="text-slate-400 mb-4">No channels registered yet.</p>
          <button onclick="openAddChannelModal()" class="btn-primary text-white px-6 py-3 rounded-xl font-semibold">+ Add Your First Channel</button>
        </div>
      `;
      return;
    }

    container.innerHTML = channels.map(ch => {
      const name = escapeHtml(ch.channel_name || 'Unknown');
      const price = parseFloat(ch.subscription_price || 0).toFixed(2);
      const duration = ch.duration_days || 30;
      const activeSubs = ch.active_subscribers || 0;
      const avgRating = ch.avg_rating || 0;
      const botLink = `https://t.me/YourBot?start=${ch.id}`;

      return `
        <div class="glass-card p-4 mb-3">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h3 class="font-semibold text-white flex items-center gap-2">
                ${name}
                ${ch.is_verified ? '<span class="text-blue-400 text-xs">✓ Verified</span>' : ''}
              </h3>
              <p class="text-slate-400 text-xs mt-1">${price} TON / ${duration} days</p>
            </div>
            <span class="badge ${ch.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}">
              ${ch.is_active ? '● Active' : '○ Inactive'}
            </span>
          </div>
          
          <div class="grid grid-cols-3 gap-2 mb-3">
            <div class="bg-slate-800/50 rounded-lg p-2 text-center">
              <p class="text-xs text-slate-400">Subscribers</p>
              <p class="text-lg font-bold text-white">${activeSubs}</p>
            </div>
            <div class="bg-slate-800/50 rounded-lg p-2 text-center">
              <p class="text-xs text-slate-400">Rating</p>
              <p class="text-lg font-bold text-yellow-400">${avgRating > 0 ? '⭐ ' + avgRating.toFixed(1) : '—'}</p>
            </div>
            <div class="bg-slate-800/50 rounded-lg p-2 text-center">
              <p class="text-xs text-slate-400">Reviews</p>
              <p class="text-lg font-bold text-white">${ch.review_count || 0}</p>
            </div>
          </div>

          <div class="flex gap-2 flex-wrap">
            <button onclick="openEditModal('${ch.id}')" class="btn-secondary px-3 py-1.5 rounded-xl text-xs">⚙️ Edit</button>
            <button onclick="copyShareLink('${escapeHtml(ch.id)}')" class="btn-secondary px-3 py-1.5 rounded-xl text-xs">📋 Share Link</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (e) {
    console.error('Error loading owner dashboard:', e);
    container.innerHTML = '<p class="text-red-400 text-center py-6">Failed to load channels</p>';
  }
};

window.copyShareLink = function(channelId) {
  const link = `https://t.me/YourBot?start=${channelId}`;
  navigator.clipboard.writeText(link).then(() => {
    Toast.success('Share link copied!');
  }).catch(() => {
    Toast.error('Failed to copy');
  });
};

// ================== REFERRAL DASHBOARD ==================
window.loadReferralDashboard = async function() {
  const container = document.getElementById('referral-dashboard');
  if (!container) return;

  container.innerHTML = '<div class="glass-card p-10 text-center text-slate-400"><div class="animate-pulse">Loading referral data...</div></div>';

  try {
    const stats = await apiFetch('/api/referrals/stats');

    if (stats && stats.error) {
      container.innerHTML = `
        <div class="glass-card p-6 text-center">
          <p class="text-red-400 mb-2">⚠️ Failed to load referral data</p>
          <p class="text-xs text-slate-500 mb-3">${escapeHtml(stats.error)}</p>
          <button onclick="loadReferralDashboard()" class="btn-primary px-4 py-2 rounded-lg text-xs text-white">Retry</button>
          <button onclick="runDiagnostic()" class="btn-secondary px-4 py-2 rounded-lg text-xs ml-2">Run Diagnostic</button>
        </div>
      `;
      return;
    }

    const botReferralLink = stats.referralLink || '';

    container.innerHTML = `
      <div class="glass-card p-5 mb-4">
        <h3 class="text-lg font-bold text-white mb-4">🎁 Referral Program</h3>
        <div class="grid grid-cols-3 gap-2 mb-4">
          <div class="bg-slate-800/50 rounded-xl p-4 text-center">
            <p class="text-slate-400 text-xs mb-1">Balance</p>
            <p class="text-lg font-bold text-emerald-400">${(stats.currentBalance || 0).toFixed(4)} TON</p>
          </div>
          <div class="bg-slate-800/50 rounded-xl p-4 text-center">
            <p class="text-slate-400 text-xs mb-1">Referrals</p>
            <p class="text-2xl font-bold text-blue-400">${stats.totalReferrals || 0}</p>
          </div>
          <div class="bg-slate-800/50 rounded-xl p-4 text-center">
            <p class="text-slate-400 text-xs mb-1">Earned</p>
            <p class="text-lg font-bold text-white">${(stats.totalCreditsEarned || 0).toFixed(4)} TON</p>
          </div>
        </div>
        <div class="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-4 mb-4">
          <p class="text-sm text-slate-300 mb-2">🔗 Your Referral Link</p>
          <div class="flex gap-2">
            <input type="text" id="referral-link" value="${escapeHtml(botReferralLink)}" class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" readonly>
            <button onclick="copyReferralLink()" class="btn-primary px-4 py-2 rounded-lg text-sm text-white">📋 Copy</button>
          </div>
          <p class="text-xs text-slate-400 mt-2">Earn 5% credits on every subscription made through your link!</p>
        </div>
        <button onclick="shareReferralLink()" class="btn-primary w-full py-3 rounded-xl text-sm font-semibold text-white">📤 Share Referral Link</button>
      </div>
    `;
  } catch (e) {
    console.error('Error loading referral dashboard:', e);
    container.innerHTML = '<p class="text-red-400 text-center py-6">Failed to load referral data</p>';
  }
};

window.copyReferralLink = function() {
  const input = document.getElementById('referral-link');
  if (input) {
    // FIX: Use modern Clipboard API instead of deprecated execCommand
    navigator.clipboard.writeText(input.value).then(() => {
      Toast.success('Referral link copied!');
    }).catch(() => {
      // Fallback for older browsers
      input.select();
      document.execCommand('copy');
      Toast.success('Referral link copied!');
    });
  }
};

window.shareReferralLink = async function() {
  const input = document.getElementById('referral-link');
  if (!input) return;

  const link = input.value;
  const message = `🎁 Join MySubHub and subscribe to premium Telegram channels!\n\n${link}\n\nEarn credits when friends subscribe! 🚀`;

  // Try native share API first (works great in Telegram)
  if (navigator.share) {
    try {
      await navigator.share({ title: 'MySubHub', text: message, url: link });
      return;
    } catch (e) {
      // User cancelled or not supported
    }
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(message);
    Toast.success('Share message copied! Paste it anywhere.');
  } catch {
    Toast.error('Could not copy. Try manually.');
  }
};

// ================== ADMIN DASHBOARD ==================
window.loadAdminDashboard = async function() {
  try {
    const reports = await apiFetch('/api/admin/reports');
    const withdrawals = await apiFetch('/api/admin/withdrawals');

    const reportsContainer = document.getElementById('admin-reports');
    const withdrawalsContainer = document.getElementById('admin-withdrawals');

    if (reportsContainer) {
      if (!Array.isArray(reports) || reports.length === 0) {
        reportsContainer.innerHTML = '<p class="text-slate-400 text-center py-6">No reports.</p>';
      } else {
        // SECURITY FIX: All user content escaped
        reportsContainer.innerHTML = reports.map(r => {
          const reporterName = escapeHtml(r.reporter?.first_name || 'Unknown');
          const channelName = escapeHtml(r.channel?.channel_name || 'Unknown');
          const reason = escapeHtml(r.reason || 'No reason');
          const description = escapeHtml(r.description || '');
          const date = new Date(r.created_at).toLocaleDateString();

          return `
            <div class="glass-card p-4 border-l-4 ${r.status === 'pending' ? 'border-amber-500' : 'border-red-500'}">
              <div class="flex justify-between items-start mb-3">
                <span class="text-xs font-bold uppercase px-2 py-1 rounded ${r.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}">${escapeHtml(r.status || 'pending')}</span>
                <span class="text-xs text-slate-500">${date}</span>
              </div>
              <div class="space-y-3">
                <div class="bg-slate-800/50 rounded-lg p-3">
                  <p class="text-xs text-slate-400 mb-1">📢 Reported by:</p>
                  <p class="text-sm font-semibold text-white">${reporterName}</p>
                </div>
                <div class="bg-slate-800/50 rounded-lg p-3">
                  <p class="text-xs text-slate-400 mb-1">📺 Channel:</p>
                  <p class="text-sm font-semibold text-white">${channelName}</p>
                </div>
                <div class="bg-slate-800/50 rounded-lg p-3">
                  <p class="text-xs text-slate-400 mb-1">⚠️ Reason:</p>
                  <p class="text-sm font-semibold text-red-400 uppercase">${reason}</p>
                  ${description ? `<p class="text-sm text-slate-300 mt-2">${description}</p>` : ''}
                </div>
              </div>
              ${r.status === 'pending' ? `
                <div class="flex gap-2 mt-4 pt-3 border-t border-slate-700">
                  <button onclick="reviewReport('${r.id}', 'ban')" class="flex-1 bg-red-600/20 text-red-400 px-3 py-2 rounded-xl text-sm font-semibold">🚫 Ban</button>
                  <button onclick="reviewReport('${r.id}', 'dismiss')" class="flex-1 bg-green-600/20 text-green-400 px-3 py-2 rounded-xl text-sm font-semibold">✅ Dismiss</button>
                </div>
              ` : ''}
            </div>
          `;
        }).join('');
      }
    }

    if (withdrawalsContainer) {
      if (!Array.isArray(withdrawals) || withdrawals.length === 0) {
        withdrawalsContainer.innerHTML = '<p class="text-slate-400 text-center py-6">No pending withdrawals.</p>';
      } else {
        withdrawalsContainer.innerHTML = withdrawals.map(w => `
          <div class="glass-card p-4">
            <h3 class="font-semibold text-white">Owner #${escapeHtml(String(w.channel_owner_id))}</h3>
            <p class="text-slate-400 text-sm">${parseFloat(w.amount).toFixed(4)} TON</p>
            <p class="text-xs text-slate-500 mt-1">Wallet: ${escapeHtml(w.wallet_address || 'N/A').substring(0, 12)}...</p>
            <button onclick="approveWithdrawal('${w.id}')" class="btn-primary mt-3 w-full text-white px-3 py-1.5 rounded-xl text-sm">Approve</button>
          </div>
        `).join('');
      }
    }
  } catch (e) {
    console.error('Error loading admin dashboard:', e);
  }
};

window.reviewReport = async function(reportId, action) {
  if (!confirm(action === 'ban' ? 'Ban this channel?' : 'Dismiss this report?')) return;

  try {
    const res = await apiFetch(`/api/admin/reports/${reportId}/review`, {
      method: 'POST',
      body: JSON.stringify({ action })
    });
    if (res.success) {
      Toast.success(`Report ${action === 'ban' ? 'banned' : 'dismissed'}!`);
      if (window.loadAdminDashboard) window.loadAdminDashboard();
    } else {
      Toast.error(res.error || 'Action failed');
    }
  } catch (e) {
    Toast.error('Error: ' + e.message);
  }
};

window.approveWithdrawal = async function(id) {
  if (!confirm('Approve this withdrawal?')) return;

  try {
    const res = await apiFetch(`/api/admin/withdrawals/${id}/approve`, { method: 'POST' });
    if (res.success) {
      Toast.success('Withdrawal approved!');
      if (window.loadAdminDashboard) window.loadAdminDashboard();
    } else {
      Toast.error(res.error || 'Approval failed');
    }
  } catch (e) {
    Toast.error('Error: ' + e.message);
  }
};

window.requestWithdrawal = function() {
  Toast.info('Withdrawal feature - configure your wallet first');
};

// ================== STATE VARIABLES ==================
window.currentUser = null;
window.isAdmin = false;
window.currentPage = 'subscriptions';
window.currentTheme = 'dark';
window.currentEditChannelId = null;
window.currentRatingChannelId = null;
window.currentRating = 0;
window.currentReportChannelId = null;

// ================== TELEGRAM WEBAPP INIT ==================
const TG = window.Telegram?.WebApp || {
  ready: () => {},
  expand: () => {},
  initData: '',
  initDataUnsafe: {},
  HapticFeedback: {
    impactOccurred: () => {},
    selectionChanged: () => {},
    notificationOccurred: () => {}
  }
};

try {
  TG.ready();
  TG.expand();
  // Set header color to match app theme
  if (TG.setHeaderColor) TG.setHeaderColor('#040711');
  if (TG.setBackgroundColor) TG.setBackgroundColor('#040711');
} catch (e) {
  console.warn('Telegram WebApp init:', e);
}

// ================== TON CONNECT WALLET INIT ==================
let tonConnectUI = null;
let userWallet = null;

async function initTonConnect() {
  try {
    if (window.TON_CONNECT_UI) {
      tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: 'https://haman-hub.github.io/MySubHub-frontend/manifest.json',
        buttonRootId: 'ton-connect-button'
      });

      tonConnectUI.onStatusChange(wallet => {
        if (wallet) {
          userWallet = wallet;
          console.log('Wallet connected:', wallet.account.address);
          updateWalletUI();
          saveWalletToBackend(wallet.account.address);
        } else {
          userWallet = null;
          updateWalletUI();
        }
      });

      if (tonConnectUI.wallet) {
        userWallet = tonConnectUI.wallet;
        updateWalletUI();
      }
    }
  } catch (e) {
    console.error('TON Connect init error:', e);
  }
}

function updateWalletUI() {
  const walletStatus = document.getElementById('wallet-status');
  if (walletStatus) {
    if (userWallet) {
      const address = userWallet.account.address;
      const short = address.substring(0, 6) + '...' + address.substring(address.length - 4);
      walletStatus.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="text-emerald-400">✓</span>
          <span class="text-sm text-white font-mono">${escapeHtml(short)}</span>
          <button onclick="disconnectWallet()" class="text-xs text-red-400 hover:text-red-300">✕</button>
        </div>
      `;
    } else {
      walletStatus.innerHTML = `
        <div class="flex items-center gap-2">
          <span class="text-slate-400 text-sm">No wallet</span>
          <button onclick="connectWallet()" class="btn-primary px-3 py-1 rounded-lg text-xs text-white">Connect</button>
        </div>
      `;
    }
  }
}

async function saveWalletToBackend(address) {
  try {
    await apiFetch('/api/auth/wallet', {
      method: 'POST',
      body: JSON.stringify({ wallet_address: address })
    });
  } catch (e) {
    console.error('Error saving wallet:', e);
  }
}

window.connectWallet = async function() {
  if (!tonConnectUI) {
    Toast.error('Wallet integration not ready');
    return;
  }
  try {
    await tonConnectUI.openModal();
  } catch (e) {
    Toast.error('Failed to connect wallet');
  }
};

window.disconnectWallet = async function() {
  if (!tonConnectUI) return;
  try {
    await tonConnectUI.disconnect();
    userWallet = null;
    updateWalletUI();
    Toast.info('Wallet disconnected');
  } catch (e) {
    console.error('Error disconnecting:', e);
  }
};

// ================== INITIALIZATION ==================
async function init() {
  try {
    await initTonConnect();

    const navBar = document.getElementById('nav-bar');
    if (navBar) navBar.classList.remove('hidden');

    const ownerTab = document.getElementById('nav-owner');
    if (ownerTab) ownerTab.style.setProperty('display', 'flex', 'important');

    const urlStart = new URLSearchParams(window.location.search).get('startapp') ||
                     new URLSearchParams(window.location.search).get('start');
    const startParam = TG.initDataUnsafe?.start_param || urlStart;

    if (startParam && /^[0-9a-fA-F-]{36}$/.test(startParam)) {
      if (window.loadPurchasePage) window.loadPurchasePage(startParam);
      window.switchPage('purchase');
    } else if (startParam === 'owner') {
      window.switchPage('owner');
    } else if (startParam === 'admin' && window.isAdmin) {
      window.switchPage('admin');
    } else {
      window.switchPage('subscriptions');
    }
  } catch (error) {
    console.error('Init error:', error);
    window.switchPage('subscriptions');
  }
}

window.onload = function() {
  init();
};

console.log('MySubHub app.js v2.1 loaded');
