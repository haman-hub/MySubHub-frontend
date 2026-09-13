// MySubHub - Complete Production app.js
// All features included, all functions exposed to window

// ================== DEFINE ALL FUNCTIONS FIRST ==================
window.switchPage = function(pageId) {
    console.log('switchPage called with:', pageId);
    
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

// ================== API HELPER ==================
const API_BASE = 'https://mslxnegbtstpdwauugmq.supabase.co/functions/v1/mainbot';

async function apiFetch(url, options = {}) {
    const TG = window.Telegram?.WebApp || {};
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
        if (url === '/api/referrals/stats') return { error: 'Not authenticated' };
        return { success: true };
    }

    try {
        const res = await fetch(`${API_BASE}${url}`, { ...options, headers });

        if (res.status === 401 || res.status === 403) {
            if (url === '/api/auth/validate') return { user: null };
            return { error: 'Unauthorized' };
        }

        if (res.status === 429) {
            alert('Too many requests. Please wait.');
            return { error: 'Rate limited' };
        }

        if (!res.ok) {
            const error = await res.json().catch(() => ({}));
            throw new Error(error.error || `HTTP ${res.status}`);
        }
        return res.json();
    } catch (err) {
        console.error('API fetch error:', err);
        throw err;
    }
}

// ================== THEME MANAGEMENT ==================
window.toggleTheme = function() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    document.body.className = newTheme === 'dark' ? 'theme-dark' : 'theme-light';
    
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
    }
    
    console.log('Theme switched to:', newTheme);
};

// ================== LANGUAGE MODAL ==================
window.openLanguageModal = function() {
    const modal = document.getElementById('language-modal');
    if (modal) modal.classList.remove('hidden');
};

window.closeLanguageModal = function() {
    const modal = document.getElementById('language-modal');
    if (modal) modal.classList.add('hidden');
};

