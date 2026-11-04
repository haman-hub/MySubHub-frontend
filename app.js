// MySubHub Frontend v3.5.1 - Low-resource marketplace UX and API optimization
// Phase 1: Channel Discovery and resource optimization
// Phase 2: Notification System
// Phase 3: Security Hardening
// Phase 4: Visual Hierarchy
// Phase 5: Multi-language Support

// ================== SECURITY (Phase 3) ==================
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

// TON uses nanoton precision (1e-9). Never display a valid small price as 0.000 TON.
function formatTon(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 9,
    useGrouping: true
  }).format(amount);
}

// Input sanitization
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.replace(/[<>\"'&]/g, (match) => {
    const escapeMap = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;' };
    return escapeMap[match];
  });
}

// ================== CONFIG ==================
const API_BASE = window.MYSUBHUB_API || 'https://mslxnegbtstpdwauugmq.supabase.co/functions/v1/mainbot';
const BOT_USERNAME = window.MYSUBHUB_BOT || 'MySubsHub_bot';

// ================== MULTI-LANGUAGE (Phase 5) ==================
const mySubHubTranslationsV331 = {
  en: {
    nav: { subscriptions: 'My Subs', channels: 'My Channels', referrals: 'Referrals', admin: 'Admin', discover: 'Discover' },
    common: { loading: 'Loading...', retry: 'Retry', cancel: 'Cancel', save: 'Save', delete: 'Delete', edit: 'Edit', close: 'Close' },
    discover: { title: 'Discover Channels', search: 'Search channels...', categories: 'Categories', sort: 'Sort by', popular: 'Popular', recent: 'Recent', rating: 'Rating', price_low: 'Price: Low to High', price_high: 'Price: High to Low', no_results: 'No channels found', subscribe: 'Subscribe' },
    notifications: { title: 'Notifications', mark_all_read: 'Mark all as read', no_notifications: 'No notifications yet', subscription_expired: 'Subscription Expired', subscription_success: 'Subscription Activated', referral_credit: 'Referral Credit Earned', withdrawal_approved: 'Withdrawal Approved' },
    subscriptions: { title: 'My Subscriptions', active: 'Active', expired: 'Expired', expiring: 'Expiring', renew: 'Renew', rate: 'Rate', report: 'Report', open: 'Open', no_subs: 'No subscriptions yet' },
    channels: { title: 'My Channels', add: 'Add Channel', edit: 'Edit', copy: 'Copy', forward: 'Forward', delete: 'Delete', active: 'Active', inactive: 'Inactive', no_channels: 'No channels yet', add_first: 'Add Your First Channel', bot_admin_required: 'Bot Admin Access Required', bot_admin_instructions: 'Add @MySubsHub_bot as administrator to your channel first' },
    referrals: { title: 'Referral Program', balance: 'Balance', referrals: 'Referrals', earned: 'Earned', your_link: 'Your Referral Link', copy_link: 'Copy Link', earn_10_percent: 'Earn 10% credits when friends subscribe via your link', credits_note: 'Credits can be used for subscriptions but cannot be withdrawn' },
    admin: { title: 'Admin Panel', channels: 'All Channels', reports: 'Reported Channels', withdrawals: 'Pending Withdrawals', approve: 'Approve', ban: 'Ban', dismiss: 'Dismiss' },
    purchase: { channel_price: 'Channel Price', platform_fee: 'Platform Fee (1%)', total_to_pay: 'Total to Pay', duration: 'Duration', days: 'days', pay_with_ton: 'Pay with TON', processing: 'Processing...', use_credits: 'Use credits to reduce payment', you_have: 'You have', in_credits: 'in credits' },
    errors: { network_error: 'Network error', unauthorized: 'Unauthorized', invalid_price: 'Invalid price', invalid_duration: 'Invalid duration', channel_not_found: 'Channel not found', already_subscribed: 'Already subscribed' }
  },
  fa: {
    nav: { subscriptions: 'اشتراک‌های من', channels: 'کانال‌های من', referrals: 'معرفی‌ها', admin: 'مدیر', discover: 'کشف' },
    common: { loading: 'در حال بارگذاری...', retry: 'تلاش مجدد', cancel: 'لغو', save: 'ذخیره', delete: 'حذف', edit: 'ویرایش', close: 'بستن' },
    discover: { title: 'کشف کانال‌ها', search: 'جستجوی کانال‌ها...', categories: 'دسته‌بندی‌ها', sort: 'مرتب‌سازی', popular: 'محبوب', recent: 'اخیر', rating: 'امتیاز', price_low: 'قیمت: کم به زیاد', price_high: 'قیمت: زیاد به کم', no_results: 'کانالی یافت نشد', subscribe: 'اشتراک' },
    notifications: { title: 'اعلان‌ها', mark_all_read: 'علامت‌گذاری همه به عنوان خوانده شده', no_notifications: 'هنوز اعلانی وجود ندارد', subscription_expired: 'اشتراک منقضی شد', subscription_success: 'اشتراک فعال شد', referral_credit: 'اعتبار معرفی کسب شد', withdrawal_approved: 'برداشت تایید شد' },
    subscriptions: { title: 'اشتراک‌های من', active: 'فعال', expired: 'منقضی', expiring: 'در حال انقضا', renew: 'تمدید', rate: 'امتیاز', report: 'گزارش', open: 'باز کردن', no_subs: 'هنوز اشتراکی وجود ندارد' },
    channels: { title: 'کانال‌های من', add: 'افزودن کانال', edit: 'ویرایش', copy: 'کپی', forward: 'ارسال', delete: 'حذف', active: 'فعال', inactive: 'غیرفعال', no_channels: 'هنوز کانالی وجود ندارد', add_first: 'اولین کانال خود را اضافه کنید', bot_admin_required: 'دسترسی مدیر ربات مورد نیاز است', bot_admin_instructions: 'ابتدا @MySubsHub_bot را به عنوان مدیر به کانال خود اضافه کنید' },
    referrals: { title: 'برنامه معرفی', balance: 'موجودی', referrals: 'معرفی‌ها', earned: 'کسب شده', your_link: 'لینک معرفی شما', copy_link: 'کپی لینک', earn_10_percent: 'با اشتراک دوستان از طریق لینک شما 10% اعتبار کسب کنید', credits_note: 'اعتبارها می‌توانند برای اشتراک استفاده شوند اما قابل برداشت نیستند' },
    admin: { title: 'پنل مدیر', channels: 'همه کانال‌ها', reports: 'کانال‌های گزارش شده', withdrawals: 'برداشت‌های در انتظار', approve: 'تایید', ban: 'مسدود', dismiss: 'رد' },
    purchase: { channel_price: 'قیمت کانال', platform_fee: 'کارمزد پلتفرم (1%)', total_to_pay: 'مبلغ قابل پرداخت', duration: 'مدت', days: 'روز', pay_with_ton: 'پرداخت با TON', processing: 'در حال پردازش...', use_credits: 'استفاده از اعتبار برای کاهش پرداخت', you_have: 'شما دارید', in_credits: 'اعتبار' },
    errors: { network_error: 'خطای شبکه', unauthorized: 'غیرمجاز', invalid_price: 'قیمت نامعتبر', invalid_duration: 'مدت نامعتبر', channel_not_found: 'کانال یافت نشد', already_subscribed: 'قبلاً مشترک شده‌اید' }
  },
  hi: {
    nav: { subscriptions: 'मेरी सदस्यता', channels: 'मेरे चैनल', referrals: 'रेफरल', admin: 'व्यवस्थापक', discover: 'खोजें' },
    common: { loading: 'लोड हो रहा है...', retry: 'पुनः प्रयास करें', cancel: 'रद्द करें', save: 'सहेजें', delete: 'हटाएं', edit: 'संपादित करें', close: 'बंद करें' },
    discover: { title: 'चैनल खोजें', search: 'चैनल खोजें...', categories: 'श्रेणियाँ', sort: 'क्रमबद्ध करें', popular: 'लोकप्रिय', recent: 'हालिया', rating: 'रेटिंग', price_low: 'मूल्य: कम से अधिक', price_high: 'मूल्य: अधिक से कम', no_results: 'कोई चैनल नहीं मिला', subscribe: 'सदस्यता लें' },
    notifications: { title: 'सूचनाएँ', mark_all_read: 'सभी को पढ़ा हुआ चिह्नित करें', no_notifications: 'अभी तक कोई सूचना नहीं', subscription_expired: 'सदस्यता समाप्त', subscription_success: 'सदस्यता सक्रिय', referral_credit: 'रेफरल क्रेडिट अर्जित', withdrawal_approved: 'निकासी स्वीकृत' },
    subscriptions: { title: 'मेरी सदस्यता', active: 'सक्रिय', expired: 'समाप्त', expiring: 'समाप्ति के करीब', renew: 'नवीनीकरण', rate: 'रेट', report: 'रिपोर्ट', open: 'खोलें', no_subs: 'अभी तक कोई सदस्यता नहीं' },
    channels: { title: 'मेरे चैनल', add: 'चैनल जोड़ें', edit: 'संपादित करें', copy: 'कॉपी', forward: 'फॉरवर्ड', delete: 'हटाएं', active: 'सक्रिय', inactive: 'निष्क्रिय', no_channels: 'अभी तक कोई चैनल नहीं', add_first: 'अपना पहला चैनल जोड़ें', bot_admin_required: 'बॉट व्यवस्थापक पहुँच आवश्यक', bot_admin_instructions: 'पहले @MySubsHub_bot को अपने चैनल में व्यवस्थापक के रूप में जोड़ें' },
    referrals: { title: 'रेफरल कार्यक्रम', balance: 'शेष', referrals: 'रेफरल', earned: 'अर्जित', your_link: 'आपका रेफरल लिंक', copy_link: 'लिंक कॉपी करें', earn_10_percent: 'अपने लिंक के माध्यम से दोस्तों की सदस्यता पर 10% क्रेडिट कमाएं', credits_note: 'क्रेडिट का उपयोग सदस्यता के लिए किया जा सकता है लेकिन वापस नहीं लिया जा सकता' },
    admin: { title: 'व्यवस्थापक पैनल', channels: 'सभी चैनल', reports: 'रिपोर्ट किए गए चैनल', withdrawals: 'लंबित निकासी', approve: 'स्वीकृत', ban: 'प्रतिबंध', dismiss: 'खारिज' },
    purchase: { channel_price: 'चैनल मूल्य', platform_fee: 'प्लेटफॉर्म शुल्क (1%)', total_to_pay: 'कुल भुगतान', duration: 'अवधि', days: 'दिन', pay_with_ton: 'TON से भुगतान करें', processing: 'प्रोसेसिंग...', use_credits: 'भुगतान कम करने के लिए क्रेडिट का उपयोग करें', you_have: 'आपके पास है', in_credits: 'क्रेडिट में' },
    errors: { network_error: 'नेटवर्क त्रुटि', unauthorized: 'अनधिकृत', invalid_price: 'अमान्य मूल्य', invalid_duration: 'अमान्य अवधि', channel_not_found: 'चैनल नहीं मिला', already_subscribed: 'पहले से सदस्यता ली हुई है' }
  },
  ru: {
    nav: { subscriptions: 'Мои подписки', channels: 'Мои каналы', referrals: 'Рефералы', admin: 'Админ', discover: 'Обзор' },
    common: { loading: 'Загрузка...', retry: 'Повторить', cancel: 'Отмена', save: 'Сохранить', delete: 'Удалить', edit: 'Редактировать', close: 'Закрыть' },
    discover: { title: 'Обзор каналов', search: 'Поиск каналов...', categories: 'Категории', sort: 'Сортировать', popular: 'Популярные', recent: 'Недавние', rating: 'Рейтинг', price_low: 'Цена: по возрастанию', price_high: 'Цена: по убыванию', no_results: 'Каналы не найдены', subscribe: 'Подписаться' },
    notifications: { title: 'Уведомления', mark_all_read: 'Отметить все как прочитанные', no_notifications: 'Пока нет уведомлений', subscription_expired: 'Подписка истекла', subscription_success: 'Подписка активирована', referral_credit: 'Реферальный кредит получен', withdrawal_approved: 'Вывод одобрен' },
    subscriptions: { title: 'Мои подписки', active: 'Активные', expired: 'Истекшие', expiring: 'Истекающие', renew: 'Продлить', rate: 'Оценить', report: 'Пожаловаться', open: 'Открыть', no_subs: 'Пока нет подписок' },
    channels: { title: 'Мои каналы', add: 'Добавить канал', edit: 'Редактировать', copy: 'Копировать', forward: 'Переслать', delete: 'Удалить', active: 'Активный', inactive: 'Неактивный', no_channels: 'Пока нет каналов', add_first: 'Добавьте свой первый канал', bot_admin_required: 'Требуется доступ администратора бота', bot_admin_instructions: 'Сначала добавьте @MySubsHub_bot как администратора в ваш канал' },
    referrals: { title: 'Реферальная программа', balance: 'Баланс', referrals: 'Рефералы', earned: 'Заработано', your_link: 'Ваша реферальная ссылка', copy_link: 'Копировать ссылку', earn_10_percent: 'Зарабатывайте 10% кредитов, когда друзья подписываются по вашей ссылке', credits_note: 'Кредиты можно использовать для подписок, но нельзя вывести' },
    admin: { title: 'Панель администратора', channels: 'Все каналы', reports: 'Каналы с жалобами', withdrawals: 'Ожидающие выводы', approve: 'Одобрить', ban: 'Заблокировать', dismiss: 'Отклонить' },
    purchase: { channel_price: 'Цена канала', platform_fee: 'Комиссия платформы (1%)', total_to_pay: 'Итого к оплате', duration: 'Продолжительность', days: 'дней', pay_with_ton: 'Оплатить TON', processing: 'Обработка...', use_credits: 'Использовать кредиты для уменьшения оплаты', you_have: 'У вас есть', in_credits: 'в кредитах' },
    errors: { network_error: 'Ошибка сети', unauthorized: 'Неавторизован', invalid_price: 'Неверная цена', invalid_duration: 'Неверная продолжительность', channel_not_found: 'Канал не найден', already_subscribed: 'Уже подписаны' }
  },
  ar: {
    nav: { subscriptions: 'اشتراكاتي', channels: 'قنواتي', referrals: 'الإحالات', admin: 'المسؤول', discover: 'اكتشف' },
    common: { loading: 'جاري التحميل...', retry: 'إعادة المحاولة', cancel: 'إلغاء', save: 'حفظ', delete: 'حذف', edit: 'تعديل', close: 'إغلاق' },
    discover: { title: 'اكتشف القنوات', search: 'البحث عن القنوات...', categories: 'الفئات', sort: 'ترتيب', popular: 'شائع', recent: 'حديث', rating: 'التقييم', price_low: 'السعر: من الأقل', price_high: 'السعر: من الأعلى', no_results: 'لم يتم العثور على قنوات', subscribe: 'اشترك' },
    notifications: { title: 'الإشعارات', mark_all_read: 'تحديد الكل كمقروء', no_notifications: 'لا توجد إشعارات حتى الآن', subscription_expired: 'انتهت صلاحية الاشتراك', subscription_success: 'تم تفعيل الاشتراك', referral_credit: 'تم كسب رصيد الإحالة', withdrawal_approved: 'تم الموافقة على السحب' },
    subscriptions: { title: 'اشتراكاتي', active: 'نشط', expired: 'منتهي', expiring: 'ينتهي قريباً', renew: 'تجديد', rate: 'تقييم', report: 'إبلاغ', open: 'فتح', no_subs: 'لا توجد اشتراكات حتى الآن' },
    channels: { title: 'قنواتي', add: 'إضافة قناة', edit: 'تعديل', copy: 'نسخ', forward: 'إعادة توجيه', delete: 'حذف', active: 'نشط', inactive: 'غير نشط', no_channels: 'لا توجد قنوات حتى الآن', add_first: 'أضف قناتك الأولى', bot_admin_required: 'مطلوب وصول مسؤول البوت', bot_admin_instructions: 'أضف @MySubsHub_bot كمسؤول إلى قناتك أولاً' },
    referrals: { title: 'برنامج الإحالة', balance: 'الرصيد', referrals: 'الإحالات', earned: 'المكتسب', your_link: 'رابط الإحالة الخاص بك', copy_link: 'نسخ الرابط', earn_10_percent: 'اكسب 10% من الرصيد عندما يشترك الأصدقاء عبر رابطك', credits_note: 'يمكن استخدام الأرصدة للاشتراكات ولكن لا يمكن سحبها' },
    admin: { title: 'لوحة المسؤول', channels: 'جميع القنوات', reports: 'القنوات المبلغ عنها', withdrawals: 'عمليات السحب المعلقة', approve: 'موافقة', ban: 'حظر', dismiss: 'رفض' },
    purchase: { channel_price: 'سعر القناة', platform_fee: 'رسوم المنصة (1%)', total_to_pay: 'الإجمالي للدفع', duration: 'المدة', days: 'أيام', pay_with_ton: 'الدفع بـ TON', processing: 'جاري المعالجة...', use_credits: 'استخدام الأرصدة لتقليل الدفع', you_have: 'لديك', in_credits: 'في الأرصدة' },
    errors: { network_error: 'خطأ في الشبكة', unauthorized: 'غير مصرح', invalid_price: 'سعر غير صالح', invalid_duration: 'مدة غير صالحة', channel_not_found: 'القناة غير موجودة', already_subscribed: 'مشترك بالفعل' }
  },
  zh: {
    nav: { subscriptions: '我的订阅', channels: '我的频道', referrals: '推荐', admin: '管理员', discover: '发现' },
    common: { loading: '加载中...', retry: '重试', cancel: '取消', save: '保存', delete: '删除', edit: '编辑', close: '关闭' },
    discover: { title: '发现频道', search: '搜索频道...', categories: '分类', sort: '排序', popular: '热门', recent: '最新', rating: '评分', price_low: '价格：从低到高', price_high: '价格：从高到低', no_results: '未找到频道', subscribe: '订阅' },
    notifications: { title: '通知', mark_all_read: '全部标记为已读', no_notifications: '暂无通知', subscription_expired: '订阅已过期', subscription_success: '订阅已激活', referral_credit: '获得推荐积分', withdrawal_approved: '提款已批准' },
    subscriptions: { title: '我的订阅', active: '活跃', expired: '已过期', expiring: '即将过期', renew: '续订', rate: '评分', report: '举报', open: '打开', no_subs: '暂无订阅' },
    channels: { title: '我的频道', add: '添加频道', edit: '编辑', copy: '复制', forward: '转发', delete: '删除', active: '活跃', inactive: '不活跃', no_channels: '暂无频道', add_first: '添加您的第一个频道', bot_admin_required: '需要机器人管理员权限', bot_admin_instructions: '首先将 @MySubsHub_bot 添加为频道的管理员' },
    referrals: { title: '推荐计划', balance: '余额', referrals: '推荐', earned: '已赚取', your_link: '您的推荐链接', copy_link: '复制链接', earn_10_percent: '通过您的链接订阅的朋友可获得10%积分', credits_note: '积分可用于订阅，但不能提取' },
    admin: { title: '管理员面板', channels: '所有频道', reports: '被举报的频道', withdrawals: '待处理提款', approve: '批准', ban: '禁止', dismiss: '驳回' },
    purchase: { channel_price: '频道价格', platform_fee: '平台费用 (1%)', total_to_pay: '应付总额', duration: '时长', days: '天', pay_with_ton: '用TON支付', processing: '处理中...', use_credits: '使用积分减少支付', you_have: '您有', in_credits: '积分' },
    errors: { network_error: '网络错误', unauthorized: '未授权', invalid_price: '无效价格', invalid_duration: '无效时长', channel_not_found: '未找到频道', already_subscribed: '已订阅' }
  },
  id: {
    nav: { subscriptions: 'Langganan Saya', channels: 'Channel Saya', referrals: 'Referral', admin: 'Admin', discover: 'Temukan' },
    common: { loading: 'Memuat...', retry: 'Coba Lagi', cancel: 'Batal', save: 'Simpan', delete: 'Hapus', edit: 'Edit', close: 'Tutup' },
    discover: { title: 'Temukan Channel', search: 'Cari channel...', categories: 'Kategori', sort: 'Urutkan', popular: 'Populer', recent: 'Terbaru', rating: 'Rating', price_low: 'Harga: Rendah ke Tinggi', price_high: 'Harga: Tinggi ke Rendah', no_results: 'Tidak ada channel ditemukan', subscribe: 'Berlangganan' },
    notifications: { title: 'Notifikasi', mark_all_read: 'Tandai semua sudah dibaca', no_notifications: 'Belum ada notifikasi', subscription_expired: 'Langganan Kedaluwarsa', subscription_success: 'Langganan Diaktifkan', referral_credit: 'Kredit Referral Diperoleh', withdrawal_approved: 'Penarikan Disetujui' },
    subscriptions: { title: 'Langganan Saya', active: 'Aktif', expired: 'Kedaluwarsa', expiring: 'Segera Kedaluwarsa', renew: 'Perpanjang', rate: 'Beri Rating', report: 'Laporkan', open: 'Buka', no_subs: 'Belum ada langganan' },
    channels: { title: 'Channel Saya', add: 'Tambah Channel', edit: 'Edit', copy: 'Salin', forward: 'Teruskan', delete: 'Hapus', active: 'Aktif', inactive: 'Tidak Aktif', no_channels: 'Belum ada channel', add_first: 'Tambahkan Channel Pertama Anda', bot_admin_required: 'Akses Admin Bot Diperlukan', bot_admin_instructions: 'Tambahkan @MySubsHub_bot sebagai admin ke channel Anda terlebih dahulu' },
    referrals: { title: 'Program Referral', balance: 'Saldo', referrals: 'Referral', earned: 'Diperoleh', your_link: 'Link Referral Anda', copy_link: 'Salin Link', earn_10_percent: 'Dapatkan 10% kredit ketika teman berlangganan melalui link Anda', credits_note: 'Kredit dapat digunakan untuk langganan tetapi tidak dapat ditarik' },
    admin: { title: 'Panel Admin', channels: 'Semua Channel', reports: 'Channel Dilaporkan', withdrawals: 'Penarikan Tertunda', approve: 'Setujui', ban: 'Blokir', dismiss: 'Tolak' },
    purchase: { channel_price: 'Harga Channel', platform_fee: 'Biaya Platform (1%)', total_to_pay: 'Total Bayar', duration: 'Durasi', days: 'hari', pay_with_ton: 'Bayar dengan TON', processing: 'Memproses...', use_credits: 'Gunakan kredit untuk mengurangi pembayaran', you_have: 'Anda memiliki', in_credits: 'dalam kredit' },
    errors: { network_error: 'Kesalahan Jaringan', unauthorized: 'Tidak Sah', invalid_price: 'Harga Tidak Valid', invalid_duration: 'Durasi Tidak Valid', channel_not_found: 'Channel Tidak Ditemukan', already_subscribed: 'Sudah Berlangganan' }
  },
  pt: {
    nav: { subscriptions: 'Minhas Assinaturas', channels: 'Meus Canais', referrals: 'Indicações', admin: 'Admin', discover: 'Descobrir' },
    common: { loading: 'Carregando...', retry: 'Tentar Novamente', cancel: 'Cancelar', save: 'Salvar', delete: 'Excluir', edit: 'Editar', close: 'Fechar' },
    discover: { title: 'Descobrir Canais', search: 'Pesquisar canais...', categories: 'Categorias', sort: 'Ordenar', popular: 'Popular', recent: 'Recente', rating: 'Avaliação', price_low: 'Preço: Menor para Maior', price_high: 'Preço: Maior para Menor', no_results: 'Nenhum canal encontrado', subscribe: 'Assinar' },
    notifications: { title: 'Notificações', mark_all_read: 'Marcar todas como lidas', no_notifications: 'Nenhuma notificação ainda', subscription_expired: 'Assinatura Expirada', subscription_success: 'Assinatura Ativada', referral_credit: 'Crédito de Indicação Ganho', withdrawal_approved: 'Saque Aprovado' },
    subscriptions: { title: 'Minhas Assinaturas', active: 'Ativa', expired: 'Expirada', expiring: 'Expirando', renew: 'Renovar', rate: 'Avaliar', report: 'Denunciar', open: 'Abrir', no_subs: 'Nenhuma assinatura ainda' },
    channels: { title: 'Meus Canais', add: 'Adicionar Canal', edit: 'Editar', copy: 'Copiar', forward: 'Encaminhar', delete: 'Excluir', active: 'Ativo', inactive: 'Inativo', no_channels: 'Nenhum canal ainda', add_first: 'Adicione Seu Primeiro Canal', bot_admin_required: 'Acesso de Admin do Bot Necessário', bot_admin_instructions: 'Adicione @MySubsHub_bot como administrador ao seu canal primeiro' },
    referrals: { title: 'Programa de Indicação', balance: 'Saldo', referrals: 'Indicações', earned: 'Ganho', your_link: 'Seu Link de Indicação', copy_link: 'Copiar Link', earn_10_percent: 'Ganhe 10% em créditos quando amigos assinarem pelo seu link', credits_note: 'Créditos podem ser usados para assinaturas mas não podem ser sacados' },
    admin: { title: 'Painel Admin', channels: 'Todos os Canais', reports: 'Canais Denunciados', withdrawals: 'Saques Pendentes', approve: 'Aprovar', ban: 'Banir', dismiss: 'Dispensar' },
    purchase: { channel_price: 'Preço do Canal', platform_fee: 'Taxa da Plataforma (1%)', total_to_pay: 'Total a Pagar', duration: 'Duração', days: 'dias', pay_with_ton: 'Pagar com TON', processing: 'Processando...', use_credits: 'Usar créditos para reduzir pagamento', you_have: 'Você tem', in_credits: 'em créditos' },
    errors: { network_error: 'Erro de Rede', unauthorized: 'Não Autorizado', invalid_price: 'Preço Inválido', invalid_duration: 'Duração Inválida', channel_not_found: 'Canal Não Encontrado', already_subscribed: 'Já Assinado' }
  },
  tr: {
    nav: { subscriptions: 'Aboneliklerim', channels: 'Kanallarım', referrals: 'Referanslar', admin: 'Yönetici', discover: 'Keşfet' },
    common: { loading: 'Yükleniyor...', retry: 'Tekrar Dene', cancel: 'İptal', save: 'Kaydet', delete: 'Sil', edit: 'Düzenle', close: 'Kapat' },
    discover: { title: 'Kanalları Keşfet', search: 'Kanal ara...', categories: 'Kategoriler', sort: 'Sırala', popular: 'Popüler', recent: 'Son', rating: 'Değerlendirme', price_low: 'Fiyat: Düşükten Yükseğe', price_high: 'Fiyat: Yüksekten Düşüğe', no_results: 'Kanal bulunamadı', subscribe: 'Abone Ol' },
    notifications: { title: 'Bildirimler', mark_all_read: 'Tümünü okundu olarak işaretle', no_notifications: 'Henüz bildirim yok', subscription_expired: 'Abonelik Süresi Doldu', subscription_success: 'Abonelik Etkinleştirildi', referral_credit: 'Referans Kredisi Kazanıldı', withdrawal_approved: 'Çekme Onaylandı' },
    subscriptions: { title: 'Aboneliklerim', active: 'Aktif', expired: 'Süresi Dolmuş', expiring: 'Süresi Dolmak Üzere', renew: 'Yenile', rate: 'Değerlendir', report: 'Rapor Et', open: 'Aç', no_subs: 'Henüz abonelik yok' },
    channels: { title: 'Kanallarım', add: 'Kanal Ekle', edit: 'Düzenle', copy: 'Kopyala', forward: 'İlet', delete: 'Sil', active: 'Aktif', inactive: 'Aktif Değil', no_channels: 'Henüz kanal yok', add_first: 'İlk Kanalınızı Ekleyin', bot_admin_required: 'Bot Yönetici Erişimi Gerekli', bot_admin_instructions: 'Önce @MySubsHub_bot\'u kanalınıza yönetici olarak ekleyin' },
    referrals: { title: 'Referans Programı', balance: 'Bakiye', referrals: 'Referanslar', earned: 'Kazanılan', your_link: 'Referans Linkiniz', copy_link: 'Linki Kopyala', earn_10_percent: 'Arkadaşlarınız linkiniz üzerinden abone olduğunda %10 kredi kazanın', credits_note: 'Krediler abonelikler için kullanılabilir ancak çekilemez' },
    admin: { title: 'Yönetici Paneli', channels: 'Tüm Kanallar', reports: 'Raporlanan Kanallar', withdrawals: 'Bekleyen Çekmeler', approve: 'Onayla', ban: 'Yasakla', dismiss: 'Reddet' },
    purchase: { channel_price: 'Kanal Fiyatı', platform_fee: 'Platform Ücreti (%1)', total_to_pay: 'Toplam Ödenecek', duration: 'Süre', days: 'gün', pay_with_ton: 'TON ile Öde', processing: 'İşleniyor...', use_credits: 'Ödemeyi azaltmak için kredi kullan', you_have: 'Sahipsiniz', in_credits: 'kredi' },
    errors: { network_error: 'Ağ Hatası', unauthorized: 'Yetkisiz', invalid_price: 'Geçersiz Fiyat', invalid_duration: 'Geçersiz Süre', channel_not_found: 'Kanal Bulunamadı', already_subscribed: 'Zaten Abone' }
  }
};

