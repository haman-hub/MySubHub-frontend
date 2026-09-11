// ================== CUSTOM MODAL SYSTEM ==================
// Replace native alert/confirm/prompt with custom modals

function showCustomModal(title, message, type = 'alert', callback = null) {
    // Remove existing modal if any
    const existingModal = document.getElementById('custom-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'custom-modal';
    modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4';
    
    let buttonsHTML = '';
    
    if (type === 'alert') {
        buttonsHTML = `
            <button onclick="closeCustomModal()" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition">
                OK
            </button>
        `;
    } else if (type === 'confirm') {
        buttonsHTML = `
            <button onclick="closeCustomModal(false)" class="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2.5 rounded-xl transition">
                Cancel
            </button>
            <button onclick="closeCustomModal(true)" class="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl transition">
                Confirm
            </button>
        `;
    } else if (type === 'prompt') {
        buttonsHTML = `
            <button onclick="closeCustomModal(null)" class="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2.5 rounded-xl transition">
                Cancel
            </button>
            <button onclick="submitCustomPrompt()" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition">
                OK
            </button>
        `;
    }

    let inputHTML = '';
    if (type === 'prompt') {
        inputHTML = `
            <input type="text" id="custom-prompt-input" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 mt-3" placeholder="Enter value..." />
        `;
    }

    modal.innerHTML = `
        <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" onclick="closeCustomModal()"></div>
        <div class="relative bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 class="text-xl font-bold text-white mb-3">${title}</h3>
            <p class="text-slate-300 mb-4">${message}</p>
            ${inputHTML}
            <div class="flex gap-3 mt-5">
                ${buttonsHTML}
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Store callback
    if (callback) {
        modal.dataset.callback = callback.toString();
    }

    // Focus input if prompt
    if (type === 'prompt') {
        setTimeout(() => {
            const input = document.getElementById('custom-prompt-input');
            if (input) {
                input.focus();
                if (defaultValue) input.value = defaultValue;
            }
        }, 100);
    }
}

function closeCustomModal(result = null) {
    const modal = document.getElementById('custom-modal');
    if (!modal) return;

    const callbackStr = modal.dataset.callback;
    modal.remove();

    if (callbackStr && result !== undefined) {
        try {
            const callback = eval('(' + callbackStr + ')');
            if (typeof callback === 'function') {
                callback(result);
            }
        } catch (e) {
            console.error('Callback error:', e);
        }
    }
}

function submitCustomPrompt() {
    const input = document.getElementById('custom-prompt-input');
    const value = input ? input.value : '';
    closeCustomModal(value);
}

// Override native functions
window.alert = function(message) {
    showCustomModal('MySubHub', message, 'alert');
};

window.confirm = function(message) {
    return new Promise((resolve) => {
        showCustomModal('MySubHub', message, 'confirm', (result) => {
            resolve(result);
        });
    });
};

window.prompt = function(message, defaultValue = '') {
    return new Promise((resolve) => {
        showCustomModal('MySubHub', message, 'prompt', (result) => {
            resolve(result);
        });
        setTimeout(() => {
            const input = document.getElementById('custom-prompt-input');
            if (input && defaultValue) {
                input.value = defaultValue;
            }
        }, 100);
    });
};

// Async versions for better control
async function showAlert(message) {
    return new Promise((resolve) => {
        showCustomModal('MySubHub', message, 'alert', () => resolve());
    });
}

async function showConfirm(message) {
    return new Promise((resolve) => {
        showCustomModal('MySubHub', message, 'confirm', (result) => resolve(result));
    });
}

async function showPrompt(message, defaultValue = '') {
    return new Promise((resolve) => {
        showCustomModal('MySubHub', message, 'prompt', (result) => resolve(result));
        setTimeout(() => {
            const input = document.getElementById('custom-prompt-input');
            if (input && defaultValue) {
                input.value = defaultValue;
            }
        }, 100);
    });
}

window.onerror = function(message) {
    showAlert('Error: ' + message);
};

// app.js (FIXED VERSION — all queries via backend API)
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

// Backend API URL
const API_BASE = 'https://mslxnegbtstpdwauugmq.supabase.co/functions/v1/mainbot';

let tonConnectUI = null;
let currentNetwork = 'testnet';

async function initTonConnect() {
    try {
        if (window.TON_CONNECT_UI) {
            tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
                manifestUrl: 'https://haman-hub.github.io/MySubHub-frontend/manifest.json',
                buttonRootId: 'ton-connect-button',
                network: 'testnet'
            });
            console.log('TON Connect initialized');
        }
    } catch (e) {
        console.error('TON Connect init error:', e);
    }
}

let currentUser = null;
let isAdmin = false;
let currentPage = 'subscriptions';

// API Helper
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
        return { success: true };
    }

    try {
        const res = await fetch(`${API_BASE}${url}`, { ...options, headers });

        if (res.status === 401 || res.status === 403) {
            if (url === '/api/auth/validate') return { user: null };
            return { error: 'Unauthorized' };
        }

        if (res.status === 429) {
            alert('Too many requests. Please wait a moment.');
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

// Page Navigation
function switchPage(pageId) {
    if (pageId === 'admin' && !isAdmin) pageId = 'subscriptions';

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

    // Update navigation button active states
    const navButtonMap = {
        'subscriptions': 'nav-subscriptions',
        'owner': 'nav-owner',
        'admin': 'nav-admin'
    };

    // Remove active state from all nav buttons
    Object.values(navButtonMap).forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.classList.remove('active', 'text-ton-400', 'text-emerald-400', 'text-amber-400');
            btn.classList.add('text-slate-400');
            const iconBox = btn.querySelector('.tab-icon-box');
            if (iconBox) {
                iconBox.className = 'tab-icon-box w-10 h-8 flex items-center justify-center rounded-xl bg-transparent text-slate-400 border border-transparent transition-all duration-200';
            }
            const indicator = btn.querySelector('.tab-indicator');
            if (indicator) {
                indicator.classList.remove('scale-x-100', 'opacity-100');
                indicator.classList.add('scale-x-0', 'opacity-0');
            }
        }
    });

    // Add active state to current nav button
    const activeBtnId = navButtonMap[pageId];
    if (activeBtnId) {
        const activeBtn = document.getElementById(activeBtnId);
        if (activeBtn) {
            activeBtn.classList.add('active');
            activeBtn.classList.remove('text-slate-400');
            
            // Set color based on page
            let colorClass = 'text-ton-400';
            let bgBox = 'bg-ton-500/20';
            let borderBox = 'border-ton-500/30';
            
            if (pageId === 'owner') {
                colorClass = 'text-emerald-400';
                bgBox = 'bg-emerald-500/20';
                borderBox = 'border-emerald-500/30';
            } else if (pageId === 'admin') {
                colorClass = 'text-amber-400';
                bgBox = 'bg-amber-500/20';
                borderBox = 'border-amber-500/30';
            }
            
            activeBtn.classList.add(colorClass);
            
            const iconBox = activeBtn.querySelector('.tab-icon-box');
            if (iconBox) {
                iconBox.className = `tab-icon-box w-10 h-8 flex items-center justify-center rounded-xl ${bgBox} ${colorClass} border ${borderBox} transition-all duration-200`;
            }
            
            const indicator = activeBtn.querySelector('.tab-indicator');
            if (indicator) {
                indicator.classList.remove('scale-x-0', 'opacity-0');
                indicator.classList.add('scale-x-100', 'opacity-100');
            }
        }
    }

    if (pageId === 'subscriptions') loadSubscriptions();
    else if (pageId === 'owner') loadOwnerDashboard();
    else if (pageId === 'admin') loadAdminDashboard();

    currentPage = pageId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.switchPage = switchPage;

// Init
async function init() {
    applyTranslations();
    await initTonConnect();

    try {
        const res = await apiFetch('/api/auth/validate', { method: 'POST' });
        currentUser = res?.user || null;
        isAdmin = res?.is_admin || false;

        const navBar = document.getElementById('nav-bar');
        if (navBar) navBar.classList.remove('hidden');

        const adminTab = document.getElementById('nav-admin');
        if (adminTab) {
            adminTab.style.setProperty('display', isAdmin ? 'flex' : 'none', 'important');
        }

        const ownerTab = document.getElementById('nav-owner');
        if (ownerTab) ownerTab.style.setProperty('display', 'flex', 'important');

        // Update network display
        const networkLabel = document.querySelector('[data-i18n="footer.ton_network"]');
        if (networkLabel) {
            networkLabel.textContent = currentNetwork === 'testnet' ? 'TON Testnet' : 'TON Mainnet';
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
        switchPage('subscriptions');
    }
}

// Purchase Page
async function loadPurchasePage(channelId) {
    const data = await apiFetch(`/api/channels/${channelId}`, { method: 'GET' });

    const card = document.getElementById('purchase-card');
    if (!data || data.error) {
        card.innerHTML = `<p class="text-red-400 text-center py-6">Channel not found</p>`;
        return;
    }

    const NETWORK_FEE_TON = 0.05;
    const platformFee = data.subscription_price * 0.01;
    const total = data.subscription_price + platformFee + NETWORK_FEE_TON;

    card.innerHTML = `
        <div class="text-center mb-6">
            <h2 class="text-2xl font-bold text-white tracking-tight">${data.channel_name}</h2>
            <p class="text-slate-400 mt-2 text-sm">
                Subscription: <strong class="text-white font-mono text-base">${total.toFixed(6)} TON</strong> / ${data.duration_days} days
            </p>
        </div>
        <button id="btn-pay" class="btn-primary w-full text-white font-semibold py-3.5 rounded-xl">
            Pay with TON
        </button>
    `;
    
    document.getElementById('btn-pay').onclick = () => initiatePayment(data.id, data.subscription_price);
    if (window.lucide) lucide.createIcons();
}

// Payment
async function initiatePayment(channelId, price) {
    try {
        const initRes = await apiFetch('/api/subscriptions/initiate', {
            method: 'POST',
            body: JSON.stringify({ channel_id: channelId }),
        });

        if (initRes.error) throw new Error(initRes.error);

        if (!tonConnectUI) throw new Error('TON Connect not initialized');

        let wallet = tonConnectUI.wallet;
        if (!wallet) {
            await tonConnectUI.connectWallet();
            wallet = tonConnectUI.wallet;
            if (!wallet) throw new Error('Wallet connection cancelled');
        }

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
            body: JSON.stringify({ 
                channel_id: channelId,
                boc: boc 
            }),
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
        alert('Payment error: ' + e.message);
    }
}

// Subscriptions
async function loadSubscriptions() {
    try {
        const subs = await apiFetch('/api/subscriptions/my');
        const list = document.getElementById('subscriptions-list');

        if (!subs || !subs.length) {
            list.innerHTML = `<div class="glass-card p-10 text-center text-slate-400">No subscriptions yet.</div>`;
            return;
        }

        list.innerHTML = subs.map(s => {
            const channel = s.channel || {};
            const daysLeft = Math.ceil((new Date(s.end_date) - Date.now()) / (1000 * 60 * 60 * 24));
            const isExpired = daysLeft < 0;
            const isExpiring = daysLeft >= 0 && daysLeft <= 7;

            return `
                <div class="glass-card p-4">
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-semibold text-white">${channel.channel_name || 'Unknown'}</h3>
                        <span class="badge ${isExpired ? 'bg-red-500/10 text-red-400 border border-red-500/30' : isExpiring ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'}">
                            ${isExpired ? 'Expired' : isExpiring ? `⚠️ ${daysLeft}d` : 'Active'}
                        </span>
                    </div>
                    <p class="text-slate-400 text-sm mb-3">Expires: ${new Date(s.end_date).toLocaleDateString()}</p>
                    <div class="flex gap-2">
                        <button onclick="openRating('${s.channel_id}')" class="btn-secondary px-3 py-1.5 rounded-xl text-xs text-slate-300">⭐ Rate</button>
                        <button onclick="openReport('${s.channel_id}')" class="btn-secondary px-3 py-1.5 rounded-xl text-xs text-slate-300">🚩 Report</button>
                        ${isExpired ? `<button onclick="renewSubscription('${s.channel_id}')" class="btn-primary px-3 py-1.5 rounded-xl text-xs text-white">🔄 Renew</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error('Error loading subscriptions:', e);
    }
}

// Renew subscription
async function renewSubscription(channelId) {
    loadPurchasePage(channelId);
    switchPage('purchase');
}
window.renewSubscription = renewSubscription;

// Owner Dashboard
async function loadOwnerDashboard() {
    try {
        const channels = await apiFetch('/api/channels/my');
        const container = document.getElementById('channels-list');

        if (!channels || !channels.length) {
            container.innerHTML = '<div class="text-center text-slate-400 py-6">No channels yet.</div>';
            return;
        }

        container.innerHTML = channels.map(ch => `
            <div class="glass-card p-4">
                <div class="flex justify-between items-start">
                    <div>
                        <h3 class="font-semibold text-white">${ch.channel_name}</h3>
                        <p class="text-slate-400 text-sm">${ch.subscription_price} TON / ${ch.duration_days} days</p>
                    </div>
                    <label class="flex items-center gap-2 text-xs">
                        Active: <input type="checkbox" ${ch.is_active ? 'checked' : ''} onchange="toggleChannel('${ch.id}', this.checked)" class="accent-blue-500">
                    </label>
                </div>
                <div class="flex gap-4 mt-3">
                    <button onclick="openEditModal('${ch.id}')" class="text-blue-400 text-xs">Edit</button>
                    <button onclick="copyDeepLink('${ch.id}')" class="text-blue-400 text-xs">Copy Link</button>
                    <button onclick="forwardChannel('${ch.id}')" class="text-green-400 text-xs">📤 Forward</button>
                </div>
            </div>
        `).join('');

        loadWithdrawalSection();
    } catch (e) {
        console.error('Error loading owner dashboard:', e);
    }
}

// Channel Edit
let editingChannelId = null;

async function openEditModal(channelId) {
    editingChannelId = channelId;
    const data = await apiFetch(`/api/channels/${channelId}`, { method: 'GET' });
    if (data && !data.error) {
        const priceInput = document.getElementById('edit-price');
        const durationInput = document.getElementById('edit-duration');
        if (priceInput) priceInput.value = data.subscription_price;
        if (durationInput) durationInput.value = data.duration_days;
    }
    const editModal = document.getElementById('edit-modal');
    if (editModal) editModal.classList.remove('hidden');
}

window.openEditModal = openEditModal;

const modalCancelBtn = document.getElementById('modal-cancel');
if (modalCancelBtn) {
    modalCancelBtn.onclick = () => {
        document.getElementById('edit-modal').classList.add('hidden');
        editingChannelId = null;
    };
}

const modalSaveBtn = document.getElementById('modal-save');
if (modalSaveBtn) {
    modalSaveBtn.onclick = async () => {
        const price = parseFloat(document.getElementById('edit-price').value);
        const duration = parseInt(document.getElementById('edit-duration').value);
        if (editingChannelId) {
            await apiFetch(`/api/channels/${editingChannelId}`, {
                method: 'PUT',
                body: JSON.stringify({ subscription_price: price, duration_days: duration }),
            });
        }
        document.getElementById('edit-modal').classList.add('hidden');
        loadOwnerDashboard();
    };
}

// Add Channel
function openAddChannelModal() {
    // Reset form (with null checks for backward compatibility)
    const nameInput = document.getElementById('add-channel-name');
    const linkInput = document.getElementById('add-channel-link');
    const priceInput = document.getElementById('add-channel-price');
    const durationInput = document.getElementById('add-channel-duration');
    const activeInput = document.getElementById('add-channel-active');
    
    if (nameInput) nameInput.value = '';
    if (linkInput) linkInput.value = '';
    if (priceInput) priceInput.value = '0.1';
    if (durationInput) durationInput.value = '30';
    if (activeInput) activeInput.checked = false;
    
    document.getElementById('add-channel-modal').classList.remove('hidden');
}
function closeAddChannelModal() {
    document.getElementById('add-channel-modal').classList.add('hidden');
}
async function submitAddChannel() {
    const nameInput = document.getElementById('add-channel-name');
    const linkInput = document.getElementById('add-channel-link');
    const priceInput = document.getElementById('add-channel-price');
    const durationInput = document.getElementById('add-channel-duration');
    const activeInput = document.getElementById('add-channel-active');
    
    const channel_name = nameInput ? nameInput.value.trim() : '';
    const channel_invite_link = linkInput ? linkInput.value.trim() : '';
    const subscription_price = priceInput ? parseFloat(priceInput.value) : 0.1;
    const duration_days = durationInput ? parseInt(durationInput.value) : 30;
    const is_active = activeInput ? activeInput.checked : false;
    
    if (!channel_name || !channel_invite_link) {
        alert('Please fill in channel name and invite link');
        return;
    }
    
    if (subscription_price <= 0) {
        alert('Subscription price must be greater than 0');
        return;
    }
    
    if (duration_days <= 0) {
        alert('Duration must be greater than 0');
        return;
    }
    
    const res = await apiFetch('/api/channels/register', {
        method: 'POST',
        body: JSON.stringify({ 
            channel_name, 
            channel_invite_link,
            subscription_price,
            duration_days,
            is_active
        }),
    });
    if (res.error) return alert(res.error);
    closeAddChannelModal();
    loadOwnerDashboard();
    alert('Channel added successfully!');
}

window.openAddChannelModal = openAddChannelModal;
window.closeAddChannelModal = closeAddChannelModal;
window.submitAddChannel = submitAddChannel;

function copyDeepLink(channelId) {
    const link = `https://t.me/MySubsHub_bot?start=${channelId}`;
    navigator.clipboard.writeText(link).then(() => alert('Link copied!'));
}
window.copyDeepLink = copyDeepLink;

// Forward Channel - Enhanced with rating and preview
async function forwardChannel(channelId) {
    try {
        // Fetch channel details with rating
        const channel = await apiFetch(`/api/channels/${channelId}`, { method: 'GET' });
        
        if (!channel || channel.error) {
            alert('Channel not found');
            return;
        }
        
        const deepLink = `https://t.me/MySubsHub_bot?start=${channelId}`;
        const rating = channel.avg_rating || 0;
        const reviewCount = channel.total_reviews || 0;
        
        // Generate stars display
        const stars = '⭐'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
        
        // Create engaging message template
        let messageTemplate = `🚀 🌟 ${channel.channel_name} 🌟 🚀\n\n`;
        messageTemplate += `💎 Premium Content You Don't Want to Miss!\n\n`;
        messageTemplate += `${stars} ${rating.toFixed(1)}/5 (${reviewCount} reviews)\n\n`;
        messageTemplate += `💰 Subscription: ${channel.subscription_price} TON\n`;
        messageTemplate += `📅 Duration: ${channel.duration_days} days\n\n`;
        messageTemplate += `✨ What you'll get:\n`;
        messageTemplate += `• Exclusive content\n`;
        messageTemplate += `• Premium access\n`;
        messageTemplate += `• Community benefits\n\n`;
        messageTemplate += `🔗 Subscribe Now:\n${deepLink}\n\n`;
        messageTemplate += `#Premium #TON #Subscription`;
        
        // Show modal with preview
        showForwardModal(channel, messageTemplate, deepLink);
        
    } catch (e) {
        console.error('Error forwarding channel:', e);
        alert('Error loading channel details');
    }
}
window.forwardChannel = forwardChannel;

function showForwardModal(channel, messageTemplate, deepLink) {
    const modal = document.getElementById('forward-modal');
    if (!modal) {
        console.error('Forward modal not found');
        return;
    }
    
    // Update preview
    updateForwardPreview(messageTemplate, channel);
    
    // Set initial message
    const messageInput = document.getElementById('forward-message');
    if (messageInput) messageInput.value = messageTemplate;
    
    // Add input listener for live preview
    document.getElementById('forward-message').oninput = (e) => {
        updateForwardPreview(e.target.value, channel);
    };
    
    modal.classList.remove('hidden');
}

function updateForwardPreview(message, channel) {
    const preview = document.getElementById('forward-preview');
    if (!preview) return;
    
    // Convert markdown-like formatting to HTML
    let html = message
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" class="text-blue-400 underline" target="_blank">$1</a>');
    
    preview.innerHTML = `
        <div class="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div class="flex items-center gap-2 mb-3">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    ${channel.channel_name.charAt(0).toUpperCase()}
                </div>
                <div>
                    <div class="font-semibold text-white">${channel.channel_name}</div>
                    <div class="text-xs text-slate-400">via MySubHub</div>
                </div>
            </div>
            <div class="text-sm text-slate-300 leading-relaxed">${html}</div>
        </div>
    `;
}

async function copyForwardMessage() {
    const message = document.getElementById('forward-message').value;
    try {
        await navigator.clipboard.writeText(message);
        alert('Message copied to clipboard!');
    } catch (e) {
        alert('Failed to copy message');
    }
}
window.copyForwardMessage = copyForwardMessage;

async function shareForwardMessage() {
    const message = document.getElementById('forward-message').value;
    const channelName = document.getElementById('forward-preview').querySelector('.font-semibold').textContent;
    
    // Try to use Telegram share API
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(message.split('\n').pop())}&text=${encodeURIComponent(message)}`;
    
    try {
        window.open(shareUrl, '_blank');
        closeForwardModal();
    } catch (e) {
        // Fallback to copy
        await copyForwardMessage();
    }
}
window.shareForwardMessage = shareForwardMessage;

function closeForwardModal() {
    const modal = document.getElementById('forward-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}
window.closeForwardModal = closeForwardModal;

async function toggleChannel(channelId, isActive) {
    await apiFetch(`/api/channels/${channelId}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: isActive }),
    });
}
window.toggleChannel = toggleChannel;

