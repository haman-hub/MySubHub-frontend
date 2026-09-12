// ================== TRANSLATIONS ==================
const translations = {
    en: {
        'nav.subscriptions': 'My Subscriptions',
        'nav.owner': 'My Channels',
        'nav.admin': 'Admin',
        'subscriptions.status.active': 'Active',
        'subscriptions.expires': 'Expiring',
        'owner.your_channels': 'Your Channels',
        'owner.add_channel': 'Add Channel',
        'owner.edit': 'Edit Channel',
        'owner.wallet': 'Your Wallet',
        'owner.wallet_not_set': 'No wallet connected',
        'owner.connect_wallet': 'Connect Wallet',
        'owner.withdrawal_earnings': 'Earnings',
        'owner.withdrawal_pending': 'Pending:',
        'owner.withdrawal_request': 'Request Withdrawal',
        'owner.withdrawal_amount_prompt': 'Enter amount in TON:',
        'owner.withdrawal_request_success': 'Withdrawal requested successfully!',
        'owner.withdrawal_request_error': 'Error requesting withdrawal',
        'rating.title': 'Rate this Channel',
        'rating.select_error': 'Please select a rating',
        'rating.submitted': 'Rating submitted successfully!',
        'report.title': 'Report Channel',
        'report.submitted': 'Report submitted successfully!',
        'admin.reports': 'Reported Channels',
        'admin.withdrawals': 'Pending Withdrawals',
        'admin.ban': 'Ban Channel',
        'admin.dismiss': 'Dismiss Report',
        'admin.approve_pay': 'Approve Payment',
        'purchase.not_found': 'Channel not found',
        'purchase.subscription': 'Subscription:',
        'purchase.per': 'per',
        'purchase.days': 'days',
        'purchase.pay_button': 'Pay with TON',
        'subscriptions.no_subs': 'No subscriptions yet. Subscribe to a channel to get started!',
        'error.generic': 'An error occurred. Please try again.'
    },
    fa: {
        'nav.subscriptions': 'اشتراک‌های من',
        'nav.owner': 'کانال‌های من',
        'nav.admin': 'مدیر',
        'subscriptions.status.active': 'فعال',
        'subscriptions.expires': 'در حال انقضا',
        'owner.your_channels': 'کانال‌های شما',
        'owner.add_channel': 'افزودن کانال',
        'owner.edit': 'ویرایش کانال',
        'owner.wallet': 'کیف پول شما',
        'owner.wallet_not_set': 'کیف پول متصل نشده',
        'owner.connect_wallet': 'اتصال کیف پول',
        'owner.withdrawal_earnings': 'درآمد',
        'owner.withdrawal_pending': 'در انتظار:',
        'owner.withdrawal_request': 'درخواست برداشت',
        'owner.withdrawal_amount_prompt': 'مقدار را به TON وارد کنید:',
        'owner.withdrawal_request_success': 'درخواست برداشت با موفقیت ثبت شد!',
        'owner.withdrawal_request_error': 'خطا در درخواست برداشت',
        'rating.title': 'امتیاز به این کانال',
        'rating.select_error': 'لطفاً یک امتیاز انتخاب کنید',
        'rating.submitted': 'امتیاز با موفقیت ثبت شد!',
        'report.title': 'گزارش کانال',
        'report.submitted': 'گزارش با موفقیت ثبت شد!',
        'admin.reports': 'کانال‌های گزارش شده',
        'admin.withdrawals': 'برداشت‌های در انتظار',
        'admin.ban': 'مسدود کردن کانال',
        'admin.dismiss': 'رد گزارش',
        'admin.approve_pay': 'تأیید پرداخت',
        'purchase.not_found': 'کانال یافت نشد',
        'purchase.subscription': 'اشتراک:',
        'purchase.per': 'به ازای',
        'purchase.days': 'روز',
        'purchase.pay_button': 'پرداخت با TON',
        'subscriptions.no_subs': 'هنوز اشتراکی ندارید. برای شروع در یک کانال عضو شوید!',
        'error.generic': 'خطایی رخ داد. لطفاً دوباره تلاش کنید.'
    },
    hi: {
        'nav.subscriptions': 'मेरी सदस्यताएं',
        'nav.owner': 'मेरे चैनल',
        'nav.admin': 'व्यवस्थापक',
        'subscriptions.status.active': 'सक्रिय',
        'subscriptions.expires': 'समाप्ति',
        'owner.your_channels': 'आपके चैनल',
        'owner.add_channel': 'चैनल जोड़ें',
        'purchase.pay_button': 'TON से भुगतान करें',
        'subscriptions.no_subs': 'अभी कोई सदस्यता नहीं।',
        'error.generic': 'एक त्रुटि हुई। कृपया पुनः प्रयास करें।'
    },
    ru: {
        'nav.subscriptions': 'Мои подписки',
        'nav.owner': 'Мои каналы',
        'nav.admin': 'Админ',
        'subscriptions.status.active': 'Активные',
        'subscriptions.expires': 'Истекающие',
        'owner.your_channels': 'Ваши каналы',
        'owner.add_channel': 'Добавить канал',
        'purchase.pay_button': 'Оплатить TON',
        'subscriptions.no_subs': 'Пока нет подписок.',
        'error.generic': 'Произошла ошибка. Попробуйте снова.'
    },
    ar: {
        'nav.subscriptions': 'اشتراكاتي',
        'nav.owner': 'قنواتي',
        'nav.admin': 'المشرف',
        'subscriptions.status.active': 'نشط',
        'subscriptions.expires': 'ينتهي قريباً',
        'owner.your_channels': 'قنواتك',
        'owner.add_channel': 'إضافة قناة',
        'purchase.pay_button': 'ادفع بـ TON',
        'subscriptions.no_subs': 'لا توجد اشتراكات بعد.',
        'error.generic': 'حدث خطأ. يرجى المحاولة مرة أخرى.'
    },
    zh: {
        'nav.subscriptions': '我的订阅',
        'nav.owner': '我的频道',
        'nav.admin': '管理员',
        'subscriptions.status.active': '活跃',
        'subscriptions.expires': '即将到期',
        'owner.your_channels': '您的频道',
        'owner.add_channel': '添加频道',
        'purchase.pay_button': '使用 TON 支付',
        'subscriptions.no_subs': '暂无订阅。',
        'error.generic': '发生错误，请重试。'
    },
    id: {
        'nav.subscriptions': 'Langganan Saya',
        'nav.owner': 'Channel Saya',
        'nav.admin': 'Admin',
        'subscriptions.status.active': 'Aktif',
        'subscriptions.expires': 'Kedaluwarsa',
        'owner.your_channels': 'Channel Anda',
        'owner.add_channel': 'Tambah Channel',
        'purchase.pay_button': 'Bayar dengan TON',
        'subscriptions.no_subs': 'Belum ada langganan.',
        'error.generic': 'Terjadi kesalahan. Silakan coba lagi.'
    },
    'pt-BR': {
        'nav.subscriptions': 'Minhas Assinaturas',
        'nav.owner': 'Meus Canais',
        'nav.admin': 'Admin',
        'subscriptions.status.active': 'Ativas',
        'subscriptions.expires': 'Expirando',
        'owner.your_channels': 'Seus Canais',
        'owner.add_channel': 'Adicionar Canal',
        'purchase.pay_button': 'Pagar com TON',
        'subscriptions.no_subs': 'Nenhuma assinatura ainda.',
        'error.generic': 'Ocorreu um erro. Tente novamente.'
    },
    tr: {
        'nav.subscriptions': 'Aboneliklerim',
        'nav.owner': 'Kanallarım',
        'nav.admin': 'Yönetici',
        'subscriptions.status.active': 'Aktif',
        'subscriptions.expires': 'Süresi Doluyor',
        'owner.your_channels': 'Kanallarınız',
        'owner.add_channel': 'Kanal Ekle',
        'purchase.pay_button': 'TON ile Öde',
        'subscriptions.no_subs': 'Henüz abonelik yok.',
        'error.generic': 'Bir hata oluştu. Lütfen tekrar deneyin.'
    }
};

let currentLanguage = 'en';

function setLanguage(lang) {
    currentLanguage = lang;
    applyTranslations();
    
    // Save preference
    if (typeof apiFetch !== 'undefined' && typeof currentUser !== 'undefined' && currentUser) {
        apiFetch('/api/user/preferences', {
            method: 'POST',
            body: JSON.stringify({ language: lang })
        }).catch(() => {});
    }
}

function applyTranslations() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = translations[currentLanguage]?.[key] || translations['en']?.[key] || key;
        el.textContent = translation;
    });
}

function t(key) {
    return translations[currentLanguage]?.[key] || translations['en']?.[key] || key;
}

// Auto-detect language from Telegram WebApp
if (window.Telegram && window.Telegram.WebApp) {
    const tgLang = window.Telegram.WebApp.initDataUnsafe?.user?.language_code;
    if (tgLang && translations[tgLang]) {
        currentLanguage = tgLang;
    }
}

// Make functions globally available
window.setLanguage = setLanguage;
window.applyTranslations = applyTranslations;
window.t = t;
