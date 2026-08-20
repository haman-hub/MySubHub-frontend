// translations.js
const translations = {
  en: { ... }, // (all the English translations as before)
  fa: { ... }, // (Persian)
  hi: { ... }, // (Hindi)
  ru: { ... }, // (Russian)
  ar: { ... }, // (Arabic)
  zh: { ... }, // (Chinese)
  id: { ... }, // (Indonesian)
  "pt-BR": { ... }, // (Brazilian Portuguese)
  tr: { ... } // (Turkish)
};

// Language management
let currentLanguage = null;

function getLanguage() {
  if (currentLanguage) return currentLanguage;
  const lang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code;
  if (lang && translations[lang]) return lang;
  if (lang === 'pt' || lang === 'pt-br') return 'pt-BR';
  return 'en';
}

function setLanguage(lang) {
  if (translations[lang]) {
    currentLanguage = lang;
    localStorage.setItem('selectedLanguage', lang);
    applyTranslations();
    const isRTL = (lang === 'ar' || lang === 'fa');
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
    if (typeof window.refreshCurrentPage === 'function') {
      window.refreshCurrentPage();
    }
  }
}

function t(key) {
  const lang = getLanguage();
  return translations[lang]?.[key] || translations['en'][key] || key;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  const lang = getLanguage();
  const isRTL = (lang === 'ar' || lang === 'fa');
  document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', lang);
}

// Load saved language from localStorage
const savedLang = localStorage.getItem('selectedLanguage');
if (savedLang && translations[savedLang]) {
  currentLanguage = savedLang;
}