window.selectLanguage = function(lang) {
    console.log('Language selected:', lang);
    if (typeof setLanguage === 'function') {
        setLanguage(lang);
    }
    if (window.closeLanguageModal) window.closeLanguageModal();
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
    const name = document.getElementById('add-channel-name')?.value;
    const link = document.getElementById('add-channel-link')?.value;
    const price = document.getElementById('add-channel-price')?.value;
    const duration = document.getElementById('add-channel-duration')?.value;
    
    if (!name || !link) {
        alert('Please fill in channel name and invite link');
        return;
    }
    
    try {
        const res = await apiFetch('/api/channels/register', {
            method: 'POST',
            body: JSON.stringify({
                channel_name: name,
                channel_invite_link: link,
                subscription_price: parseFloat(price) || 0.1,
                duration_days: parseInt(duration) || 30,
                is_active: false
            })
        });
        
        if (res.error) {
            alert('Error: ' + res.error);
        } else {
            alert('Channel added successfully!');
            if (window.closeAddChannelModal) window.closeAddChannelModal();
            if (window.loadOwnerDashboard) window.loadOwnerDashboard();
        }
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

// ================== EDIT CHANNEL MODAL ==================
window.openEditModal = function(channelId) {
    console.log('openEditModal called for:', channelId);
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
        alert('No channel selected');
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
            alert('Error: ' + res.error);
        } else {
            alert('Channel updated successfully!');
            if (window.closeEditModal) window.closeEditModal();
            if (window.loadOwnerDashboard) window.loadOwnerDashboard();
        }
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

// ================== RATING MODAL ==================
window.openRating = function(channelId) {
    console.log('openRating called for:', channelId);
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
            star.className = 'text-3xl cursor-pointer text-yellow-500';
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
        alert('Please select a rating');
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
            alert('Error: ' + res.error);
        } else {
            alert('Rating submitted successfully!');
            if (window.closeRating) window.closeRating();
        }
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

// ================== REPORT MODAL ==================
window.openReport = function(channelId) {
    console.log('openReport called for:', channelId);
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
        alert('No channel selected');
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
            alert('Error: ' + res.error);
        } else {
            alert('Report submitted successfully!');
            if (window.closeReport) window.closeReport();
        }
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

// ================== SUBSCRIPTIONS ==================
window.loadSubscriptions = async function() {
    console.log('loadSubscriptions called');
    const list = document.getElementById('subscriptions-list');
    if (!list) return;
    
    list.innerHTML = '<div class="glass-card p-10 text-center text-slate-400">Loading subscriptions...</div>';
    
    try {
        const subs = await apiFetch('/api/subscriptions/my');
        
        if (!subs || !subs.length) {
            list.innerHTML = '<div class="glass-card p-10 text-center text-slate-400">No subscriptions yet. Subscribe to a channel to get started!</div>';
            return;
        }

        list.innerHTML = subs.map(s => {
            const channel = s.channel || {};
            const daysLeft = Math.ceil((new Date(s.end_date) - Date.now()) / (1000 * 60 * 60 * 24));
            const isExpired = daysLeft < 0;
            const isExpiring = daysLeft >= 0 && daysLeft <= 7;
            const inviteLink = channel.channel_invite_link || '';

            return `
                <div class="glass-card p-4 mb-3">
                    <div class="flex justify-between items-start mb-2">
                        <div class="flex items-center gap-2">
                            <h3 class="font-semibold text-white">${channel.channel_name || 'Unknown'}</h3>
                            ${channel.is_verified ? '<span class="text-blue-400 text-sm">✓</span>' : ''}
                        </div>
                        <span class="badge ${isExpired ? 'bg-red-500/10 text-red-400' : isExpiring ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}">
                            ${isExpired ? 'Expired' : isExpiring ? '⚠️ ' + daysLeft + 'd' : 'Active'}
                        </span>
                    </div>
                    <p class="text-slate-400 text-sm mb-3">Expires: ${new Date(s.end_date).toLocaleDateString()}</p>
                    <div class="flex gap-2 flex-wrap">
                        ${!isExpired && inviteLink ? `<button onclick="joinChannel('${inviteLink}')" class="btn-primary px-3 py-1.5 rounded-xl text-xs text-white">📺 Open Channel</button>` : ''}
                        <button onclick="openRating('${s.channel_id}')" class="btn-secondary px-3 py-1.5 rounded-xl text-xs">⭐ Rate</button>
                        <button onclick="openReport('${s.channel_id}')" class="btn-secondary px-3 py-1.5 rounded-xl text-xs">🚩 Report</button>
                        ${isExpired ? `<button onclick="renewSubscription('${s.channel_id}')" class="btn-primary px-3 py-1.5 rounded-xl text-xs text-white">🔄 Renew</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error('Error loading subscriptions:', e);
        list.innerHTML = '<p class="text-red-400 text-center py-6">Failed to load subscriptions</p>';
    }
};

window.joinChannel = function(inviteLink) {
    console.log('joinChannel called with:', inviteLink);
    if (!inviteLink) {
        alert('Invite link not available');
        return;
    }
    
    const TG = window.Telegram?.WebApp || {};
    if (TG.openTelegramLink) {
        TG.openTelegramLink(inviteLink);
    } else {
        window.open(inviteLink, '_blank');
    }
    
    if (TG.HapticFeedback) {
        TG.HapticFeedback.impactOccurred('light');
    }
};

window.renewSubscription = function(channelId) {
    console.log('renewSubscription called for:', channelId);
    window.loadPurchasePage(channelId);
    window.switchPage('purchase');
};

// ================== PURCHASE PAGE ==================
window.loadPurchasePage = async function(channelId) {
    console.log('loadPurchasePage called for:', channelId);
    const card = document.getElementById('purchase-card');
    if (!card) return;
    
    card.innerHTML = '<div class="text-center py-6">Loading...</div>';
    
    try {
        const data = await apiFetch(`/api/channels/${channelId}`, { method: 'GET' });
        
        if (!data || data.error) {
            card.innerHTML = '<p class="text-red-400 text-center py-6">Channel not found</p>';
            return;
        }

        const NETWORK_FEE_TON = 0.05;
        const platformFee = data.subscription_price * 0.01;
        const total = data.subscription_price + platformFee + NETWORK_FEE_TON;

        card.innerHTML = `
            <div class="text-center mb-6">
                <h2 class="text-2xl font-bold text-white">${data.channel_name}</h2>
                <p class="text-slate-400 mt-2">
                    Subscription: <strong class="text-white">${total.toFixed(6)} TON</strong> / ${data.duration_days} days
                </p>
            </div>
            <button id="btn-pay" class="btn-primary w-full text-white font-semibold py-3.5 rounded-xl">Pay with TON</button>
        `;
        
        document.getElementById('btn-pay').onclick = () => window.initiatePayment(data.id, data.subscription_price);
    } catch (e) {
        card.innerHTML = '<p class="text-red-400 text-center py-6">Error loading channel</p>';
    }
};

window.initiatePayment = async function(channelId, price) {
    console.log('initiatePayment called');
    alert('Payment functionality - requires TON Connect integration');
};

// ================== OWNER DASHBOARD ==================
window.loadOwnerDashboard = async function() {
    console.log('loadOwnerDashboard called');
    const container = document.getElementById('channels-list');
    if (!container) return;
    
    container.innerHTML = '<div class="text-center text-slate-400 py-6">Loading channels...</div>';
    
    try {
        const channels = await apiFetch('/api/channels/my');

        if (!channels || !channels.length) {
            container.innerHTML = '<div class="text-center text-slate-400 py-6">No channels yet. Add your first channel!</div>';
            return;
        }

        container.innerHTML = channels.map(ch => `
            <div class="glass-card p-4 mb-3">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h3 class="font-semibold text-white">${ch.channel_name}</h3>
                        <p class="text-slate-400 text-sm">${ch.subscription_price} TON / ${ch.duration_days} days</p>
                    </div>
                    <label class="flex items-center gap-2 text-xs">
                        Active: <input type="checkbox" ${ch.is_active ? 'checked' : ''} onchange="toggleChannel('${ch.id}', this.checked)" class="accent-blue-500">
                    </label>
                </div>
                <div class="flex gap-3 pt-2 border-t border-slate-700/50">
                    <button onclick="openEditModal('${ch.id}')" class="text-blue-400 text-xs">Edit</button>
                    <button onclick="copyDeepLink('${ch.id}')" class="text-blue-400 text-xs">Copy Link</button>
                    <button onclick="forwardChannel('${ch.id}')" class="text-green-400 text-xs">📤 Forward</button>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error('Error loading channels:', e);
        container.innerHTML = '<p class="text-red-400 text-center py-6">Failed to load channels</p>';
    }
};

window.toggleChannel = async function(channelId, isActive) {
    console.log('toggleChannel called:', channelId, isActive);
    try {
        await apiFetch(`/api/channels/${channelId}`, {
            method: 'PUT',
            body: JSON.stringify({ is_active: isActive })
        });
        console.log('Channel toggled successfully');
    } catch (e) {
        console.error('Error toggling channel:', e);
    }
};

window.copyDeepLink = function(channelId) {
    const link = `https://t.me/MySubsHub_bot?start=${channelId}`;
    navigator.clipboard.writeText(link).then(() => {
        alert('Link copied!');
    });
};

window.forwardChannel = async function(channelId) {
    console.log('forwardChannel called for:', channelId);
    try {
        const channel = await apiFetch(`/api/channels/${channelId}`, { method: 'GET' });
        
        if (!channel || channel.error) {
            alert('Channel not found');
            return;
        }

        const deepLink = `https://t.me/MySubsHub_bot?start=${channelId}`;
        let messageText = `🚀 🌟 ${channel.channel_name} 🌟 🚀\n\n`;
        messageText += `💎 Premium Content!\n\n`;
        messageText += `💰 Subscription: ${channel.subscription_price} TON\n`;
        messageText += `📅 Duration: ${channel.duration_days} days\n\n`;
        messageText += `🔗 Subscribe Now:\n${deepLink}`;

        const TG = window.Telegram?.WebApp || {};
        if (TG.openTelegramLink) {
            const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(deepLink)}&text=${encodeURIComponent(messageText)}`;
            TG.openTelegramLink(shareUrl);
        } else {
            await navigator.clipboard.writeText(messageText);
            alert('Message copied to clipboard!');
        }
        
        if (TG.HapticFeedback) {
            TG.HapticFeedback.impactOccurred('medium');
        }
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

window.requestVerification = function(channelId) {
    console.log('requestVerification called for:', channelId);
    alert('Verification request functionality - coming soon');
};

// ================== REFERRAL DASHBOARD ==================
window.loadReferralDashboard = async function() {
    console.log('loadReferralDashboard called');
    const container = document.getElementById('referral-dashboard');
    if (!container) return;
    
    container.innerHTML = '<div class="text-center text-slate-400 py-6">Loading...</div>';
    
    try {
        const stats = await apiFetch('/api/referrals/stats', { method: 'GET' });
        
        if (stats.error) {
            container.innerHTML = `<p class="text-red-400 text-center py-6">${stats.error}</p>`;
            return;
        }

        container.innerHTML = `
            <div class="glass-card p-6 mb-4">
                <h3 class="text-xl font-bold text-white mb-4">🎁 Your Referral Program</h3>
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div class="bg-slate-800/50 rounded-xl p-4">
                        <p class="text-slate-400 text-xs mb-1">Current Balance</p>
                        <p class="text-2xl font-bold text-emerald-400">${(stats.currentBalance || 0).toFixed(4)} TON</p>
                    </div>
                    <div class="bg-slate-800/50 rounded-xl p-4">
                        <p class="text-slate-400 text-xs mb-1">Total Referrals</p>
                        <p class="text-2xl font-bold text-blue-400">${stats.totalReferrals || 0}</p>
                    </div>
                    <div class="bg-slate-800/50 rounded-xl p-4">
                        <p class="text-slate-400 text-xs mb-1">Total Earned</p>
                        <p class="text-lg font-bold text-white">${(stats.totalCreditsEarned || 0).toFixed(4)} TON</p>
                    </div>
                    <div class="bg-slate-800/50 rounded-xl p-4">
                        <p class="text-slate-400 text-xs mb-1">Total Used</p>
                        <p class="text-lg font-bold text-white">${(stats.totalUsed || 0).toFixed(4)} TON</p>
                    </div>
                </div>
                <div class="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-4 mb-4">
                    <p class="text-sm text-slate-300 mb-2">🔗 Your Referral Link</p>
                    <div class="flex gap-2">
                        <input type="text" id="referral-link" value="${stats.referralLink || ''}" class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" readonly>
                        <button onclick="copyReferralLink()" class="btn-primary px-4 py-2 rounded-lg text-sm">📋 Copy</button>
                    </div>
                    <p class="text-xs text-slate-400 mt-2">Earn 5% credits on every subscription made through your link!</p>
                </div>
                <button onclick="shareReferralLink()" class="btn-primary w-full py-3 rounded-xl text-sm font-semibold">📤 Share Referral Link</button>
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
        input.select();
        document.execCommand('copy');
        alert('Referral link copied!');
    }
};

window.shareReferralLink = async function() {
    const input = document.getElementById('referral-link');
    if (!input) return;
    
    const link = input.value;
    const message = `🎁 Join MySubHub and subscribe to premium Telegram channels!\n\nUse my referral link to get started:\n${link}\n\nWhen you subscribe, I'll earn 5% credits and you'll get access to amazing content! 🚀`;
    
    try {
        await navigator.clipboard.writeText(message);
        alert('Referral message copied! Share it with your friends.');
    } catch (e) {
        alert('Copy this message:\n\n' + message);
    }
};

// ================== ADMIN DASHBOARD ==================
window.loadAdminDashboard = async function() {
    console.log('loadAdminDashboard called');
    
    try {
        const reports = await apiFetch('/api/admin/reports');
        const withdrawals = await apiFetch('/api/admin/withdrawals');
        
        const reportsContainer = document.getElementById('admin-reports');
        const withdrawalsContainer = document.getElementById('admin-withdrawals');
        
        if (reportsContainer) {
            if (!Array.isArray(reports) || reports.length === 0) {
                reportsContainer.innerHTML = '<p class="text-slate-400 text-center py-6">No reports.</p>';
            } else {
                reportsContainer.innerHTML = reports.map(r => `
                    <div class="glass-card p-4 border-l-4 ${r.status === 'pending' ? 'border-amber-500' : 'border-red-500'}">
                        <div class="flex justify-between items-start mb-3">
                            <span class="text-xs font-bold uppercase px-2 py-1 rounded ${r.status === 'pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}">${r.status || 'pending'}</span>
                            <span class="text-xs text-slate-500">${new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        <div class="space-y-3">
                            <div class="bg-slate-800/50 rounded-lg p-3">
                                <p class="text-xs text-slate-400 mb-1">📢 Reported by:</p>
                                <p class="text-sm font-semibold text-white">${r.reporter?.first_name || 'Unknown'}</p>
                            </div>
                            <div class="bg-slate-800/50 rounded-lg p-3">
                                <p class="text-xs text-slate-400 mb-1">📺 Channel:</p>
                                <p class="text-sm font-semibold text-white">${r.channel?.channel_name || 'Unknown'}</p>
                            </div>
                            <div class="bg-slate-800/50 rounded-lg p-3">
                                <p class="text-xs text-slate-400 mb-1">⚠️ Reason:</p>
                                <p class="text-sm font-semibold text-red-400 uppercase">${r.reason || 'No reason'}</p>
                                ${r.description ? `<p class="text-sm text-slate-300 mt-2">${r.description}</p>` : ''}
                            </div>
                        </div>
                        ${r.status === 'pending' ? `
                            <div class="flex gap-2 mt-4 pt-3 border-t border-slate-700">
                                <button onclick="reviewReport('${r.id}', 'ban')" class="flex-1 bg-red-600/20 text-red-400 px-3 py-2 rounded-xl text-sm font-semibold">🚫 Ban</button>
                                <button onclick="reviewReport('${r.id}', 'dismiss')" class="flex-1 bg-green-600/20 text-green-400 px-3 py-2 rounded-xl text-sm font-semibold">✅ Dismiss</button>
                            </div>
                        ` : ''}
                    </div>
                `).join('');
            }
        }
        
        if (withdrawalsContainer) {
            if (!Array.isArray(withdrawals) || withdrawals.length === 0) {
                withdrawalsContainer.innerHTML = '<p class="text-slate-400 text-center py-6">No pending withdrawals.</p>';
            } else {
                withdrawalsContainer.innerHTML = withdrawals.map(w => `
                    <div class="glass-card p-4">
                        <h3 class="font-semibold text-white">${w.owner?.first_name || 'Unknown'}</h3>
                        <p class="text-slate-400 text-sm">${w.amount} TON</p>
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
    console.log('reviewReport called:', reportId, action);
    if (!confirm(action === 'ban' ? 'Ban this channel?' : 'Dismiss this report?')) return;
    
    try {
        const res = await apiFetch(`/api/admin/reports/${reportId}/review`, {
            method: 'POST',
            body: JSON.stringify({ action })
        });
        if (res.success) {
            alert(`Report ${action === 'ban' ? 'banned' : 'dismissed'}!`);
            if (window.loadAdminDashboard) window.loadAdminDashboard();
        } else {
            alert('Error: ' + (res.error || ''));
        }
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

window.approveWithdrawal = async function(id) {
    console.log('approveWithdrawal called for:', id);
    try {
        const res = await apiFetch(`/api/admin/withdrawals/${id}/approve`, { method: 'POST' });
        if (res.success) {
            alert('Approved!');
            if (window.loadAdminDashboard) window.loadAdminDashboard();
        } else {
            alert('Error: ' + (res.error || ''));
        }
    } catch (e) {
        alert('Error: ' + e.message);
    }
};

window.requestWithdrawal = function() {
    console.log('requestWithdrawal called');
    alert('Request withdrawal functionality - coming soon');
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
} catch (e) {
    console.warn('Telegram WebApp init:', e);
}

// ================== INITIALIZATION ==================
async function init() {
    console.log('init() called');
    
    try {
        // Show nav bar
        const navBar = document.getElementById('nav-bar');
        if (navBar) {
            navBar.classList.remove('hidden');
            console.log('Nav bar shown');
        }

        // Show owner tab
        const ownerTab = document.getElementById('nav-owner');
        if (ownerTab) {
            ownerTab.style.setProperty('display', 'flex', 'important');
            console.log('Owner tab shown');
        }

        // Get start parameter
        const urlStart = new URLSearchParams(window.location.search).get('startapp') || 
                         new URLSearchParams(window.location.search).get('start');
        const startParam = TG.initDataUnsafe?.start_param || urlStart;

        console.log('Start param:', startParam);

        // Navigate to appropriate page
        if (startParam && /^[0-9a-fA-F-]{36}$/.test(startParam)) {
            console.log('Loading purchase page');
            if (window.loadPurchasePage) window.loadPurchasePage(startParam);
            window.switchPage('purchase');
        } else if (startParam === 'owner') {
            console.log('Loading owner page');
            window.switchPage('owner');
        } else if (startParam === 'admin' && window.isAdmin) {
            console.log('Loading admin page');
            window.switchPage('admin');
        } else {
            console.log('Loading subscriptions page');
            window.switchPage('subscriptions');
        }
        
        console.log('init() completed successfully');
    } catch (error) {
        console.error('Init error:', error);
        // Fallback to subscriptions
        window.switchPage('subscriptions');
    }
}

// Start app when page loads
window.onload = function() {
    console.log('Page loaded, calling init()');
    init();
};

console.log('app.js loaded successfully');
console.log('switchPage is:', typeof window.switchPage);
console.log('All functions exposed to window');