// Language detection and management
let currentLanguage = 'en';

function detectLanguage() {
  // Check user preference
  const savedLang = localStorage.getItem('mysubhub_language');
  if (savedLang && mySubHubTranslationsV331[savedLang]) {
    return savedLang;
  }
  
  // Check Telegram language
  const tgLang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
  if (tgLang) {
    const langMap = {
      'en': 'en', 'fa': 'fa', 'hi': 'hi', 'ru': 'ru', 'ar': 'ar',
      'zh': 'zh', 'id': 'id', 'pt': 'pt', 'tr': 'tr'
    };
    if (langMap[tgLang]) return langMap[tgLang];
  }
  
  // Check browser language
  const browserLang = navigator.language.split('-')[0];
  const langMap = {
    'en': 'en', 'fa': 'fa', 'hi': 'hi', 'ru': 'ru', 'ar': 'ar',
    'zh': 'zh', 'id': 'id', 'pt': 'pt', 'tr': 'tr'
  };
  if (langMap[browserLang]) return langMap[browserLang];
  
  return 'en';
}

function t(key) {
  const keys = key.split('.');
  let value = mySubHubTranslationsV331[currentLanguage];
  for (const k of keys) {
    if (value && value[k]) {
      value = value[k];
    } else {
      return key; // Return key if translation not found
    }
  }
  return value;
}

