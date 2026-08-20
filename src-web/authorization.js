(() => {
  'use strict';

  const config = window.TieJieAuthConfig || {};
  const tr = (key, fallback) => window.TieJieI18n?.t?.(key) || fallback;
  const TOKEN_KEY = 'tiejie-auth-token-v2';
  const GRANT_KEY = 'tiejie-auth-grant-v2';
  let resolveReady;
  let readyResolved = false;
  const authorization = {
    ready: new Promise(resolve => { resolveReady = resolve; }),
    allowed: false,
    mode: 'normal',
    username: '',
    displayName: '',
  };

  window.TieJieAuthorization = authorization;

  const getStored = key => {
    try { return localStorage.getItem(key) || ''; } catch { return ''; }
  };
  const setStored = (key, value) => {
    try { localStorage.setItem(key, value); } catch {}
  };
  const removeStored = key => {
    try { localStorage.removeItem(key); } catch {}
  };
  const elements = () => ({
    gate: document.querySelector('#auth-gate'),
    status: document.querySelector('#auth-status'),
    form: document.querySelector('#auth-form'),
    username: document.querySelector('#auth-username'),
    password: document.querySelector('#auth-password'),
    login: document.querySelector('#auth-login'),
    register: document.querySelector('#auth-register'),
    retry: document.querySelector('#auth-retry'),
  });
  const reasonMessages = {
    disabled: '此账号已被停用',
    'invalid-session': '登录已失效，请重新登录',
    'invalid-credentials': '用户名需要3–24位，密码至少8位',
    'login-failed': '用户名或密码错误',
    'username-taken': '这个用户名已经被注册',
    'registration-closed': '服务器当前已关闭注册',
    'too-many-attempts': '登录失败次数过多，请15分钟后重试',
    'server-error': '账号服务器暂时不可用',
  };

  function showGate(message, { form = false, retry = false } = {}) {
    const view = elements();
    if (view.gate) view.gate.hidden = false;
    if (view.status) view.status.textContent = message;
    if (view.form) view.form.hidden = !form;
    if (view.retry) view.retry.hidden = !retry;
  }

  function allow(result, offline = false) {
    authorization.allowed = true;
    authorization.mode = result.mode === 'test' ? 'test' : 'normal';
    authorization.username = result.username || '';
    authorization.displayName = result.displayName || result.username || '';
    authorization.offline = offline;
    const view = elements();
    if (view.gate) view.gate.hidden = true;
    if (!readyResolved) {
      readyResolved = true;
      resolveReady(authorization);
    }
  }

  async function request(path, body, token = '') {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`${String(config.apiBaseUrl).replace(/\/$/, '')}${path}`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...body, clientVersion: config.clientVersion || '' }),
      });
      let result = {};
      try { result = await response.json(); } catch {}
      return { response, result };
    } finally {
      clearTimeout(timeout);
    }
  }

  async function authorizedPost(path, body = {}) {
    const token = getStored(TOKEN_KEY);
    if (!token) return { ok: false, reason: 'invalid-session' };
    try {
      const { response, result } = await request(path, body, token);
      return { ...result, ok: response.ok && result.ok !== false, status: response.status };
    } catch {
      return { ok: false, reason: 'network-error' };
    }
  }

  authorization.api = Object.freeze({ post: authorizedPost });

  async function verify() {
    const token = getStored(TOKEN_KEY);
    if (!token) {
      showGate(tr('authPrompt', '请登录已有账号，或注册一个新账号'), { form: true });
      return false;
    }
    showGate(tr('authVerifying', '正在验证账号……'));
    try {
      const { response, result } = await request('/v1/verify', {}, token);
      if (response.ok && result.allowed) {
        allow(result);
        return true;
      }
      removeStored(TOKEN_KEY);
      removeStored(GRANT_KEY);
      showGate(reasonMessages[result.reason] || '账号授权无效，请重新登录', { form: true });
      return false;
    } catch {
      showGate(tr('authNetwork', '无法连接账号服务器，请检查网络后重试'), { retry: true });
      return false;
    }
  }

  async function submit(path) {
    const view = elements();
    const username = view.username?.value.trim() || '';
    const password = view.password?.value || '';
    if (username.length < 3 || username.length > 24 || password.length < 8) {
      showGate(reasonMessages['invalid-credentials'], { form: true });
      return;
    }
    if (view.login) view.login.disabled = true;
    if (view.register) view.register.disabled = true;
    showGate(path === '/v1/register' ? tr('authCreating', '正在创建账号……') : tr('authLoggingIn', '正在登录……'));
    try {
      const { response, result } = await request(path, { username, password });
      if (!response.ok || !result.allowed || !result.token) {
        showGate(reasonMessages[result.reason] || '操作失败，请稍后重试', { form: true });
        return;
      }
      setStored(TOKEN_KEY, result.token);
      allow(result);
    } catch {
      showGate(tr('authNetwork', '无法连接账号服务器，请检查网络后重试'), { form: true });
    } finally {
      if (view.login) view.login.disabled = false;
      if (view.register) view.register.disabled = false;
    }
  }

  function bindControls() {
    const view = elements();
    view.form?.addEventListener('submit', event => {
      event.preventDefault();
      submit('/v1/register');
    });
    view.login?.addEventListener('click', () => submit('/v1/login'));
    view.retry?.addEventListener('click', () => verify());
  }

  async function start() {
    removeStored(GRANT_KEY);
    bindControls();
    if (config.apiBaseUrl && !config.apiBaseUrl.includes('REPLACE_')) {
      await verify();
      setInterval(async () => {
        if (authorization.allowed && !(await verify())) {
          authorization.allowed = false;
          window.dispatchEvent(new CustomEvent('tiejie-authorization-revoked'));
        }
      }, 21600000);
    } else {
      showGate(tr('authUnconfigured', '账号服务器尚未配置，请联系管理员'));
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