// Withdrawals
async function loadWithdrawalSection() {
    const data = await apiFetch('/api/withdrawals/my');
    const section = document.getElementById('withdrawal-section');
    section.innerHTML = `
        <h3 class="text-lg font-semibold text-white mb-2">Earnings</h3>
        <p class="text-slate-400">Pending: <strong class="text-white">${(data.pendingEarnings || 0).toFixed(6)} TON</strong></p>
        <button onclick="requestWithdrawal()" class="btn-primary mt-3 text-white px-4 py-2 rounded-xl text-sm">Request Withdrawal</button>
    `;
}

async function requestWithdrawal() {
    const amount = await showPrompt('Enter amount in TON:');
    if (!amount) return;
    const res = await apiFetch('/api/withdrawals/request', { 
        method: 'POST', 
        body: JSON.stringify({ amount: parseFloat(amount) }) 
    });
    if (res.success) {
        alert('Withdrawal requested');
        loadOwnerDashboard();
    } else {
        alert('Error: ' + (res.error || ''));
    }
}
window.requestWithdrawal = requestWithdrawal;

// Admin Dashboard - FIXED VERSION WITH FULL REPORT DETAILS
async function loadAdminDashboard() {
    try {
        const reports = await apiFetch('/api/admin/reports');
        const withdrawals = await apiFetch('/api/admin/withdrawals');
        
        const reportsContainer = document.getElementById('admin-reports');
        const withdrawalsContainer = document.getElementById('admin-withdrawals');
        
        // Display reports with full details
        if (!Array.isArray(reports) || reports.length === 0) {
            reportsContainer.innerHTML = '<p class="text-slate-400 text-center py-6">No reports.</p>';
        } else {
            reportsContainer.innerHTML = reports.map(r => {
                const reporter = r.reporter || {};
                const channel = r.channel || {};
                const channelOwner = r.channel_owner || {};
                
                return `
                    <div class="glass-card p-4 border-l-4 ${r.status === 'pending' ? 'border-amber-500' : r.status === 'banned' ? 'border-red-500' : 'border-green-500'}">
                        <!-- Status Badge -->
                        <div class="flex justify-between items-start mb-3">
                            <span class="text-xs font-bold uppercase px-2 py-1 rounded ${
                                r.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                                r.status === 'banned' ? 'bg-red-500/20 text-red-400' :
                                'bg-green-500/20 text-green-400'
                            }">
                                ${r.status || 'pending'}
                            </span>
                            <span class="text-xs text-slate-500">${new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        
                        <!-- Report Details -->
                        <div class="space-y-3">
                            <!-- Reporter Info -->
                            <div class="bg-slate-800/50 rounded-lg p-3">
                                <p class="text-xs text-slate-400 mb-1">📢 Reported by:</p>
                                <p class="text-sm font-semibold text-white">
                                    ${reporter.first_name || 'Unknown'} 
                                    ${reporter.username ? `(@${reporter.username})` : ''}
                                </p>
                                <p class="text-xs text-slate-500">ID: ${reporter.telegram_id || 'N/A'}</p>
                            </div>
                            
                            <!-- Channel Info -->
                            <div class="bg-slate-800/50 rounded-lg p-3">
                                <p class="text-xs text-slate-400 mb-1">📺 Channel:</p>
                                <p class="text-sm font-semibold text-white">${channel.channel_name || 'Unknown Channel'}</p>
                                <p class="text-xs text-slate-500">ID: ${r.reported_channel_id || 'N/A'}</p>
                            </div>
                            
                            <!-- Channel Owner Info -->
                            <div class="bg-slate-800/50 rounded-lg p-3">
                                <p class="text-xs text-slate-400 mb-1">👤 Channel Owner:</p>
                                <p class="text-sm font-semibold text-white">
                                    ${channelOwner.first_name || 'Unknown'} 
                                    ${channelOwner.username ? `(@${channelOwner.username})` : ''}
                                </p>
                                <p class="text-xs text-slate-500">ID: ${channelOwner.telegram_id || 'N/A'}</p>
                            </div>
                            
                            <!-- Reason & Description -->
                            <div class="bg-slate-800/50 rounded-lg p-3">
                                <p class="text-xs text-slate-400 mb-1">⚠️ Reason:</p>
                                <p class="text-sm font-semibold text-red-400 uppercase">${r.reason || 'No reason'}</p>
                                ${r.description ? `<p class="text-sm text-slate-300 mt-2">${r.description}</p>` : ''}
                            </div>
                        </div>
                        
                        <!-- Action Buttons -->
                        ${r.status === 'pending' ? `
                            <div class="flex gap-2 mt-4 pt-3 border-t border-slate-700">
                                <button onclick="reviewReport('${r.id}', 'ban')" class="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 px-3 py-2 rounded-xl text-sm font-semibold transition">
                                    🚫 Ban Channel
                                </button>
                                <button onclick="reviewReport('${r.id}', 'dismiss')" class="flex-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30 px-3 py-2 rounded-xl text-sm font-semibold transition">
                                    ✅ Dismiss
                                </button>
                            </div>
                        ` : `
                            <div class="mt-4 pt-3 border-t border-slate-700">
                                <p class="text-xs text-slate-500 text-center">
                                    ${r.status === 'banned' ? '🚫 Channel has been banned' : '✅ Report has been dismissed'}
                                    ${r.reviewed_at ? ` on ${new Date(r.reviewed_at).toLocaleDateString()}` : ''}
                                </p>
                            </div>
                        `}
                    </div>
                `;
            }).join('');
        }
        
        // Display withdrawals
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
    } catch (e) {
        console.error('Error loading admin dashboard:', e);
    }
}

