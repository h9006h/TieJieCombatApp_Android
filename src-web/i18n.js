(() => {
  'use strict';

  const STORAGE_KEY = 'tiejie-locale-v1';
  const SUPPORTED_LOCALES = [
    { code: 'zh-CN', name: '简体中文' },
    { code: 'zh-TW', name: '繁體中文' },
    { code: 'en', name: 'English' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'es', name: 'Español' },
    { code: 'pt', name: 'Português' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'ru', name: 'Русский' }
  ];
  const FALLBACK_LOCALE = 'en';
  const DEFAULT_LOCALE = 'zh-CN';
  const DICTIONARY = {
    'zh-CN': {
      'meta.title': '铁街格斗 · 战斗试玩',
      'auth.pass': '铁街测试通行证',
      'auth.loading': '正在验证测试资格……',
      'auth.usernamePlaceholder': '用户名（3–24位）',
      'auth.passwordPlaceholder': '密码（至少8位）',
      'auth.usernameLabel': '用户名',
      'auth.passwordLabel': '密码',
      'auth.login': '登录',
      'auth.register': '注册并进入',
      'auth.retry': '重新验证',
      'auth.note': '测试期间开放注册；正式上线后测试账号会统一清除',
      'auth.needLogin': '请登录已有账号，或注册一个新账号',
      'auth.verifyingAccount': '正在验证账号……',
      'auth.invalid': '账号授权无效，请重新登录',
      'auth.networkError': '无法连接账号服务器，请检查网络后重试',
      'auth.creating': '正在创建账号……',
      'auth.loggingIn': '正在登录……',
      'auth.operationFailed': '操作失败，请稍后重试',
      'auth.serverMissing': '账号服务器尚未配置，请联系管理员',
      'auth.reason.disabled': '此账号已被停用',
      'auth.reason.invalid-session': '登录已失效，请重新登录',
      'auth.reason.invalid-credentials': '用户名需要3–24位，密码至少8位',
      'auth.reason.login-failed': '用户名或密码错误',
      'auth.reason.username-taken': '这个用户名已经被注册',
      'auth.reason.registration-closed': '服务器当前已关闭注册',
      'auth.reason.server-error': '账号服务器暂时不可用',
      'menu.paused': 'PAUSED',
      'menu.battle': '战斗菜单',
      'menu.resume': '继续战斗',
      'menu.end': '结束本局',
      'menu.settings': '游戏设置',
      'settings.title': '设置',
      'settings.subtitle': '语言会在首次启动时自动匹配，也可以手动修改',
      'settings.languageTitle': '语言',
      'settings.languageHint': '手动选择后会覆盖自动匹配结果',
      'settings.back': '← 返回',
      'settings.battleBack': '← 返回战斗菜单',
      'settings.open': '语言与设置',
      'toggle.audio': '音乐与音效',
      'toggle.vibration': '震动反馈',
      'toggle.on': '开',
      'toggle.off': '关',
      'toggle.audioDisable': '关闭音乐和音效',
      'toggle.audioEnable': '开启音乐和音效',
      'toggle.vibrationDisable': '关闭震动',
      'toggle.vibrationEnable': '开启震动',
      'start.slogan': '先试手感，再决定长线内容。',
      'start.stage': '继续第 {stage} 关',
      'start.settings': '设置',
      'start.level': '选择关卡',
      'start.recruit': '招募队友',
      'start.skill': '技能',
      'start.rank': '闯关排行榜',
      'start.feedback': '意见反馈',
      'stage.locked': '尚未解锁',
      'stage.page': '第 {first}–{last} 关 · 当前 {current}',
      'stage.item': '第 {stage} 关 · {name}',
      'rank.unavailable': '排行榜暂时无法打开，请稍后重试',
      'feedback.unavailable': '反馈入口暂时无法打开，请稍后重试',
      'reward.settlement': '关卡结算',
      'reward.settlementDesc': '第 {stage} 关 · {name} 已清理完毕',
      'stage.enter': '进入第 {stage} 关',
      'hud.stageProgress': '第 {stage} 关 · 路段 {gate}/{total}',
      'hud.freeTour': '自由游览 · 第 {stage} 关',
      'hud.gauntlet': '{elite}测试轮战 {current} / {total}',
      'hud.gauntletElite': '精英',
      'hud.tempSupport': ' · 临时支援 {seconds}秒',
      'hud.killLine': '击倒 {kills} · 队友 {alive}/{total}{temp} · 最高 {best} 关',
      'hud.freeTourLine': '队友 {count} · 敌人关闭',
      'settings.current': '当前：{name}',
      'settings.applied': '已生效',
      'ad.debugTest': '手动测试',
      'ad.testing': '测试中…',
      'ad.none': '暂无',
      'ad.emptyLog': '还没有广告调用记录。'
    },
    'zh-TW': {
      'meta.title': '鐵街格鬥 · 戰鬥試玩',
      'auth.pass': '鐵街測試通行證',
      'auth.loading': '正在驗證測試資格……',
      'auth.usernamePlaceholder': '使用者名稱（3–24位）',
      'auth.passwordPlaceholder': '密碼（至少8位）',
      'auth.usernameLabel': '使用者名稱',
      'auth.passwordLabel': '密碼',
      'auth.login': '登入',
      'auth.register': '註冊並進入',
      'auth.retry': '重新驗證',
      'auth.note': '測試期間開放註冊；正式上線後測試帳號會統一清除',
      'auth.needLogin': '請登入已有帳號，或註冊一個新帳號',
      'auth.verifyingAccount': '正在驗證帳號……',
      'auth.invalid': '帳號授權無效，請重新登入',
      'auth.networkError': '無法連線帳號伺服器，請檢查網路後重試',
      'auth.creating': '正在建立帳號……',
      'auth.loggingIn': '正在登入……',
      'auth.operationFailed': '操作失敗，請稍後再試',
      'auth.serverMissing': '帳號伺服器尚未配置，請聯絡管理員',
      'auth.reason.disabled': '此帳號已被停用',
      'auth.reason.invalid-session': '登入已失效，請重新登入',
      'auth.reason.invalid-credentials': '使用者名稱需要 3–24 位，密碼至少 8 位',
      'auth.reason.login-failed': '使用者名稱或密碼錯誤',
      'auth.reason.username-taken': '這個使用者名稱已被註冊',
      'auth.reason.registration-closed': '伺服器目前已關閉註冊',
      'auth.reason.server-error': '帳號伺服器暫時不可用',
      'menu.paused': 'PAUSED',
      'menu.battle': '戰鬥選單',
      'menu.resume': '繼續戰鬥',
      'menu.end': '結束本局',
      'menu.settings': '遊戲設定',
      'settings.title': '設定',
      'settings.subtitle': '語言會在首次啟動時自動匹配，也可以手動修改',
      'settings.languageTitle': '語言',
      'settings.languageHint': '手動選擇後會覆蓋自動匹配結果',
      'settings.back': '← 返回',
      'settings.battleBack': '← 返回戰鬥選單',
      'settings.open': '語言與設定',
      'toggle.audio': '音樂與音效',
      'toggle.vibration': '震動回饋',
      'toggle.on': '開',
      'toggle.off': '關',
      'toggle.audioDisable': '關閉音樂與音效',
      'toggle.audioEnable': '開啟音樂與音效',
      'toggle.vibrationDisable': '關閉震動',
      'toggle.vibrationEnable': '開啟震動',
      'start.slogan': '先試手感，再決定長線內容。',
      'start.stage': '繼續第 {stage} 關',
      'start.settings': '設定',
      'start.level': '選擇關卡',
      'start.recruit': '招募隊友',
      'start.skill': '技能',
      'start.rank': '闖關排行榜',
      'start.feedback': '意見回饋',
      'stage.locked': '尚未解鎖',
      'stage.page': '第 {first}–{last} 關 · 當前 {current}',
      'stage.item': '第 {stage} 關 · {name}',
      'rank.unavailable': '排行榜暫時無法開啟，請稍後再試',
      'feedback.unavailable': '回饋入口暫時無法開啟，請稍後再試',
      'reward.settlement': '關卡結算',
      'reward.settlementDesc': '第 {stage} 關 · {name} 已清理完畢',
      'stage.enter': '進入第 {stage} 關',
      'hud.stageProgress': '第 {stage} 關 · 路段 {gate}/{total}',
      'hud.freeTour': '自由遊覽 · 第 {stage} 關',
      'hud.gauntlet': '{elite}測試輪戰 {current} / {total}',
      'hud.gauntletElite': '精英',
      'hud.tempSupport': ' · 臨時支援 {seconds}秒',
      'hud.killLine': '擊倒 {kills} · 隊友 {alive}/{total}{temp} · 最高 {best} 關',
      'hud.freeTourLine': '隊友 {count} · 敵人關閉',
      'settings.current': '當前：{name}',
      'settings.applied': '已生效',
      'ad.debugTest': '手動測試',
      'ad.testing': '測試中…',
      'ad.none': '暫無',
      'ad.emptyLog': '還沒有廣告呼叫記錄。'
    },
    'en': {
      'meta.title': 'TieJie Combat · Battle Demo',
      'auth.pass': 'TieJie Test Pass',
      'auth.loading': 'Verifying test access...',
      'auth.usernamePlaceholder': 'Username (3-24 chars)',
      'auth.passwordPlaceholder': 'Password (min 8 chars)',
      'auth.usernameLabel': 'Username',
      'auth.passwordLabel': 'Password',
      'auth.login': 'Log In',
      'auth.register': 'Register & Enter',
      'auth.retry': 'Retry',
      'auth.note': 'Registration is open during testing; all test accounts will be cleared before launch',
      'auth.needLogin': 'Please log in with an existing account or register a new one.',
      'auth.verifyingAccount': 'Verifying account...',
      'auth.invalid': 'Account authorization is invalid. Please log in again.',
      'auth.networkError': 'Cannot reach the account server. Please check your network and try again.',
      'auth.creating': 'Creating account...',
      'auth.loggingIn': 'Logging in...',
      'auth.operationFailed': 'Operation failed. Please try again later.',
      'auth.serverMissing': 'The account server is not configured yet. Please contact the administrator.',
      'auth.reason.disabled': 'This account has been disabled',
      'auth.reason.invalid-session': 'Session expired. Please log in again.',
      'auth.reason.invalid-credentials': 'Username must be 3-24 characters, password at least 8 characters.',
      'auth.reason.login-failed': 'Incorrect username or password',
      'auth.reason.username-taken': 'This username is already registered',
      'auth.reason.registration-closed': 'Registration is currently closed',
      'auth.reason.server-error': 'Account server is temporarily unavailable',
      'menu.paused': 'PAUSED',
      'menu.battle': 'Battle Menu',
      'menu.resume': 'Resume',
      'menu.end': 'End Run',
      'menu.settings': 'Settings',
      'settings.title': 'Settings',
      'settings.subtitle': 'Language is auto-matched on first launch and can also be changed manually',
      'settings.languageTitle': 'Language',
      'settings.languageHint': 'Manual selection overrides auto-detection',
      'settings.back': '← Back',
      'settings.battleBack': '← Back to Battle Menu',
      'settings.open': 'Language & Settings',
      'toggle.audio': 'Music & SFX',
      'toggle.vibration': 'Vibration',
      'toggle.on': 'On',
      'toggle.off': 'Off',
      'toggle.audioDisable': 'Turn off music and sound effects',
      'toggle.audioEnable': 'Turn on music and sound effects',
      'toggle.vibrationDisable': 'Turn off vibration',
      'toggle.vibrationEnable': 'Turn on vibration',
      'start.slogan': 'Test the feel first, then decide the long-term content.',
      'start.stage': 'Continue Stage {stage}',
      'start.settings': 'Settings',
      'start.level': 'Stage Select',
      'start.recruit': 'Recruit Allies',
      'start.skill': 'Skills',
      'start.rank': 'Leaderboard',
      'start.feedback': 'Feedback',
      'stage.locked': 'Locked',
      'stage.page': 'Stages {first}-{last} · Current {current}',
      'stage.item': 'Stage {stage} · {name}',
      'rank.unavailable': 'Leaderboard is temporarily unavailable. Please try again later.',
      'feedback.unavailable': 'Feedback is temporarily unavailable. Please try again later.',
      'reward.settlement': 'Stage Results',
      'reward.settlementDesc': 'Stage {stage} · {name} cleared',
      'stage.enter': 'Enter Stage {stage}',
      'hud.stageProgress': 'Stage {stage} · Section {gate}/{total}',
      'hud.freeTour': 'Free Tour · Stage {stage}',
      'hud.gauntlet': '{elite}Test Gauntlet {current} / {total}',
      'hud.gauntletElite': 'Elite ',
      'hud.tempSupport': ' · Temp Support {seconds}s',
      'hud.killLine': 'KOs {kills} · Allies {alive}/{total}{temp} · Best {best}',
      'hud.freeTourLine': 'Allies {count} · Enemies Off',
      'settings.current': 'Current: {name}',
      'settings.applied': 'Applied',
      'ad.debugTest': 'Test',
      'ad.testing': 'Testing...',
      'ad.none': 'None',
      'ad.emptyLog': 'No ad calls yet.'
    }
  };

  const aliasMap = {
    zh: 'zh-CN',
    'zh-hans': 'zh-CN',
    'zh-cn': 'zh-CN',
    'zh-sg': 'zh-CN',
    'zh-hant': 'zh-TW',
    'zh-tw': 'zh-TW',
    'zh-hk': 'zh-TW',
    en: 'en',
    'en-us': 'en',
    'en-gb': 'en',
    ja: 'ja',
    'ja-jp': 'ja',
    ko: 'ko',
    'ko-kr': 'ko',
    es: 'es',
    'es-es': 'es',
    'es-mx': 'es',
    pt: 'pt',
    'pt-br': 'pt',
    'pt-pt': 'pt',
    fr: 'fr',
    'fr-fr': 'fr',
    de: 'de',
    'de-de': 'de',
    ru: 'ru',
    'ru-ru': 'ru'
  };

  ['ja', 'ko', 'es', 'pt', 'fr', 'de', 'ru'].forEach(code => {
    DICTIONARY[code] = DICTIONARY.en;
  });

  function normalizeLocale(locale) {
    const raw = String(locale || '').trim();
    if (!raw) return DEFAULT_LOCALE;
    const lower = raw.toLowerCase();
    return aliasMap[lower] || aliasMap[lower.split('-')[0]] || DEFAULT_LOCALE;
  }

  function detectLocale() {
    const languages = Array.isArray(navigator.languages) && navigator.languages.length ? navigator.languages : [navigator.language];
    for (const locale of languages) {
      const normalized = normalizeLocale(locale);
      if (normalized) return normalized;
    }
    return DEFAULT_LOCALE;
  }

  function getMessages(locale) {
    return DICTIONARY[normalizeLocale(locale)] || DICTIONARY[FALLBACK_LOCALE];
  }

  function format(template, params = {}) {
    return String(template).replace(/\{(\w+)\}/g, (_, key) => params[key] ?? '');
  }

  let locale = DEFAULT_LOCALE;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    locale = stored ? normalizeLocale(stored) : detectLocale();
    if (!stored) localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    locale = detectLocale();
  }
  let activeMessages = getMessages(locale);
  const fallbackMessages = getMessages(FALLBACK_LOCALE);
  const defaultMessages = getMessages(DEFAULT_LOCALE);

  function t(key, params) {
    const template = activeMessages[key] ?? fallbackMessages[key] ?? defaultMessages[key] ?? key;
    return params ? format(template, params) : String(template);
  }

  function applyDom(root = document) {
    root.querySelectorAll('[data-i18n]').forEach(node => {
      node.textContent = t(node.dataset.i18n);
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach(node => {
      node.setAttribute('placeholder', t(node.dataset.i18nPlaceholder));
    });
    root.querySelectorAll('[data-i18n-aria-label]').forEach(node => {
      node.setAttribute('aria-label', t(node.dataset.i18nAriaLabel));
    });
    root.querySelectorAll('[data-i18n-title]').forEach(node => {
      node.setAttribute('title', t(node.dataset.i18nTitle));
    });
    document.documentElement.lang = locale;
    document.title = t('meta.title');
  }

  function setLocale(nextLocale) {
    const normalized = normalizeLocale(nextLocale);
    if (normalized === locale) return normalized;
    locale = normalized;
    activeMessages = getMessages(locale);
    try { localStorage.setItem(STORAGE_KEY, locale); } catch {}
    applyDom(document);
    window.dispatchEvent(new CustomEvent('tiejie-locale-changed', { detail: { locale } }));
    return locale;
  }

  function getLocale() {
    return locale;
  }

  function localeName(code) {
    return SUPPORTED_LOCALES.find(item => item.code === code)?.name || code;
  }

  window.TieJieI18n = {
    applyDom,
    getLocale,
    localeName,
    setLocale,
    supportedLocales: SUPPORTED_LOCALES,
    t
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => applyDom(document), { once: true });
  } else {
    applyDom(document);
  }
})();