function applyStaticTranslations() {
  document.documentElement.lang = currentLanguage;
  document.documentElement.dir = ['fa', 'ar'].includes(currentLanguage) ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const value = t(element.getAttribute('data-i18n'));
    if (value && value !== element.getAttribute('data-i18n')) element.textContent = value;
  });
}

function setLanguage(lang) {
  if (!mySubHubTranslationsV331[lang]) return;
  currentLanguage = lang;
  try { localStorage.setItem('mysubhub_language', lang); } catch {}
  applyStaticTranslations();
  const modal = document.getElementById('language-modal');
  if (modal) modal.classList.add('hidden');
  if (window.currentPage === 'discover') {
    document.getElementById('discover-container')?.removeAttribute('data-initialized');
  }
  if (window.currentPage) window.switchPage(window.currentPage);
}

window.openLanguageModal = function() {
  document.getElementById('language-modal')?.classList.remove('hidden');
};
window.closeLanguageModal = function() {
  document.getElementById('language-modal')?.classList.add('hidden');
};
window.selectLanguage = function(lang) {
  const normalized = lang === 'pt-BR' ? 'pt' : lang;
  setLanguage(normalized);
};

// Initialize language
currentLanguage = detectLanguage();
applyStaticTranslations();

// ================== TOAST (Phase 4 - Enhanced) ==================
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

// ================== API CLIENT / LOW-RESOURCE MODE ==================
// Cache is memory-only: it is scoped to this WebView session and never stores tokens.
const API_RESPONSE_CACHE = new Map();
const API_IN_FLIGHT = new Map();
const API_CACHE_MAX_ENTRIES = 48;

function apiCacheTtl(url) {
  const path = String(url).split('?')[0];
  if (path === '/api/channels/discover') return 45_000;
  if (path === '/api/channels/my') return 20_000;
  if (path === '/api/owner/dashboard') return 15_000;
  if (path === '/api/subscriptions/my') return 15_000;
  if (path === '/api/withdrawals/my') return 15_000;
  if (path === '/api/referrals/stats') return 30_000;
  if (path === '/api/notifications/my') return 45_000;
  if (path === '/api/admin/withdrawals' || path === '/api/admin/reports') return 10_000;
  if (/^\/api\/channels\/[0-9a-f-]{36}$/i.test(path)) return 60_000;
  if (path === '/api/admin/channels') return 30_000;
  return 0;
}

function invalidateApiCacheForMutation(url) {
  const path = String(url).split('?')[0];
  const invalidationGroups = [];
  if (path.startsWith('/api/channels')) invalidationGroups.push('/api/channels', '/api/owner/dashboard');
  if (path.startsWith('/api/subscriptions')) invalidationGroups.push('/api/subscriptions', '/api/channels/discover', '/api/channels/', '/api/referrals/stats', '/api/notifications/my');
  if (path.startsWith('/api/withdrawals')) invalidationGroups.push('/api/withdrawals', '/api/admin/withdrawals', '/api/owner/dashboard');
  if (path.startsWith('/api/reviews')) invalidationGroups.push('/api/channels/discover', '/api/channels/', '/api/owner/dashboard', '/api/admin/channels');
  if (path.startsWith('/api/reports')) invalidationGroups.push('/api/admin/reports');
  if (path.startsWith('/api/admin/reports')) invalidationGroups.push('/api/admin/reports', '/api/admin/channels', '/api/channels/discover');
  if (path.startsWith('/api/admin/withdrawals')) invalidationGroups.push('/api/admin/withdrawals', '/api/owner/dashboard');
  if (path.startsWith('/api/notifications')) invalidationGroups.push('/api/notifications/my');
  if (path.startsWith('/api/auth/wallet')) invalidationGroups.push('/api/auth/validate', '/api/withdrawals/my');

  if (!invalidationGroups.length) return;
  for (const key of API_RESPONSE_CACHE.keys()) {
    if (invalidationGroups.some(prefix => key.includes(`:${prefix}`))) {
      API_RESPONSE_CACHE.delete(key);
    }
  }
}

function cacheApiResponse(key, data, ttl) {
  if (!ttl || data?.error) return;
  API_RESPONSE_CACHE.delete(key);
  API_RESPONSE_CACHE.set(key, { data, expiresAt: Date.now() + ttl });
  while (API_RESPONSE_CACHE.size > API_CACHE_MAX_ENTRIES) {
    const oldestKey = API_RESPONSE_CACHE.keys().next().value;
    API_RESPONSE_CACHE.delete(oldestKey);
  }
}