async function reviewReport(reportId, action) {
    const confirmMsg = action === 'ban' 
        ? 'Are you sure you want to BAN this channel? This will deactivate it immediately.'
        : 'Are you sure you want to DISMISS this report?';
    
    const confirmed = await showConfirm(confirmMsg);
    if (!confirmed) return;
    
    try {
        const res = await apiFetch(`/api/admin/reports/${reportId}/review`, { 
            method: 'POST', 
            body: JSON.stringify({ action }) 
        });
        
        if (res.success) {
            alert(`Report ${action === 'ban' ? 'banned' : 'dismissed'} successfully!`);
            loadAdminDashboard(); // Reload to show updated status
        } else {
            alert('Error: ' + (res.error || 'Unknown error'));
        }
    } catch (e) {
        console.error('Error reviewing report:', e);
        alert('Error: ' + e.message);
    }
}
window.reviewReport = reviewReport;

async function approveWithdrawal(id) {
    const res = await apiFetch(`/api/admin/withdrawals/${id}/approve`, { method: 'POST' });
    if (res.success) {
        alert('Approved!');
        loadAdminDashboard();
    } else {
        alert('Error: ' + (res.error || ''));
    }
}
window.approveWithdrawal = approveWithdrawal;

// Language
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

window.openLanguageModal = openLanguageModal;
window.closeLanguageModal = closeLanguageModal;
window.selectLanguage = selectLanguage;

// Rating and Report functions
let ratingChannelId = null;
let reportChannelId = null;
let selectedRating = 0;

async function openRating(channelId) {
    ratingChannelId = channelId;
    selectedRating = 0;
    
    // Check if user already rated this channel
    try {
        const checkRes = await apiFetch(`/api/reviews/check/${channelId}`, { method: 'GET' });
        
        if (checkRes && checkRes.alreadyRated) {
            alert('You have already rated this channel. You can only rate each channel once.');
            return;
        }
    } catch (e) {
        console.error('Error checking rating status:', e);
    }
    
    const modal = document.getElementById('rating-modal');
    if (!modal) {
        alert('Rating modal not found');
        return;
    }
    
    const starsContainer = document.getElementById('star-rating');
    if (starsContainer) {
        starsContainer.innerHTML = '';
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('span');
            star.textContent = '☆';
            star.className = 'cursor-pointer text-3xl text-yellow-500';
            star.onclick = () => selectRating(i);
            starsContainer.appendChild(star);
        }
    }
    
    modal.classList.remove('hidden');
}
window.openRating = openRating;

function selectRating(rating) {
    selectedRating = rating;
    const stars = document.querySelectorAll('#star-rating span');
    stars.forEach((star, index) => {
        star.textContent = index < rating ? '★' : '☆';
    });
}
window.selectRating = selectRating;