async function apiFetch(url, options = {}, retries) {
  const TG = window.Telegram?.WebApp || {};
  const initData = TG.initData || '';
  const method = String(options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';

  if (!initData) {
    if (url === '/api/auth/validate') return { user: null, error: 'Open MySubHub inside Telegram.' };
    return { error: 'Open MySubHub inside Telegram to continue.' };
  }

  const {
    cacheTtlMs,
    noCache = false,
    idempotent = false,
    ...fetchOptions
  } = options;
  const telegramUserId = String(TG.initDataUnsafe?.user?.id || 'telegram-session');
  const cacheKey = `${telegramUserId}:${url}`;
  const ttl = isGet && !noCache ? (Number.isFinite(cacheTtlMs) ? cacheTtlMs : apiCacheTtl(url)) : 0;

  if (ttl) {
    const cached = API_RESPONSE_CACHE.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.data;
    if (cached) API_RESPONSE_CACHE.delete(cacheKey);
  }

  if (isGet && API_IN_FLIGHT.has(cacheKey)) return API_IN_FLIGHT.get(cacheKey);

  // Never retry non-idempotent writes automatically. This is important for payment,
  // referral, channel registration and withdrawal requests.
  const maxRetries = (isGet || idempotent) ? Math.max(0, retries === undefined ? 1 : retries) : 0;
  const requestPromise = (async () => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25_000);
      try {
        const headers = {
          'x-telegram-initdata': initData,
          ...(fetchOptions.headers || {})
        };
        if (fetchOptions.body !== undefined && !Object.keys(headers).some(k => k.toLowerCase() === 'content-type')) {
          headers['Content-Type'] = 'application/json';
        }

        const response = await fetch(`${API_BASE}${url}`, {
          ...fetchOptions,
          method,
          headers,
          signal: controller.signal,
          cache: 'no-store',
          credentials: 'omit'
        });

        let payload = {};
        if (response.status !== 204) {
          payload = await response.json().catch(() => ({ error: `Invalid server response (${response.status})` }));
        }

        if (response.status === 401 || response.status === 403) {
          if (url === '/api/auth/validate') return { user: null, error: 'Unauthorized' };
          return { error: payload.error || 'Unauthorized' };
        }
        if (response.status === 429) return { error: payload.error || 'Too many requests. Please wait and try again.' };
        if (response.status === 409) return payload;
        if (!response.ok) return { ...payload, error: payload.error || `HTTP ${response.status}` };

        if (isGet) cacheApiResponse(cacheKey, payload, ttl);
        else invalidateApiCacheForMutation(url);
        return payload;
      } catch (error) {
        const isLastAttempt = attempt >= maxRetries;
        if (!isLastAttempt) {
          await new Promise(resolve => setTimeout(resolve, 400 * (attempt + 1)));
          continue;
        }
        const message = error?.name === 'AbortError'
          ? 'The request timed out. Please try again.'
          : (isGet ? 'Network error. Please try again.' : 'Network error. The request may have reached the server; check its status before submitting again.');
        console.error(`API error [${method} ${url}]:`, error);
        return { error: message };
      } finally {
        clearTimeout(timeoutId);
      }
    }
    return { error: 'Request failed' };
  })();

  if (isGet) API_IN_FLIGHT.set(cacheKey, requestPromise);
  try {
    return await requestPromise;
  } finally {
    if (isGet && API_IN_FLIGHT.get(cacheKey) === requestPromise) API_IN_FLIGHT.delete(cacheKey);
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
function updateNotificationBadge(unreadValue) {
  const badge = document.getElementById('notification-badge');
  if (!badge) return;
  const unread = Math.max(0, Number(unreadValue || 0));
  if (unread > 0) {
    badge.textContent = unread > 99 ? '99+' : String(unread);
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

async function authenticateUser() {
  const auth = await apiFetch('/api/auth/validate');
  if (auth && auth.user) {
    window.currentUser = auth.user;
    window.isAdmin = auth.isAdmin === true;
    if (auth.unread_count !== undefined) {
      updateNotificationBadge(auth.unread_count);
      lastNotificationBadgeRefresh = Date.now();
    }
    
    if (window.isAdmin) {
      const adminTab = document.getElementById('nav-admin');
      if (adminTab) {
        adminTab.style.setProperty('display', 'flex', 'important');
      }
      
      const adminChannelsTab = document.getElementById('nav-admin-channels');
      if (adminChannelsTab) {
        adminChannelsTab.style.setProperty('display', 'flex', 'important');
      }
    }
  }
  return auth;
}

// ================== NAVIGATION ==================
window.switchPage = function(pageId) {
  if (pageId === 'admin' && !window.isAdmin) pageId = 'subscriptions';
  if (pageId === 'admin-channels' && !window.isAdmin) pageId = 'subscriptions';
  
  const allPages = ['purchase', 'subscriptions', 'owner', 'referrals', 'admin', 'admin-channels', 'discover'];
  allPages.forEach(p => {
    const sec = document.getElementById(`page-${p}`);
    if (sec) { sec.style.display = 'none'; sec.classList.add('hidden-page'); }
  });
  const target = document.getElementById(`page-${pageId}`);
  if (target) { target.style.display = 'block'; target.classList.remove('hidden-page'); }

  const navMap = { subscriptions: 'nav-subscriptions', owner: 'nav-owner', referrals: 'nav-referrals', admin: 'nav-admin', 'admin-channels': 'nav-admin-channels', discover: 'nav-discover' };
  Object.values(navMap).forEach(id => {
    const btn = document.getElementById(id);
    if (btn) { btn.classList.remove('active', 'text-ton-400', 'text-emerald-400', 'text-amber-400', 'text-purple-400', 'text-pink-400', 'text-cyan-400'); btn.classList.add('text-slate-400'); }
  });
  const activeBtn = document.getElementById(navMap[pageId]);
  if (activeBtn) {
    activeBtn.classList.add('active'); activeBtn.classList.remove('text-slate-400');
    const colors = { subscriptions: 'text-ton-400', owner: 'text-emerald-400', referrals: 'text-purple-400', admin: 'text-amber-400', 'admin-channels': 'text-pink-400', discover: 'text-cyan-400' };
    activeBtn.classList.add(colors[pageId] || 'text-ton-400');
  }

  const loaders = { 
    subscriptions: loadSubscriptions, 
    owner: loadOwnerDashboard, 
    referrals: loadReferralDashboard, 
    admin: loadAdminDashboard, 
    'admin-channels': loadAdminChannels,
    discover: loadDiscoverPage
  };
  const pageChanged = window.currentPage !== pageId;
  window.currentPage = pageId;
  if (loaders[pageId]) Promise.resolve(loaders[pageId]()).catch(error => console.error(`Page load failed [${pageId}]:`, error));
  if (pageChanged) window.scrollTo({ top: 0, behavior: 'auto' });
};

// ================== DISCOVER PAGE ==================
const DISCOVER_CATEGORIES = [
  { id: '', name: 'All', icon: '✦' },
  { id: 'crypto', name: 'Cryptocurrency', icon: '💰' },
  { id: 'news', name: 'News', icon: '📰' },
  { id: 'education', name: 'Education', icon: '📚' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
  { id: 'technology', name: 'Technology', icon: '💻' },
  { id: 'business', name: 'Business', icon: '💼' },
  { id: 'lifestyle', name: 'Lifestyle', icon: '🌟' },
  { id: 'gaming', name: 'Gaming', icon: '🎮' },
  { id: 'music', name: 'Music', icon: '🎵' },
  { id: 'other', name: 'Other', icon: '✨' }
];
const DISCOVER_PAGE_SIZE = 12;
let currentCategory = '';
let searchTimeout = null;
let discoverRequestSequence = 0;
let discoverState = { offset: 0, total: 0, loading: false, hasMore: false, channels: [] };

window.loadDiscoverPage = async function() {
  const container = document.getElementById('discover-container');
  if (!container) return;
  const previousSearch = document.getElementById('discover-search')?.value || '';
  const previousSort = document.getElementById('discover-sort')?.value || 'popular';

  if (!container.dataset.initialized) {
    container.innerHTML = `
      <section class="mb-5">
        <div class="mb-4">
          <p class="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-400 mb-2">Premium Telegram communities</p>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">${t('discover.title')}</h2>
          <p class="text-sm text-slate-400 mt-2">Find communities worth joining. Compare content, ratings and subscription terms before you pay.</p>
        </div>
        <div class="glass-card p-3 sm:p-4 mb-4">
          <label for="discover-search" class="sr-only">${t('discover.search')}</label>
          <div class="flex items-center gap-3 bg-slate-950/70 border border-slate-700/80 rounded-xl px-3 py-2.5">
            <span aria-hidden="true" class="text-slate-400">⌕</span>
            <input type="search" id="discover-search" autocomplete="off" placeholder="${t('discover.search')}" class="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none" oninput="debounceSearch()" />
            <button type="button" onclick="clearDiscoverSearch()" class="text-xs text-cyan-400 whitespace-nowrap">Clear</button>
          </div>
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
            <div class="min-w-0 flex-1">
              <p class="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2">${t('discover.categories')}</p>
              <div id="discover-categories" class="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Channel categories"></div>
            </div>
            <div class="sm:w-44">
              <label for="discover-sort" class="block text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2">${t('discover.sort')}</label>
              <select id="discover-sort" onchange="sortDiscoverChannels()" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-xs text-white">
                <option value="popular">${t('discover.popular')}</option>
                <option value="recent">${t('discover.recent')}</option>
                <option value="rating">${t('discover.rating')}</option>
                <option value="price_low">${t('discover.price_low')}</option>
                <option value="price_high">${t('discover.price_high')}</option>
              </select>
            </div>
          </div>
        </div>
        <div class="flex items-center justify-between gap-3 mb-3">
          <h3 class="text-base font-bold text-white">Available communities</h3>
          <span id="discover-result-count" class="text-xs text-slate-500"></span>
        </div>
        <div id="discover-channels" class="grid grid-cols-1 gap-3" aria-live="polite">
          <div class="glass-card p-8 text-center text-slate-400"><span class="animate-pulse">${t('common.loading')}</span></div>
        </div>
        <div id="discover-load-more-wrap" class="hidden text-center mt-5">
          <button id="discover-load-more" type="button" onclick="loadMoreDiscoverChannels()" class="btn-secondary px-6 py-3 rounded-xl text-sm font-semibold text-white">Load more channels</button>
        </div>
      </section>`;
    container.dataset.initialized = 'true';
    const searchInput = document.getElementById('discover-search');
    const sortInput = document.getElementById('discover-sort');
    if (searchInput) searchInput.value = previousSearch;
    if (sortInput) sortInput.value = previousSort;
    renderDiscoverCategories();
  }

  await loadDiscoverChannels(true);
};

function renderDiscoverCategories() {
  const categoriesContainer = document.getElementById('discover-categories');
  if (!categoriesContainer) return;
  categoriesContainer.innerHTML = DISCOVER_CATEGORIES.map(category => {
    const active = category.id === currentCategory;
    return `<button type="button" data-category="${escapeHtml(category.id)}" aria-pressed="${active ? 'true' : 'false'}" onclick="filterByCategory('${escapeHtml(category.id)}', this)" class="category-chip ${active ? 'category-chip-active' : ''}">${category.icon} ${escapeHtml(category.name)}</button>`;
  }).join('');
}

window.debounceSearch = function() {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => loadDiscoverChannels(true), 450);
};
window.sortDiscoverChannels = function() {
  if (searchTimeout) clearTimeout(searchTimeout);
  return loadDiscoverChannels(true);
};

window.clearDiscoverSearch = function() {
  if (searchTimeout) clearTimeout(searchTimeout);
  const input = document.getElementById('discover-search');
  if (input) input.value = '';
  loadDiscoverChannels(true);
};

window.filterByCategory = function(category) {
  if (searchTimeout) clearTimeout(searchTimeout);
  currentCategory = DISCOVER_CATEGORIES.some(item => item.id === category) ? category : '';
  renderDiscoverCategories();
  loadDiscoverChannels(true);
};

function discoverCategoryIcon(categoryId) {
  return DISCOVER_CATEGORIES.find(item => item.id === categoryId)?.icon || '✨';
}

function renderDiscoverCard(channel) {
  const id = String(channel.id || '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) return '';
  const name = escapeHtml(channel.channel_name || 'Untitled channel');
  const description = escapeHtml(channel.description || 'The creator has not added a description yet.');
  const category = escapeHtml(channel.category || 'other');
  const price = Number(channel.subscription_price || 0);
  const duration = Number(channel.duration_days || 30);
  const rating = Number(channel.avg_rating || 0);
  const reviews = Number(channel.review_count || 0);
  const subscribers = Number(channel.active_subscribers || 0);
  const durationLabel = duration === 9999 ? '9,999 days' : `${duration} days`;
  const ratingLabel = reviews > 0 ? `⭐ ${rating.toFixed(1)} <span class="text-slate-500">(${reviews})</span>` : '<span class="text-slate-500">New listing</span>';

  return `
    <article class="glass-card p-4 sm:p-5 discover-card">
      <div class="flex items-start gap-3">
        <div class="discover-avatar" aria-hidden="true">${discoverCategoryIcon(channel.category)}</div>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <h4 class="font-bold text-white text-base leading-tight">${name}</h4>
            ${channel.is_verified ? '<span class="verified-pill" title="Verified channel">✓ Verified</span>' : ''}
          </div>
          <p class="text-[11px] text-cyan-300 mt-1 uppercase tracking-wide">${category}</p>
        </div>
      </div>
      <p class="text-sm text-slate-400 leading-relaxed mt-3 discover-description">${description}</p>
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs mt-4">
        <span class="text-amber-300">${ratingLabel}</span>
        <span class="text-slate-400">${subscribers.toLocaleString()} active subscribers</span>
        <span class="text-slate-500">${durationLabel}</span>
      </div>
      <div class="flex items-end justify-between gap-3 border-t border-slate-700/70 mt-4 pt-4">
        <div>
          <p class="text-[10px] uppercase tracking-wider text-slate-500">Subscription</p>
          <p class="text-xl font-extrabold text-emerald-400 font-mono">${Number.isFinite(price) ? formatTon(price) : '—'} TON</p>
          <p class="text-[11px] text-slate-500">per ${durationLabel}</p>
        </div>
        <button type="button" onclick="openChannelDetails('${id}')" class="btn-primary min-h-11 px-4 py-2.5 rounded-xl text-xs sm:text-sm text-white font-semibold">View channel</button>
      </div>
    </article>`;
}

window.loadDiscoverChannels = async function(reset = true) {
  const channelsContainer = document.getElementById('discover-channels');
  if (!channelsContainer) return;
  // A reset (new search/category/sort) supersedes any older in-flight request.
  // A Load More action is ignored while another request is already active.
  if (!reset && discoverState.loading) return;
  if (reset) {
    discoverState.offset = 0;
    discoverState.total = 0;
    discoverState.channels = [];
    discoverState.hasMore = false;
  }

  const search = document.getElementById('discover-search')?.value?.trim() || '';
  const sort = document.getElementById('discover-sort')?.value || 'popular';
  const requestOffset = discoverState.offset;
  const requestId = ++discoverRequestSequence;
  discoverState.loading = true;
  const moreWrap = document.getElementById('discover-load-more-wrap');
  const moreButton = document.getElementById('discover-load-more');
  if (moreButton) moreButton.disabled = true;
  if (reset) {
    channelsContainer.innerHTML = '<div class="glass-card p-8 text-center text-slate-400"><span class="animate-pulse">Loading channels…</span></div>';
  } else if (moreButton) {
    moreButton.textContent = 'Loading…';
  }

  try {
    const params = new URLSearchParams({
      search,
      category: currentCategory,
      sort,
      limit: String(DISCOVER_PAGE_SIZE),
      offset: String(requestOffset)
    });
    const result = await apiFetch(`/api/channels/discover?${params}`);
    if (requestId !== discoverRequestSequence) return;
    if (result.error) {
      if (reset) channelsContainer.innerHTML = `<div class="glass-card p-6 text-center text-red-300">${escapeHtml(result.error)}<button type="button" onclick="loadDiscoverChannels(true)" class="block mx-auto mt-3 btn-secondary px-4 py-2 rounded-lg text-xs">Retry</button></div>`;
      else Toast.error(result.error);
      return;
    }

    const rows = Array.isArray(result.channels) ? result.channels : [];
    discoverState.channels = reset ? rows : discoverState.channels.concat(rows);
    discoverState.total = Number(result.total || 0);
    discoverState.offset = requestOffset + rows.length;
    discoverState.hasMore = discoverState.offset < discoverState.total && rows.length > 0;

    if (!discoverState.channels.length) {
      channelsContainer.innerHTML = `<div class="glass-card p-10 text-center"><div class="text-3xl mb-3">⌕</div><p class="text-white font-semibold">${t('discover.no_results')}</p><p class="text-xs text-slate-500 mt-2">Try another keyword or category.</p></div>`;
    } else {
      channelsContainer.innerHTML = discoverState.channels.map(renderDiscoverCard).join('');
    }

    const count = document.getElementById('discover-result-count');
    if (count) count.textContent = discoverState.total ? `${discoverState.total.toLocaleString()} listings` : `${discoverState.channels.length} listings`;
    if (moreWrap) moreWrap.classList.toggle('hidden', !discoverState.hasMore);
    if (moreButton) moreButton.textContent = `Load more (${Math.max(0, discoverState.total - discoverState.offset)} remaining)`;
  } catch (error) {
    console.error('Discover request failed:', error);
    if (reset) channelsContainer.innerHTML = '<div class="glass-card p-6 text-center text-red-300">Could not load channels. Please try again.</div>';
  } finally {
    if (requestId === discoverRequestSequence) {
      discoverState.loading = false;
      if (moreButton) moreButton.disabled = false;
    }
  }
};

window.loadMoreDiscoverChannels = function() {
  return window.loadDiscoverChannels(false);
};

window.openChannelDetails = async function(channelId) {
  await window.loadPurchasePage(channelId);
  window.switchPage('purchase');
};

// ================== NOTIFICATIONS (Phase 2) ==================
let lastNotificationBadgeRefresh = 0;
window.loadNotifications = async function(force = false) {
  const badge = document.getElementById('notification-badge');
  if (!badge) return;
  if (!force && Date.now() - lastNotificationBadgeRefresh < 45_000) return;

  try {
    const result = await apiFetch('/api/notifications/my', { noCache: force });
    if (result.error) return;
    lastNotificationBadgeRefresh = Date.now();
    updateNotificationBadge(result.unread_count);
  } catch (e) {
    console.error('Failed to load notification count:', e);
  }
};

window.showNotifications = async function() {
  document.getElementById('notifications-modal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'notifications-modal';
  modal.className = 'fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="glass-card p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-white">${t('notifications.title')}</h2>
        <button onclick="markAllNotificationsRead()" class="btn-secondary px-3 py-1.5 rounded-lg text-xs">
          ${t('notifications.mark_all_read')}
        </button>
      </div>
      <div id="notifications-list" class="space-y-3">
        <div class="text-center py-8 text-slate-400"><div class="animate-pulse">${t('common.loading')}</div></div>
      </div>
      <button onclick="this.closest('.fixed').remove()" class="btn-secondary w-full mt-4 py-2.5 rounded-xl text-sm">
        ${t('common.close')}
      </button>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Load notifications
  const result = await apiFetch('/api/notifications/my', { noCache: true });
  const list = document.getElementById('notifications-list');
  
  if (result.error || !result.notifications || result.notifications.length === 0) {
    list.innerHTML = `<div class="text-center py-8 text-slate-400">${t('notifications.no_notifications')}</div>`;
    return;
  }
  
  list.innerHTML = result.notifications.map(n => `
    <div class="bg-slate-800/50 rounded-xl p-4 ${!n.read ? 'border-l-4 border-cyan-500' : ''}">
      <div class="flex items-start justify-between mb-2">
        <h3 class="font-semibold text-white text-sm">${escapeHtml(n.title)}</h3>
        <span class="text-xs text-slate-500">${new Date(n.created_at).toLocaleDateString()}</span>
      </div>
      <p class="text-xs text-slate-300">${escapeHtml(n.message)}</p>
    </div>
  `).join('');
};

window.markAllNotificationsRead = async function() {
  const result = await apiFetch('/api/notifications/read', { method: 'POST', body: JSON.stringify({}) });
  if (result?.error) { Toast.error(result.error); return; }
  document.getElementById('notifications-modal')?.remove();
  const badge = document.getElementById('notification-badge');
  if (badge) badge.style.display = 'none';
  lastNotificationBadgeRefresh = Date.now();
  Toast.success('All notifications marked as read');
  window.showNotifications();
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
    list.innerHTML = `<div class="glass-card p-10 text-center text-slate-400">${t('subscriptions.no_subs')}</div>`;
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
    
    const inviteLink = escapeHtml(s.access_invite_link || '');
    const name = escapeHtml(ch.channel_name || 'Unknown');
    const channelId = s.channel_id;

    if (isExpired) {
      return `
        <div class="glass-card p-5 mb-3 border-2 border-red-500/30 bg-red-500/5 opacity-75">
          <div class="flex justify-between items-start mb-3">
            <div class="flex items-center gap-2">
              <h3 class="font-semibold text-slate-400 text-lg">${name}</h3>
              ${ch.is_verified ? '<span class="text-blue-400 text-sm" title="Verified">✓</span>' : ''}
            </div>
            <span class="badge bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full text-xs font-bold">
              ⚠️ ${t('subscriptions.expired')}
            </span>
          </div>
          <p class="text-slate-500 text-sm mb-4">
            ${t('subscriptions.expired')}: ${endDate.toLocaleDateString()} • ${formatTon(s.amount || 0)} TON
          </p>
          <div class="flex gap-2 flex-wrap">
            <button onclick="renewSubscription('${channelId}')" class="btn-primary px-5 py-2.5 rounded-xl text-sm text-white font-semibold flex-1">
              🔄 ${t('subscriptions.renew')}
            </button>
            <button onclick="openReport('${channelId}')" class="btn-secondary px-4 py-2.5 rounded-xl text-sm">
              🚩 ${t('subscriptions.report')}
            </button>
          </div>
        </div>
      `;
    }

    return `
      <div class="glass-card p-5 mb-3 hover:border-blue-500/50 transition-all">
        <div class="flex justify-between items-start mb-3">
          <div class="flex items-center gap-2">
            <h3 class="font-semibold text-white text-lg">${name}</h3>
            ${ch.is_verified ? '<span class="text-blue-400 text-sm" title="Verified">✓</span>' : ''}
          </div>
          <span class="badge ${isExpiring ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'} px-3 py-1 rounded-full text-xs font-bold">
            ${isExpiring ? `⚠️ ${daysLeft}d ${t('subscriptions.expiring')}` : `✓ ${t('subscriptions.active')}`}
          </span>
        </div>
        <p class="text-slate-400 text-sm mb-4">${t('subscriptions.expired')}: ${endDate.toLocaleDateString()} • ${formatTon(s.amount || 0)} TON</p>
        <div class="flex gap-2 flex-wrap">
          ${inviteLink ? `<button onclick="joinChannel('${inviteLink}')" class="btn-primary px-4 py-2 rounded-xl text-xs text-white">📺 ${t('subscriptions.open')}</button>` : `<button onclick="requestSubscriptionAccessLink('${escapeHtml(s.id)}')" class="btn-primary px-4 py-2 rounded-xl text-xs text-white">🔗 Get access link</button>`}
          <button onclick="event.stopPropagation();renewSubscription('${channelId}')" class="btn-secondary px-4 py-2 rounded-xl text-xs">🔄 ${t('subscriptions.renew')}</button>
          <button onclick="event.stopPropagation();openRating('${channelId}')" class="btn-secondary px-4 py-2 rounded-xl text-xs">⭐ ${t('subscriptions.rate')}</button>
          <button onclick="event.stopPropagation();openReport('${channelId}')" class="btn-secondary px-4 py-2 rounded-xl text-xs">🚩 ${t('subscriptions.report')}</button>
        </div>
      </div>
    `;
  }).join('');
  
  updateSubStats(active, expiring, spent);
};

function updateSubStats(active, expiring, spent) {
  const a = document.getElementById('stat-active'); if (a) a.textContent = active;
  const e = document.getElementById('stat-expiring'); if (e) e.textContent = expiring;
  const s = document.getElementById('stat-spent'); if (s) s.textContent = formatTon(spent);
}

window.requestSubscriptionAccessLink = async function(subscriptionId) {
  const result = await apiFetch(`/api/subscriptions/${encodeURIComponent(subscriptionId)}/access-link`, {
    method: 'POST',
    body: JSON.stringify({})
  });
  if (result.error) {
    Toast.error(result.error);
    return;
  }
  if (result.already_member) {
    Toast.success('You already have access to this channel.');
    return;
  }
  if (result.invite_link) {
    joinChannel(result.invite_link);
    loadSubscriptions();
  }
};

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

// ================== PURCHASE PAGE ==================
window.loadPurchasePage = async function(channelId) {
  const card = document.getElementById('purchase-card');
  if (!card) return;
  card.innerHTML = '<div class="text-center py-8 text-slate-400"><div class="animate-pulse">Loading...</div></div>';

  try {
    const channel = await apiFetch(`/api/channels/${channelId}`);
    if (channel.error || !channel.id) {
      card.innerHTML = `<div class="text-center py-8"><p class="text-red-400 mb-3">${t('errors.channel_not_found')}</p><button onclick="switchPage('subscriptions')" class="btn-primary px-4 py-2 rounded-xl text-sm text-white">${t('common.close')}</button></div>`;
      return;
    }

    const channelPrice = parseFloat(channel.subscription_price || 0);
    const platformFee = channelPrice * 0.01;
    const totalPrice = channelPrice + platformFee;
    const days = channel.duration_days || 30;
    const name = escapeHtml(channel.channel_name || 'Unknown');
    const reviews = channel.reviews || [];
    const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0.0';

    card.innerHTML = `
      <div class="text-center mb-6">
        <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-500/30 flex items-center justify-center mx-auto mb-4">
          <span class="text-4xl">📺</span>
        </div>
        <h2 class="text-2xl font-bold text-white mb-2">${name}</h2>
        ${channel.is_verified ? '<span class="text-sm text-blue-400">✓ Verified</span>' : ''}
      </div>

      <div class="bg-slate-800/40 border border-slate-700/70 rounded-xl p-4 mb-5">
        <div class="flex flex-wrap items-center gap-2 mb-2">
          ${channel.category ? `<span class="text-[11px] font-semibold uppercase tracking-wide text-cyan-300">${escapeHtml(channel.category)}</span>` : ''}
          ${Number(channel.total_reviews || reviews.length || 0) > 0 ? `<span class="text-xs text-amber-300">⭐ ${Number(channel.avg_rating || avgRating).toFixed(1)} · ${Number(channel.total_reviews || reviews.length)} reviews</span>` : '<span class="text-xs text-slate-500">New listing</span>'}
        </div>
        <p class="text-sm text-slate-300 leading-relaxed">${escapeHtml(channel.description || 'The creator has not added a channel description yet.')}</p>
      </div>
      
      ${reviews.length > 0 ? `
        <div class="bg-slate-800/50 rounded-xl p-5 mb-5">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-bold text-white">⭐ Channel Ratings</h3>
            <span class="text-2xl font-bold text-yellow-400">${avgRating}/5</span>
          </div>
          <div class="space-y-3 max-h-48 overflow-y-auto">
            ${reviews.slice(0, 5).map(r => `
              <div class="bg-slate-900/60 rounded-lg p-3">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-semibold text-white">${'⭐'.repeat(r.rating)}</span>
                  <span class="text-xs text-slate-500">${new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                ${r.comment ? `<p class="text-sm text-slate-300">${escapeHtml(r.comment)}</p>` : ''}
              </div>
            `).join('')}
            ${reviews.length > 5 ? `<p class="text-xs text-slate-500 text-center">+${reviews.length - 5} more reviews</p>` : ''}
          </div>
        </div>
      ` : ''}
      
      <div class="bg-slate-800/50 rounded-xl p-5 mb-5 space-y-4">
        <div class="flex justify-between items-center">
          <span class="text-base text-slate-400">${t('purchase.channel_price')}</span>
          <span class="text-xl font-bold text-white font-mono">${formatTon(channelPrice)} TON</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-base text-slate-400">${t('purchase.platform_fee')}</span>
          <span class="text-base text-slate-400 font-mono">${formatTon(platformFee)} TON</span>
        </div>
        <div class="border-t border-slate-700 pt-4 flex justify-between items-center">
          <span class="text-lg font-bold text-white">${t('purchase.total_to_pay')}</span>
          <span class="text-2xl font-bold text-emerald-400 font-mono">${formatTon(totalPrice)} TON</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-base text-slate-400">${t('purchase.duration')}</span>
          <span class="text-base font-semibold text-white">${days} ${t('purchase.days')}</span>
        </div>
      </div>
      <div id="purchase-credits-section" class="mb-5"></div>
      <button onclick="initiatePurchase('${channelId}')" id="purchase-btn" class="btn-primary w-full py-4 rounded-xl text-white font-bold text-base">
        💎 ${t('purchase.pay_with_ton')}
      </button>
      <div id="purchase-status" class="mt-4"></div>
    `;

    loadCreditsForPurchase(channelId, totalPrice, Number(channel.current_credit_balance || 0));
  } catch (e) {
    card.innerHTML = `<div class="text-center py-8"><p class="text-red-400 mb-3">${t('errors.network_error')}</p><button onclick="switchPage('subscriptions')" class="btn-primary px-4 py-2 rounded-xl text-sm text-white">${t('common.close')}</button></div>`;
  }
};

function loadCreditsForPurchase(channelId, totalPrice, currentBalance = 0) {
  const section = document.getElementById('purchase-credits-section');
  if (!section) return;
  const balance = Number(currentBalance);
  if (!Number.isFinite(balance) || balance <= 0) {
    section.innerHTML = '';
    return;
  }

  section.innerHTML = `
    <div class="bg-purple-500/10 border-2 border-purple-500/30 rounded-xl p-4">
      <p class="text-sm text-purple-300 mb-3">💰 ${t('purchase.you_have')} <strong>${formatTon(balance)} TON</strong> ${t('purchase.in_credits')}</p>
      <label class="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" id="use-credits-check" onchange="toggleCreditsUsage()" class="rounded w-5 h-5">
        <span class="text-sm text-slate-300">${t('purchase.use_credits')}</span>
      </label>
      <input type="number" id="credits-amount" step="0.000000001" min="0" max="${Math.min(balance, totalPrice)}" placeholder="0.000000000" class="w-full mt-3 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white font-mono hidden" />
    </div>
  `;
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
  btn.innerHTML = `<div class="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full inline-block"></div> ${t('purchase.processing')}`;
  status.innerHTML = '';

  try {
    const initiation = await apiFetch('/api/subscriptions/initiate', {
      method: 'POST',
      body: JSON.stringify({ channel_id: channelId, credits_used: useCredits ? creditsAmount : 0 })
    }, 0);

    if (initiation.error) {
      status.innerHTML = `<p class="text-red-400 text-sm text-center">${escapeHtml(initiation.error)}</p>`;
      btn.disabled = false;
      btn.innerHTML = `💎 ${t('purchase.pay_with_ton')}`;
      return;
    }

    if (!initiation.paymentDetails || parseFloat(initiation.paymentDetails.amount) <= 0) {
      const confirm = await apiFetch('/api/subscriptions/confirm', {
        method: 'POST',
        body: JSON.stringify({ channel_id: channelId, nonce: initiation.nonce })
      }, 0);
      if (confirm.success) {
        if (confirm.referral_reward_pending) {
          status.innerHTML = `<p class="text-emerald-400 text-sm text-center">✅ Subscription activated. Referral credit is still being finalized.</p>
            <button class="btn-secondary w-full px-4 py-3 rounded-xl text-sm mt-3" onclick="retrySubscriptionConfirmation('${escapeHtml(channelId)}','${escapeHtml(initiation.nonce)}')">🔄 Retry referral confirmation</button>`;
        } else {
          status.innerHTML = '<p class="text-emerald-400 text-sm text-center">✅ Subscription activated with credits!</p>';
          Toast.success('Subscription activated!');
          setTimeout(() => switchPage('subscriptions'), 2000);
        }
      } else {
        status.innerHTML = `<p class="text-red-400 text-sm text-center">${escapeHtml(confirm.error || 'Failed')}</p>`;
      }
      btn.disabled = false;
      btn.innerHTML = `💎 ${t('purchase.pay_with_ton')}`;
      return;
    }

    if (!tonConnectUI) {
      status.innerHTML = '<p class="text-amber-400 text-sm text-center">Connect wallet first</p>';
      btn.disabled = false;
      btn.innerHTML = `💎 ${t('purchase.pay_with_ton')}`;
      return;
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const intentExpiry = Math.floor(Date.parse(initiation.expires_at || '') / 1000);
    const validUntil = Number.isFinite(intentExpiry) && intentExpiry > nowSeconds
      ? Math.min(nowSeconds + 600, intentExpiry - 10)
      : nowSeconds + 600;
    if (validUntil <= nowSeconds) throw new Error('Payment reference expired. Start checkout again.');

    const txResult = await tonConnectUI.sendTransaction({
      validUntil,
      network: initiation.paymentDetails.network || '-3',
      messages: [{
        address: initiation.paymentDetails.wallet,
        amount: initiation.paymentDetails.amountNano,
        payload: initiation.paymentDetails.payload,
      }]
    });
    if (!txResult || !txResult.boc) throw new Error('Wallet did not return a transaction BOC');

    status.innerHTML = '<p class="text-blue-400 text-sm text-center">Verifying payment...</p>';

    let confirmation = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      confirmation = await apiFetch('/api/subscriptions/confirm', {
        method: 'POST',
        body: JSON.stringify({ channel_id: channelId, nonce: initiation.nonce })
      }, 0);
      if (confirmation.success || !confirmation.pending) break;
      if (attempt < 4) await new Promise(resolve => setTimeout(resolve, 1800));
    }

    if (confirmation?.success) {
      if (confirmation.referral_reward_pending) {
        status.innerHTML = `<p class="text-emerald-400 text-sm text-center">✅ Subscription activated. Referral credit is still being finalized.</p>
          <button class="btn-secondary w-full px-4 py-3 rounded-xl text-sm mt-3" onclick="retrySubscriptionConfirmation('${escapeHtml(channelId)}','${escapeHtml(initiation.nonce)}')">🔄 Retry referral confirmation</button>`;
      } else {
        status.innerHTML = '<p class="text-emerald-400 text-sm text-center">✅ Subscription activated!</p>';
        Toast.success('Subscription activated!');
        setTimeout(() => switchPage('subscriptions'), 2000);
      }
    } else if (confirmation?.pending || confirmation?.error) {
      status.innerHTML = `<p class="text-amber-300 text-sm text-center mb-3">${escapeHtml(confirmation.error || 'Payment is still being indexed. Do not pay again yet.')}</p>
        <button class="btn-secondary w-full px-4 py-3 rounded-xl text-sm" onclick="retrySubscriptionConfirmation('${escapeHtml(channelId)}','${escapeHtml(initiation.nonce)}')">🔄 Verify payment again</button>`;
    }
  } catch (e) {
    status.innerHTML = `<p class="text-red-400 text-sm text-center">${escapeHtml(e.message || 'Failed')}</p>`;
  }

  btn.disabled = false;
  btn.innerHTML = `💎 ${t('purchase.pay_with_ton')}`;
};

window.retrySubscriptionConfirmation = async function(channelId, nonce) {
  const status = document.getElementById('purchase-status');
  if (status) status.innerHTML = '<p class="text-blue-300 text-sm text-center">Checking the blockchain...</p>';
  const result = await apiFetch('/api/subscriptions/confirm', {
    method: 'POST',
    body: JSON.stringify({ channel_id: channelId, nonce })
  }, 0);
  if (result.success && result.referral_reward_pending) {
    if (status) status.innerHTML = `<p class="text-emerald-400 text-sm text-center">✅ Subscription is active. Referral credit is still pending; retrying does not charge you again.</p>
      <button class="btn-secondary w-full px-4 py-3 rounded-xl text-sm mt-3" onclick="retrySubscriptionConfirmation('${escapeHtml(channelId)}','${escapeHtml(nonce)}')">🔄 Retry referral confirmation</button>`;
  } else if (result.success) {
    if (status) status.innerHTML = '<p class="text-emerald-400 text-sm text-center">✅ Subscription activated!</p>';
    Toast.success('Subscription activated!');
    setTimeout(() => switchPage('subscriptions'), 1500);
  } else {
    if (status) status.innerHTML = `<p class="text-amber-300 text-sm text-center">${escapeHtml(result.error || 'Payment is still being verified. Retry shortly; do not send another payment.')}</p>
      <button class="btn-secondary w-full px-4 py-3 rounded-xl text-sm mt-3" onclick="retrySubscriptionConfirmation('${escapeHtml(channelId)}','${escapeHtml(nonce)}')">🔄 Verify payment again</button>`;
  }
};

// ================== OWNER DASHBOARD ==================
window.loadOwnerDashboard = async function() {
  const container = document.getElementById('channels-list');
  const summary = document.getElementById('owner-summary');
  if (!container) return;
  container.innerHTML = '<div class="glass-card p-8 text-center text-slate-400"><span class="animate-pulse">Loading your creator studio…</span></div>';

  const dashboard = await apiFetch('/api/owner/dashboard');

  if (dashboard?.error) {
    if (summary) summary.innerHTML = '';
    container.innerHTML = `<div class="glass-card p-6 text-center"><p class="text-red-300 mb-3">${escapeHtml(dashboard.error)}</p><button type="button" onclick="loadOwnerDashboard()" class="btn-primary px-4 py-2 rounded-lg text-xs text-white">${t('common.retry')}</button></div>`;
    return;
  }

  const safeChannels = Array.isArray(dashboard?.channels) ? dashboard.channels : [];
  const withdrawalData = dashboard?.withdrawals || { pendingEarnings: 0, reservedWithdrawals: 0, withdrawals: [] };
  window.ownerChannels = safeChannels;
  const activeChannels = safeChannels.filter(channel => channel.is_active === true).length;
  const subscribers = safeChannels.reduce((total, channel) => total + Number(channel.active_subscribers || 0), 0);
  const ratedChannels = safeChannels.filter(channel => Number(channel.review_count || 0) > 0);
  const averageRating = ratedChannels.length
    ? ratedChannels.reduce((total, channel) => total + Number(channel.avg_rating || 0), 0) / ratedChannels.length
    : 0;

  if (summary) {
    summary.innerHTML = `
      <div class="grid grid-cols-3 gap-2 mb-4">
        <div class="glass-card p-3 text-center"><p class="text-[10px] uppercase text-slate-500 font-bold">Channels</p><p class="text-xl font-extrabold text-white mt-1">${safeChannels.length}</p></div>
        <div class="glass-card p-3 text-center"><p class="text-[10px] uppercase text-slate-500 font-bold">Subscribers</p><p class="text-xl font-extrabold text-cyan-300 mt-1">${subscribers.toLocaleString()}</p></div>
        <div class="glass-card p-3 text-center"><p class="text-[10px] uppercase text-slate-500 font-bold">Avg. rating</p><p class="text-xl font-extrabold text-amber-300 mt-1">${averageRating ? averageRating.toFixed(1) : '—'}</p></div>
      </div>
      <div class="flex items-center justify-between gap-2 mb-3">
        <div><p class="text-sm font-bold text-white">Your listings</p><p class="text-xs text-slate-500">${activeChannels} published · ${safeChannels.length - activeChannels} need setup</p></div>
        <button type="button" onclick="openAddChannelModal()" class="btn-primary px-3 py-2 rounded-xl text-xs text-white font-semibold">＋ Add channel</button>
      </div>`;
  }

  let channelsMarkup = '';
  if (safeChannels.length === 0) {
    channelsMarkup = `
      <div class="glass-card p-6 sm:p-8 mb-4">
        <div class="text-center mb-5">
          <div class="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-3xl">📣</div>
          <h3 class="text-xl font-bold text-white mb-2">Start earning from your community</h3>
          <p class="text-sm text-slate-400 max-w-sm mx-auto">Add the MySubHub bot as a channel administrator. It will send you a private setup link. Use that link here to configure your subscription.</p>
        </div>
        <ol class="text-sm text-slate-300 space-y-2 list-decimal list-inside bg-slate-900/60 rounded-xl p-4 mb-4">
          <li>Open your Telegram channel or group settings.</li>
          <li>Add <strong class="text-cyan-300">@${escapeHtml(BOT_USERNAME)}</strong> as an administrator.</li>
          <li>Grant only the permissions required to manage members and invite links.</li>
          <li>Return to MySubHub and paste the setup link sent by the bot.</li>
        </ol>
        <button type="button" onclick="openAddChannelModal()" class="btn-primary w-full min-h-11 rounded-xl px-4 py-3 text-sm font-semibold text-white">Configure a channel</button>
      </div>`;
  } else {
    channelsMarkup = safeChannels.map(channel => {
      const id = String(channel.id || '');
      if (!/^[0-9a-f-]{36}$/i.test(id)) return '';
      const name = escapeHtml(channel.channel_name || 'Untitled channel');
      const description = escapeHtml(channel.description || 'No description added yet.');
      const price = Number(channel.subscription_price || 0);
      const duration = Number(channel.duration_days || 30);
      const subscribersCount = Number(channel.active_subscribers || 0);
      const rating = Number(channel.avg_rating || 0);
      const reviews = Number(channel.review_count || 0);
      const active = channel.is_active === true;
      const durationLabel = duration === 9999 ? '9,999 days' : `${duration} days`;
      return `
        <article class="glass-card p-4 sm:p-5 mb-3">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2"><h3 class="font-bold text-white text-base">${name}</h3><span class="text-[10px] px-2 py-1 rounded-full ${active ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'}">${active ? 'Published' : 'Setup incomplete'}</span></div>
              <p class="text-xs text-slate-400 mt-1">${formatTon(price)} TON · ${durationLabel}</p>
              <p class="text-xs text-slate-500 mt-2 line-clamp-2">${description}</p>
            </div>
            <div class="text-right shrink-0"><p class="text-lg font-bold text-cyan-300">${subscribersCount.toLocaleString()}</p><p class="text-[10px] text-slate-500">subscribers</p></div>
          </div>
          <div class="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-700/70">
            <span class="text-xs text-amber-300">${reviews > 0 ? `⭐ ${rating.toFixed(1)} · ${reviews} reviews` : 'No reviews yet'}</span>
            <div class="flex flex-wrap justify-end gap-2">
              ${active ? `<button type="button" onclick="copyShareLink('${id}')" class="btn-secondary px-3 py-2 rounded-lg text-xs">Copy link</button>` : `<button type="button" onclick="openAddChannelModal('${id}')" class="btn-primary px-3 py-2 rounded-lg text-xs text-white">Finish setup</button>`}
              <button type="button" onclick="openEditModal('${id}')" class="btn-secondary px-3 py-2 rounded-lg text-xs">Manage</button>
            </div>
          </div>
        </article>`;
    }).join('');
  }

  container.innerHTML = channelsMarkup + renderOwnerWithdrawalCard(withdrawalData);
};

function renderOwnerWithdrawalCard(data) {
  if (!data || data.error) {
    return `<div class="glass-card p-4 mt-4"><p class="text-sm text-amber-300">${escapeHtml(data?.error || 'Could not load withdrawal balance.')}</p></div>`;
  }
  const balance = Number(data.pendingEarnings || 0);
  const wallet = window.currentUser?.wallet_address || '';
  const history = Array.isArray(data.withdrawals)
    ? data.withdrawals.slice().sort((a, b) => new Date(b.request_date || 0) - new Date(a.request_date || 0)).slice(0, 5)
    : [];
  return `
    <div class="glass-card p-5 mt-4">
      <div class="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 class="text-lg font-bold text-white">💰 Earnings & withdrawals</h3>
          <p class="text-xs text-slate-400 mt-1">Withdrawal requests reserve your balance. Payout is complete only after an admin verifies the outgoing TON transfer.</p>
        </div>
        <div class="text-right">
          <p class="text-xs text-slate-400">Available</p>
          <p class="text-xl font-bold text-emerald-400 font-mono">${formatTon(balance)} TON</p>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label class="block text-xs text-slate-400 mb-1" for="withdrawal-amount">Amount (minimum 1 TON)</label>
          <input id="withdrawal-amount" type="number" min="1" max="${Math.max(0, balance).toFixed(9)}" step="0.000000001" placeholder="1.000000000" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm" />
        </div>
        <div>
          <label class="block text-xs text-slate-400 mb-1" for="withdrawal-wallet">Destination TON wallet</label>
          <input id="withdrawal-wallet" type="text" maxlength="128" value="${escapeHtml(wallet)}" placeholder="UQ... or EQ..." class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs font-mono" />
        </div>
      </div>
      <button onclick="requestOwnerWithdrawal()" ${balance < 1 ? 'disabled' : ''} class="btn-primary w-full px-4 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40">Request withdrawal</button>
      <div id="withdrawal-request-status" class="text-xs mt-3"></div>
      ${history.length ? `<div class="mt-4 border-t border-slate-700 pt-3"><h4 class="text-sm font-semibold text-white mb-2">Recent requests</h4><div class="space-y-2">${history.map(w => `<div class="flex justify-between gap-3 text-xs bg-slate-900/50 rounded-lg p-3"><span class="text-slate-300">${formatTon(w.amount || 0)} TON</span><span class="text-slate-400">${escapeHtml(String(w.status || 'unknown'))}</span></div>`).join('')}</div></div>` : ''}
    </div>`;
}

window.requestOwnerWithdrawal = async function() {
  const amount = Number(document.getElementById('withdrawal-amount')?.value);
  const wallet_address = document.getElementById('withdrawal-wallet')?.value?.trim() || '';
  const status = document.getElementById('withdrawal-request-status');
  if (!Number.isFinite(amount) || amount < 1) {
    if (status) status.textContent = 'Minimum withdrawal is 1 TON.';
    return;
  }
  if (!wallet_address) {
    if (status) status.textContent = 'Enter the destination TON wallet.';
    return;
  }
  if (status) status.textContent = 'Submitting withdrawal request...';
  const result = await apiFetch('/api/withdrawals/request', {
    method: 'POST',
    body: JSON.stringify({ amount, wallet_address })
  }, 0);
  if (result.error) {
    if (status) status.textContent = result.error;
    Toast.error(result.error);
    return;
  }
  Toast.success('Withdrawal request submitted.');
  await window.loadOwnerDashboard();
};

// ================== ADD CHANNEL MODAL ==================
window.openAddChannelModal = function(channelId = '') {
  const modal = document.getElementById('add-channel-modal');
  if (!modal) return;
  const existing = channelId ? (window.ownerChannels || []).find(item => String(item.id) === String(channelId)) : null;
  window.currentRegisterChannelId = existing?.id || null;
  
  modal.innerHTML = `
    <div class="glass-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
      <h2 class="text-xl font-bold text-white mb-2">${existing ? 'Finish channel setup' : t('channels.add')}</h2>
      <p class="text-xs text-slate-400 mb-5">Paste the private setup invite link sent by @${escapeHtml(BOT_USERNAME)} after you added the bot as an administrator.</p>
      <div class="space-y-4">
        <div>
          <label class="text-sm text-slate-400 mb-2 block">Channel Name</label>
          <input type="text" id="add-channel-name" maxlength="100" value="${escapeHtml(existing?.channel_name || '')}" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white" placeholder="My Channel" />
        </div>
        <div>
          <label class="text-sm text-slate-400 mb-2 block">Invite Link</label>
          <input type="text" id="add-channel-link" maxlength="256" value="${escapeHtml(existing?.channel_invite_link || '')}" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white" placeholder="https://t.me/..." />
        </div>
        <div>
          <label class="text-sm text-slate-400 mb-2 block">Subscription Price (TON)</label>
          <input type="number" id="add-channel-price" step="0.000000001" min="0.000000001" max="1000000" value="${existing?.subscription_price ?? '0.1'}" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white" placeholder="1.0" />
        </div>
        <div>
          <label class="text-sm text-slate-400 mb-3 block">Subscription Duration</label>
          <div class="grid grid-cols-3 gap-2">
            <button onclick="selectDuration(7)" class="duration-btn bg-slate-800 border-2 border-slate-700 rounded-xl px-3 py-3 text-xs text-white hover:border-cyan-500 transition-all" data-days="7">1 Week</button>
            <button onclick="selectDuration(30)" class="duration-btn bg-slate-800 border-2 border-slate-700 rounded-xl px-3 py-3 text-xs text-white hover:border-cyan-500 transition-all" data-days="30">1 Month</button>
            <button onclick="selectDuration(90)" class="duration-btn bg-slate-800 border-2 border-slate-700 rounded-xl px-3 py-3 text-xs text-white hover:border-cyan-500 transition-all" data-days="90">3 Months</button>
            <button onclick="selectDuration(180)" class="duration-btn bg-slate-800 border-2 border-slate-700 rounded-xl px-3 py-3 text-xs text-white hover:border-cyan-500 transition-all" data-days="180">6 Months</button>
            <button onclick="selectDuration(365)" class="duration-btn bg-slate-800 border-2 border-slate-700 rounded-xl px-3 py-3 text-xs text-white hover:border-cyan-500 transition-all" data-days="365">1 Year</button>
            <button onclick="selectDuration(9999)" class="duration-btn bg-slate-800 border-2 border-slate-700 rounded-xl px-3 py-3 text-xs text-white hover:border-cyan-500 transition-all" data-days="9999">9,999 days</button>
          </div>
          <input type="hidden" id="add-channel-duration" value="${Number(existing?.duration_days || 30)}" />
        </div>
        <div>
          <label class="text-sm text-slate-400 mb-2 block" for="add-channel-description">Description</label>
          <textarea id="add-channel-description" maxlength="1000" rows="3" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white" placeholder="Describe what subscribers receive, how often you post, and who this community is for.">${escapeHtml(existing?.description || '')}</textarea>
          <p class="text-[11px] text-slate-500 mt-1">Up to 1,000 characters. A clear description helps visitors decide to subscribe.</p>
        </div>
        <div>
          <label class="text-sm text-slate-400 mb-2 block">Category</label>
          <select id="add-channel-category" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white">
            <option value="crypto" ${existing?.category === 'crypto' ? 'selected' : ''}>💰 Cryptocurrency</option>
            <option value="news" ${existing?.category === 'news' ? 'selected' : ''}>📰 News</option>
            <option value="education" ${existing?.category === 'education' ? 'selected' : ''}>📚 Education</option>
            <option value="entertainment" ${existing?.category === 'entertainment' ? 'selected' : ''}>🎬 Entertainment</option>
            <option value="sports" ${existing?.category === 'sports' ? 'selected' : ''}>⚽ Sports</option>
            <option value="technology" ${existing?.category === 'technology' ? 'selected' : ''}>💻 Technology</option>
            <option value="business" ${existing?.category === 'business' ? 'selected' : ''}>💼 Business</option>
            <option value="lifestyle" ${existing?.category === 'lifestyle' ? 'selected' : ''}>🌟 Lifestyle</option>
            <option value="gaming" ${existing?.category === 'gaming' ? 'selected' : ''}>🎮 Gaming</option>
            <option value="music" ${existing?.category === 'music' ? 'selected' : ''}>🎵 Music</option>
            <option value="other" ${!existing?.category || existing?.category === 'other' ? 'selected' : ''}>✨ Other</option>
          </select>
        </div>
      </div>
      <div class="flex gap-3 mt-6">
        <button onclick="closeAddChannelModal()" class="flex-1 btn-secondary px-4 py-3 rounded-xl text-sm">${t('common.cancel')}</button>
        <button onclick="submitAddChannel()" class="flex-1 btn-primary px-4 py-3 rounded-xl text-sm text-white font-semibold">${t('channels.add')}</button>
      </div>
    </div>
  `;
  
  modal.classList.remove('hidden');
  window.selectDuration(Number(existing?.duration_days || 30));
};

window.selectDuration = function(days) {
  document.getElementById('add-channel-duration').value = days;
  document.querySelectorAll('.duration-btn').forEach(btn => {
    btn.classList.remove('border-cyan-500', 'bg-cyan-500/20');
    btn.classList.add('border-slate-700');
  });
  const selectedBtn = document.querySelector(`.duration-btn[data-days="${days}"]`);
  if (selectedBtn) {
    selectedBtn.classList.remove('border-slate-700');
    selectedBtn.classList.add('border-cyan-500', 'bg-cyan-500/20');
  }
};

window.closeAddChannelModal = function() {
  document.getElementById('add-channel-modal')?.classList.add('hidden');
  window.currentRegisterChannelId = null;
};

window.submitAddChannel = async function() {
  const name = document.getElementById('add-channel-name')?.value?.trim();
  const link = document.getElementById('add-channel-link')?.value?.trim();
  const price = document.getElementById('add-channel-price')?.value;
  const duration = document.getElementById('add-channel-duration')?.value;
  const category = document.getElementById('add-channel-category')?.value;
  const description = document.getElementById('add-channel-description')?.value?.trim() || '';

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
      duration_days: parseInt(duration),
      category: category,
      description: description
    })
  }, 0);

  if (res.error) {
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

function showBotAdminRequiredDialog(errorMessage) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="glass-card p-6 max-w-md w-full border-2 border-amber-500/30">
      <div class="text-center mb-5">
        <div class="w-20 h-20 rounded-2xl bg-amber-500/20 border-2 border-amber-500/30 flex items-center justify-center mx-auto mb-4">
          <span class="text-4xl">⚠️</span>
        </div>
        <h2 class="text-xl font-bold text-white mb-2">${t('channels.bot_admin_required')}</h2>
        <p class="text-sm text-slate-300 mb-4">${escapeHtml(errorMessage)}</p>
      </div>
      
      <div class="bg-slate-800/50 rounded-xl p-4 mb-5">
        <h3 class="text-sm font-bold text-white mb-3">How to add bot as administrator:</h3>
        <ol class="text-sm text-slate-300 space-y-2 list-decimal list-inside">
          <li>Open your Telegram channel</li>
          <li>Go to Channel Settings → Administrators</li>
          <li>Click "Add Administrator"</li>
          <li>Search for your bot and select it</li>
          <li>Grant necessary permissions</li>
          <li>Click "Save" or "Done"</li>
          <li>Try adding the channel again</li>
        </ol>
      </div>
      
      <div class="flex gap-3">
        <button onclick="this.closest('.fixed').remove()" class="flex-1 btn-secondary px-4 py-3 rounded-xl text-sm">
          ${t('common.close')}
        </button>
        <button onclick="this.closest('.fixed').remove(); openAddChannelModal()" class="flex-1 btn-primary px-4 py-3 rounded-xl text-sm text-white font-semibold">
          ${t('common.retry')}
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// ================== EDIT CHANNEL MODAL ==================
window.openEditModal = async function(channelId) {
  window.currentEditChannelId = channelId;
  
  console.log('Opening edit modal for channel:', channelId);
  
  const channel = await apiFetch(`/api/channels/${channelId}`);
  if (channel.error) {
    Toast.error('Failed to load channel data');
    return;
  }
  
  console.log('Channel data loaded:', channel);
  
  let currentPrice = 0.1;
  if (channel.subscription_price) {
    const parsed = parseFloat(channel.subscription_price);
    if (!isNaN(parsed) && parsed > 0) {
      currentPrice = parsed;
    }
  }
  
  console.log('Current price to display:', currentPrice);
  
  const modal = document.createElement('div');
  modal.id = 'edit-modal-dynamic';
  modal.className = 'fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4';
  
  modal.innerHTML = `
    <div class="glass-card p-6 w-full max-w-md">
      <h2 class="text-xl font-bold text-white mb-5">${t('channels.edit')}</h2>
      <div class="space-y-4">
        <div>
          <label class="text-sm text-slate-400 mb-2 block">Channel Name</label>
          <input type="text" id="edit-channel-name" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white" readonly />
          <p class="text-xs text-slate-500 mt-1">Channel name cannot be changed</p>
        </div>
        <div>
          <label class="text-sm text-slate-400 mb-2 block">Subscription Price (TON)</label>
          <input type="number" id="edit-price" step="0.01" min="0.01" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white" />
          <p class="text-xs text-slate-500 mt-1">Enter price in TON (e.g., 1, 0.5, 2.5)</p>
          <p class="text-xs text-cyan-400 mt-1" id="price-debug">Current value: 0</p>
        </div>
        <div>
          <label class="text-sm text-slate-400 mb-2 block" for="edit-description">Channel description</label>
          <textarea id="edit-description" maxlength="1000" rows="3" class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white">${escapeHtml(channel.description || '')}</textarea>
        </div>
        <div>
          <label class="text-sm text-slate-400 mb-3 block">Subscription Duration</label>
          <div class="grid grid-cols-3 gap-2">
            <button onclick="selectEditDuration(7)" class="edit-duration-btn bg-slate-800 border-2 border-slate-700 rounded-xl px-3 py-3 text-xs text-white hover:border-cyan-500 transition-all" data-days="7">1 Week</button>
            <button onclick="selectEditDuration(30)" class="edit-duration-btn bg-slate-800 border-2 border-slate-700 rounded-xl px-3 py-3 text-xs text-white hover:border-cyan-500 transition-all" data-days="30">1 Month</button>
            <button onclick="selectEditDuration(90)" class="edit-duration-btn bg-slate-800 border-2 border-slate-700 rounded-xl px-3 py-3 text-xs text-white hover:border-cyan-500 transition-all" data-days="90">3 Months</button>
            <button onclick="selectEditDuration(180)" class="edit-duration-btn bg-slate-800 border-2 border-slate-700 rounded-xl px-3 py-3 text-xs text-white hover:border-cyan-500 transition-all" data-days="180">6 Months</button>
            <button onclick="selectEditDuration(365)" class="edit-duration-btn bg-slate-800 border-2 border-slate-700 rounded-xl px-3 py-3 text-xs text-white hover:border-cyan-500 transition-all" data-days="365">1 Year</button>
            <button onclick="selectEditDuration(9999)" class="edit-duration-btn bg-slate-800 border-2 border-slate-700 rounded-xl px-3 py-3 text-xs text-white hover:border-cyan-500 transition-all" data-days="9999">9,999 days</button>
          </div>
          <input type="hidden" id="edit-duration" value="30" />
        </div>
      </div>
      <div class="flex gap-3 mt-6">
        <button onclick="closeEditModal()" class="flex-1 btn-secondary px-4 py-3 rounded-xl text-sm">${t('common.cancel')}</button>
        <button onclick="submitEditChannel()" class="flex-1 btn-primary px-4 py-3 rounded-xl text-sm text-white font-semibold">${t('common.save')}</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const priceInput = document.getElementById('edit-price');
  const durationInput = document.getElementById('edit-duration');
  const descriptionInput = document.getElementById('edit-description');
  const channelNameInput = document.getElementById('edit-channel-name');
  const priceDebug = document.getElementById('price-debug');
  
  if (channelNameInput) {
    channelNameInput.value = channel.channel_name || '';
    console.log('Channel name set to:', channelNameInput.value);
  }
  
  if (priceInput) {
    priceInput.value = currentPrice.toString();
    console.log('✅ Price input value explicitly set to:', priceInput.value);
    
    if (priceDebug) {
      priceDebug.textContent = 'Current value: ' + currentPrice;
    }
    
    priceInput.addEventListener('input', function() {
      const newValue = this.value;
      console.log('📝 Price input changed to:', newValue);
      if (priceDebug) {
        priceDebug.textContent = 'Current value: ' + newValue;
      }
    });
    
    setTimeout(() => {
      console.log('🔍 Verification - Price input value after 100ms:', priceInput.value);
    }, 100);
  } else {
    console.error('❌ ERROR: Price input element not found!');
    Toast.error('Form error - please try again');
    return;
  }
  
  if (durationInput) {
    const currentDuration = channel.duration_days || 30;
    durationInput.value = currentDuration.toString();
    console.log('✅ Duration input value set to:', durationInput.value);
  }
  
  const currentDuration = channel.duration_days || 30;
  selectEditDuration(currentDuration);
  
  console.log('✅ Edit modal opened successfully');
  console.log('📊 Final values - Price:', priceInput?.value, 'Duration:', durationInput?.value);
};

window.selectEditDuration = function(days) {
  document.getElementById('edit-duration').value = days;
  document.querySelectorAll('.edit-duration-btn').forEach(btn => {
    btn.classList.remove('border-cyan-500', 'bg-cyan-500/20');
    btn.classList.add('border-slate-700');
  });
  const selectedBtn = document.querySelector(`.edit-duration-btn[data-days="${days}"]`);
  if (selectedBtn) {
    selectedBtn.classList.remove('border-slate-700');
    selectedBtn.classList.add('border-cyan-500', 'bg-cyan-500/20');
  }
};

window.closeEditModal = function() {
  const modal = document.getElementById('edit-modal-dynamic');
  if (modal) {
    modal.remove();
    console.log('✅ Edit modal removed from DOM');
  }
};

window.submitEditChannel = async function() {
  const priceInput = document.getElementById('edit-price');
  const durationInput = document.getElementById('edit-duration');
  const descriptionInput = document.getElementById('edit-description');
  
  if (!priceInput || !durationInput) {
    Toast.error('Form elements not found');
    return;
  }
  
  let priceValue = priceInput.value;
  let durationValue = durationInput.value;
  
  if (!priceValue || priceValue.trim() === '') {
    priceValue = priceInput.getAttribute('value') || '0.1';
  }
  
  if (!durationValue || durationValue.trim() === '') {
    durationValue = durationInput.getAttribute('value') || '30';
  }
  
  const price = parseFloat(priceValue);
  const duration = parseInt(durationValue);
  
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
      duration_days: duration,
      description: descriptionInput?.value?.trim() || ''
    })
  }, 0);
  
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
  if (!confirm('Deactivate this channel? New subscriptions will stop. Existing paid subscribers keep access until their subscription ends, and financial history is preserved.')) {
    return;
  }

  const res = await apiFetch(`/api/channels/${channelId}`, {
    method: 'DELETE'
  });

  if (res.error) {
    Toast.error(res.error);
  } else {
    Toast.success('Channel deactivated. Existing subscriptions and financial history were preserved.');
    loadOwnerDashboard();
  }
};

// ================== SHARE & FORWARD ==================
window.copyShareLink = function(channelId) {
  copyToClipboard(`https://t.me/${BOT_USERNAME}?start=${channelId}`, 'Link copied!');
};

window.forwardChannelLink = function(channelId, channelName) {
  const link = `https://t.me/${BOT_USERNAME}?start=${channelId}`;
  const message = `🎯 Subscribe to "${channelName}" on MySubHub!\n\n💎 Get premium content with TON payments\n🔒 Secure and private\n✨ Easy subscription management\n\nClick here to subscribe: ${link}`;
  
  const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(message)}`;
  
  window.open(shareUrl, '_blank');
  
  Toast.success('Share dialog opened!');
};

// ================== REFERRALS ==================
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
    <div class="glass-card p-6 mb-5">
      <h3 class="text-xl font-bold text-white mb-5">${t('referrals.title')}</h3>
      <div class="bg-cyan-500/10 border-2 border-cyan-500/30 rounded-xl p-4 mb-5">
        <p class="text-sm text-cyan-300">💰 ${t('referrals.earn_10_percent')}</p>
        <p class="text-xs text-slate-400 mt-2">${t('referrals.credits_note')}</p>
      </div>
      <div class="grid grid-cols-3 gap-3 mb-5">
        <div class="bg-slate-800/50 rounded-xl p-4 text-center">
          <p class="text-xs text-slate-400 mb-1">${t('referrals.balance')}</p>
          <p class="text-xl font-bold text-emerald-400">${formatTon(stats.currentBalance || 0)} TON</p>
        </div>
        <div class="bg-slate-800/50 rounded-xl p-4 text-center">
          <p class="text-xs text-slate-400 mb-1">${t('referrals.referrals')}</p>
          <p class="text-2xl font-bold text-cyan-400">${stats.totalReferrals || 0}</p>
        </div>
        <div class="bg-slate-800/50 rounded-xl p-4 text-center">
          <p class="text-xs text-slate-400 mb-1">${t('referrals.earned')}</p>
          <p class="text-xl font-bold text-white">${formatTon(stats.totalCreditsEarned || 0)} TON</p>
        </div>
      </div>
      <div class="bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border-2 border-cyan-500/30 rounded-xl p-5">
        <p class="text-base text-slate-300 mb-3">${t('referrals.your_link')}</p>
        <div class="flex gap-3">
          <input type="text" id="referral-link" value="${escapeHtml(link)}" class="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono" readonly>
          <button onclick="copyReferralLink()" class="btn-primary px-5 py-3 rounded-xl text-sm text-white font-semibold">📋 ${t('referrals.copy_link')}</button>
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
  const reportsContainer = document.getElementById('admin-reports');
  const withdrawalsContainer = document.getElementById('admin-withdrawals');
  if (!reportsContainer && !withdrawalsContainer) return;
  if (reportsContainer) reportsContainer.innerHTML = '<div class="text-xs text-slate-500 animate-pulse">Loading reports…</div>';
  if (withdrawalsContainer) withdrawalsContainer.innerHTML = '<div class="text-xs text-slate-500 animate-pulse">Loading withdrawals…</div>';

  const [reports, withdrawals] = await Promise.all([
    apiFetch('/api/admin/reports'),
    apiFetch('/api/admin/withdrawals')
  ]);

  if (reportsContainer) {
    if (reports?.error) {
      reportsContainer.innerHTML = `<p class="text-sm text-red-300">${escapeHtml(reports.error)}</p>`;
    } else {
      const pendingReports = (Array.isArray(reports) ? reports : []).filter(report => !report.status || report.status === 'pending');
      reportsContainer.innerHTML = pendingReports.length ? pendingReports.map(report => {
        const id = String(report.id || '');
        if (!/^[0-9a-f-]{36}$/i.test(id)) return '';
        return `<article class="bg-slate-900/60 border border-slate-700 rounded-xl p-4 mb-3">
          <div class="flex items-start justify-between gap-3"><div class="min-w-0"><p class="text-sm font-semibold text-white">${escapeHtml(report.channel?.channel_name || 'Unknown channel')}</p><p class="text-xs text-slate-500 mt-1">Reported by ${escapeHtml(report.reporter?.first_name || 'User')} · ${escapeHtml(report.reason || 'Other')}</p></div><span class="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-1 rounded-full">Pending</span></div>
          ${report.description ? `<p class="text-xs text-slate-300 mt-3">${escapeHtml(report.description)}</p>` : ''}
          <div class="flex gap-2 mt-3"><button type="button" onclick="reviewAdminReport('${id}','dismiss')" class="btn-secondary px-3 py-2 rounded-lg text-xs">Dismiss</button><button type="button" onclick="reviewAdminReport('${id}','ban')" class="bg-red-500/15 text-red-300 px-3 py-2 rounded-lg text-xs">Ban channel & owner</button></div>
        </article>`;
      }).join('') : '<p class="text-sm text-slate-500">No pending reports.</p>';
    }
  }

  if (withdrawalsContainer) {
    if (withdrawals?.error) {
      withdrawalsContainer.innerHTML = `<p class="text-sm text-red-300">${escapeHtml(withdrawals.error)}</p>`;
    } else {
      const items = Array.isArray(withdrawals) ? withdrawals : [];
      withdrawalsContainer.innerHTML = items.length ? items.map(withdrawal => {
        const status = String(withdrawal.status || 'pending');
        const id = String(withdrawal.id || '');
        if (!/^[0-9a-f-]{36}$/i.test(id)) return '';
        return `<article class="bg-slate-900/60 border border-slate-700 rounded-xl p-4 mb-3">
          <div class="flex flex-wrap justify-between gap-3 mb-2"><div><p class="text-white font-semibold">${formatTon(withdrawal.amount || 0)} TON</p><p class="text-xs text-slate-400 break-all">${escapeHtml(String(withdrawal.wallet_address || ''))}</p><p class="text-[10px] text-slate-500 mt-1">Request ${escapeHtml(id)}</p></div><span class="text-xs rounded-full px-3 py-1 ${status === 'approved' ? 'bg-amber-500/10 text-amber-300' : 'bg-blue-500/10 text-blue-300'}">${escapeHtml(status)}</span></div>
          ${status === 'pending' ? `<button type="button" onclick="approveOwnerWithdrawal('${id}')" class="btn-primary px-4 py-2 rounded-lg text-xs text-white">Approve / show transfer instructions</button>` : ''}
          ${status === 'approved' ? `<p class="text-xs text-amber-300 mb-2">Approved. After sending exactly ${Number(withdrawal.amount || 0).toFixed(9)} TON, enter the outgoing TON Center transaction hash below.</p><div class="flex gap-2"><input id="payout-hash-${id}" type="text" placeholder="Outgoing transaction hash" class="flex-1 min-w-0 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono"><button type="button" onclick="completeOwnerWithdrawal('${id}')" class="btn-primary px-3 py-2 rounded-lg text-xs text-white">Verify payout</button></div>` : ''}
        </article>`;
      }).join('') : '<p class="text-sm text-slate-500">No pending or approved withdrawals.</p>';
    }
  }
};

window.reviewAdminReport = async function(reportId, action) {
  if (!window.isAdmin || !['ban', 'dismiss'].includes(action)) return;
  const confirmation = action === 'ban'
    ? 'Ban this channel and its owner? This deactivates the channel and suspends the owner.'
    : 'Dismiss this report?';
  if (!window.confirm(confirmation)) return;
  const result = await apiFetch(`/api/admin/reports/${encodeURIComponent(reportId)}/review`, {
    method: 'POST',
    body: JSON.stringify({ action })
  }, 0);
  if (result.error) { Toast.error(result.error); return; }
  Toast.success(action === 'ban' ? 'Channel and owner action completed.' : 'Report dismissed.');
  await window.loadAdminDashboard();
};

// ================== ADMIN CHANNELS LIST ==================
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
    container.innerHTML = `<div class="glass-card p-10 text-center text-slate-400">${t('channels.no_channels')}</div>`;
    return;
  }

  container.innerHTML = channels.map(ch => {
    const name = escapeHtml(ch.channel_name || 'Unknown');
    const ownerName = escapeHtml(ch.owner_name || 'Unknown');
    const price = formatTon(ch.subscription_price || 0);
    const days = ch.duration_days || 30;
    const subs = ch.active_subscribers || 0;
    const rating = ch.avg_rating || 0;

    return `
      <div class="glass-card p-5 mb-3">
        <div class="flex justify-between items-start mb-4">
          <div class="flex-1">
            <h3 class="font-semibold text-white text-lg">${name}</h3>
            <p class="text-slate-400 text-sm mt-1">Owner: ${ownerName} (@${escapeHtml(ch.owner_username || 'unknown')})</p>
            <p class="text-slate-400 text-sm mt-1">${price} TON / ${days} days • ${subs} subscribers</p>
            ${rating > 0 ? `<p class="text-yellow-400 text-sm mt-1">⭐ ${rating.toFixed(1)}/5 (${ch.review_count || 0} reviews)</p>` : ''}
          </div>
          <span class="badge ${ch.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'} px-3 py-1 rounded-full text-xs font-bold">${ch.is_active ? `● ${t('channels.active')}` : `○ ${t('channels.inactive')}`}</span>
        </div>
        <div class="flex gap-2">
          ${ch.channel_invite_link ? `<a href="${escapeHtml(ch.channel_invite_link)}" target="_blank" class="btn-secondary px-4 py-2 rounded-xl text-xs">🔗 View</a>` : ''}
        </div>
      </div>
    `;
  }).join('');
};

// ================== MODALS ==================
window.openRating = function(channelId) {
  window.currentRatingChannelId = channelId;
  window.currentRating = 0;
  const stars = document.getElementById('star-rating');
  if (stars) {
    stars.innerHTML = [1,2,3,4,5].map(value => `<button type="button" class="rating-star text-3xl text-slate-600 hover:text-amber-300 transition" data-rating="${value}" aria-label="Rate ${value} out of 5" aria-pressed="false" onclick="selectRating(${value})">★</button>`).join('');
  }
  const comment = document.getElementById('rating-comment');
  if (comment) comment.value = '';
  document.getElementById('rating-modal')?.classList.remove('hidden');
};

window.selectRating = function(value) {
  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return;
  window.currentRating = rating;
  document.querySelectorAll('.rating-star').forEach(button => {
    const selected = Number(button.dataset.rating) <= rating;
    button.classList.toggle('text-amber-300', selected);
    button.classList.toggle('text-slate-600', !selected);
    button.setAttribute('aria-pressed', String(Number(button.dataset.rating) === rating));
  });
};

window.closeRating = function() {
  document.getElementById('rating-modal')?.classList.add('hidden');
};

window.submitRating = async function() {
  if (!window.currentRating || !window.currentRatingChannelId) { Toast.error('Select a rating'); return; }
  const comment = document.getElementById('rating-comment')?.value?.trim() || '';
  if (comment.length > 1000) { Toast.error('Review must be 1,000 characters or fewer.'); return; }
  const buttons = document.querySelectorAll('#rating-modal button');
  buttons.forEach(button => button.disabled = true);
  const res = await apiFetch('/api/reviews', { method: 'POST', body: JSON.stringify({ channel_id: window.currentRatingChannelId, rating: window.currentRating, comment }) }, 0);
  buttons.forEach(button => button.disabled = false);
  if (res.error) Toast.error(res.error);
  else { Toast.success('Rating submitted!'); window.closeRating(); await window.loadSubscriptions(); }
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
  modal.innerHTML = `<div class="glass-card p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto border-2 border-slate-700"><h2 class="text-xl font-bold text-white mb-4">🔍 Diagnostic</h2><div class="space-y-3 text-sm"><div class="bg-slate-800/50 rounded-xl p-3"><span class="text-slate-400">API:</span> <span class="font-mono text-white break-all text-xs">${escapeHtml(results.apiBase)}</span></div><div class="bg-slate-800/50 rounded-xl p-3"><span class="text-slate-400">Telegram:</span> <span class="${results.hasTelegram ? 'text-emerald-400' : 'text-red-400'}">${results.hasTelegram ? '✅' : '❌'}</span></div><div class="bg-slate-800/50 rounded-xl p-3"><span class="text-slate-400">Health:</span> <span class="${results.health?.status === 'healthy' ? 'text-emerald-400' : 'text-red-400'}">${results.health?.status || results.health?.error || 'Failed'}</span></div><div class="bg-slate-800/50 rounded-xl p-3"><span class="text-slate-400">Auth:</span> <span class="${results.auth?.user ? 'text-emerald-400' : 'text-red-400'}">${results.auth?.user ? '✅ ' + escapeHtml(results.auth.user.first_name || '') : '❌ ' + escapeHtml(results.auth?.error || '')}</span></div><div class="bg-slate-800/50 rounded-xl p-3"><span class="text-slate-400">Subs:</span> <span class="${Array.isArray(results.subs) ? 'text-emerald-400' : 'text-red-400'}">${Array.isArray(results.subs) ? '✅ ' + results.subs.length : '❌ ' + escapeHtml(results.subs?.error || '')}</span></div><div class="bg-slate-800/50 rounded-xl p-3"><span class="text-slate-400">Channels:</span> <span class="${Array.isArray(results.channels) ? 'text-emerald-400' : 'text-red-400'}">${Array.isArray(results.channels) ? '✅ ' + results.channels.length : '❌ ' + escapeHtml(results.channels?.error || '')}</span></div></div><button onclick="this.closest('.fixed').remove()" class="btn-primary w-full mt-4 py-3 rounded-xl text-white font-semibold text-sm">${t('common.close')}</button></div>`;
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
    el.innerHTML = `<div class="flex items-center gap-2"><span class="text-emerald-400">✓</span><span class="text-xs text-white font-mono">${escapeHtml(addr.substring(0, 6) + '...' + addr.substring(addr.length - 4))}</span><button onclick="disconnectWallet()" class="text-xs text-red-400 hover:text-red-300">✕</button></div>`;
  } else {
    el.innerHTML = `<button onclick="connectWallet()" class="btn-primary px-4 py-2 rounded-xl text-xs text-white font-semibold">${t('purchase.pay_with_ton')}</button>`;
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
                  <li>Use the Discover tab to browse all channels</li>
                  <li>Search by name or filter by category</li>
                  <li>Sort by popularity, rating, or price</li>
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
                <div class="mt-3 p-3 bg-blue-500/10 border-2 border-blue-500/30 rounded-xl">
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
                <div class="mt-3 p-3 bg-amber-500/10 border-2 border-amber-500/30 rounded-xl">
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
                  <li>Click "Add Channel"</li>
                  <li>Fill in channel details:
                    <ul class="ml-4 mt-1 space-y-1">
                      <li>• Channel name</li>
                      <li>• Invite link</li>
                      <li>• Subscription price (in TON)</li>
                      <li>• Duration (1 week to unlimited)</li>
                      <li>• Category</li>
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
                  <li>Payments go to platform wallet (escrow)</li>
                  <li>Track earnings in dashboard</li>
                  <li>Request withdrawals anytime</li>
                  <li>Minimum withdrawal: 1 TON</li>
                </ul>
                <div class="mt-3 p-3 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-xl">
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
                <div class="mt-3 p-3 bg-blue-500/10 border-2 border-blue-500/30 rounded-xl">
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
    
    const discoverTab = document.getElementById('nav-discover');
    if (discoverTab) discoverTab.style.setProperty('display', 'flex', 'important');

    // Initial unread count is included in /api/auth/validate, avoiding a separate
    // Edge Function invocation at startup. Refresh only when returning to foreground.

    const urlStart = new URLSearchParams(window.location.search).get('startapp') || new URLSearchParams(window.location.search).get('start');
    const startParam = TG.initDataUnsafe?.start_param || urlStart;

    if (startParam && /^[0-9a-fA-F-]{36}$/.test(startParam)) {
      await loadPurchasePage(startParam);
      window.switchPage('purchase');
    } else if (startParam === 'help-subscriber') {
      showSubscriberGuide();
    } else if (startParam === 'help-owner') {
      showOwnerGuide();
    } else if (startParam === 'discover') {
      window.switchPage('discover');
    } else if (startParam === 'owner') {
      window.switchPage('owner');
    } else if (startParam === 'admin' && window.isAdmin) {
      window.switchPage('admin');
    } else if (startParam === 'admin-channels' && window.isAdmin) {
      window.switchPage('admin-channels');
    } else if (startParam === 'referral') {
      window.switchPage('referrals');
    } else {
      window.switchPage('discover'); // Default to discover page
    }
  } catch (error) {
    console.error('Init error:', error);
    window.switchPage('subscriptions');
  }
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) window.loadNotifications?.(false);
});
window.addEventListener('focus', () => window.loadNotifications?.(false));
window.addEventListener('load', () => { init(); }, { once: true });
console.log('MySubHub app.js v3.5.1 - low-resource marketplace UX release');
console.log('Language:', currentLanguage);