async function submitRating() {
    if (selectedRating === 0) {
        alert('Please select a rating');
        return;
    }
    
    const comment = document.getElementById('rating-comment')?.value || '';
    
    try {
        const res = await apiFetch('/api/reviews', {
            method: 'POST',
            body: JSON.stringify({
                channel_id: ratingChannelId,
                rating: selectedRating,
                comment: comment
            })
        });
        
        if (res.success) {
            alert('Rating submitted successfully!');
            closeRating();
        } else {
            alert('Error: ' + (res.error || 'Unknown error'));
        }
    } catch (e) {
        console.error('Error submitting rating:', e);
        alert('Error: ' + e.message);
    }
}
window.submitRating = submitRating;

function closeRating() {
    const modal = document.getElementById('rating-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    ratingChannelId = null;
    selectedRating = 0;
}
window.closeRating = closeRating;

async function openReport(channelId) {
    reportChannelId = channelId;
    
    // Check if user already reported this channel
    try {
        const checkRes = await apiFetch(`/api/reports/check/${channelId}`, { method: 'GET' });
        
        if (checkRes && checkRes.alreadyReported) {
            alert('You have already reported this channel. You can only report each channel once.');
            return;
        }
    } catch (e) {
        console.error('Error checking report status:', e);
    }
    
    const modal = document.getElementById('report-modal');
    if (!modal) {
        alert('Report modal not found');
        return;
    }
    
    // Reset form
    const reasonSelect = document.getElementById('report-reason');
    if (reasonSelect) reasonSelect.value = 'scam';
    
    const descriptionInput = document.getElementById('report-description');
    if (descriptionInput) descriptionInput.value = '';
    
    modal.classList.remove('hidden');
}
window.openReport = openReport;

async function submitReport() {
    const reason = document.getElementById('report-reason')?.value || 'scam';
    const description = document.getElementById('report-description')?.value || '';
    
    if (!description.trim()) {
        alert('Please provide a description');
        return;
    }
    
    try {
        const res = await apiFetch('/api/reports', {
            method: 'POST',
            body: JSON.stringify({
                channel_id: reportChannelId,
                reason: reason,
                description: description
            })
        });
        
        if (res.success) {
            alert('Report submitted successfully!');
            closeReport();
        } else {
            alert('Error: ' + (res.error || 'Unknown error'));
        }
    } catch (e) {
        console.error('Error submitting report:', e);
        alert('Error: ' + e.message);
    }
}
window.submitReport = submitReport;

function closeReport() {
    const modal = document.getElementById('report-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
    reportChannelId = null;
}
window.closeReport = closeReport;

window.onload = init;
