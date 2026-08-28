/**
 * Camada de acesso à API do back-end match.IA (Arkitetum.AI — Node/Express + MongoDB).
 * Repositório de referência: https://github.com/RobPFilho/Arkitetum.AI
 *
 * Por padrão aponta para http://localhost:3000/api (`npm run dev` no back-end).
 * Pode ser sobrescrito salvando outra URL em localStorage("matchia_api_base"),
 * útil quando o back-end estiver publicado (Render, Railway etc.).
 */
const MatchAPI = (() => {
  const DEFAULT_BASE = 'http://localhost:3000/api';

  function base() {
    return localStorage.getItem('matchia_api_base') || DEFAULT_BASE;
  }
  function setBase(url) {
    if (url) localStorage.setItem('matchia_api_base', url.replace(/\/+$/, ''));
  }
  function token() {
    return localStorage.getItem('matchia_token');
  }
  function setSession(token, user) {
    localStorage.setItem('matchia_token', token);
    localStorage.setItem('matchia_user', JSON.stringify(user));
  }
  function clearSession() {
    localStorage.removeItem('matchia_token');
    localStorage.removeItem('matchia_user');
  }
  function currentUser() {
    try { return JSON.parse(localStorage.getItem('matchia_user') || 'null'); }
    catch { return null; }
  }

  async function request(path, { method = 'GET', body, auth = false } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth) {
      const t = token();
      if (!t) throw { offline: false, status: 401, message: 'Faça login para continuar.' };
      headers.Authorization = `Bearer ${t}`;
    }
    let res;
    try {
      res = await fetch(`${base()}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (networkError) {
      throw { offline: true, status: 0, message: 'Não foi possível conectar à API do match.IA.' };
    }
    let data = null;
    try { data = await res.json(); } catch { /* sem corpo */ }
    if (!res.ok) {
      throw { offline: false, status: res.status, message: (data && data.error) || 'Erro inesperado na API.' };
    }
    return data;
  }

  return {
    base, setBase, token, setSession, clearSession, currentUser,
    health: () => request('/health'),
    registerClient: (payload) => request('/auth/register/client', { method: 'POST', body: payload }),
    registerArchitect: (payload) => request('/auth/register/architect', { method: 'POST', body: payload }),
    login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
    me: () => request('/dashboard/me', { auth: true }),
    updateMe: (payload) => request('/dashboard/me', { method: 'PATCH', auth: true, body: payload }),
    addPortfolio: (payload) => request('/dashboard/portfolio', { method: 'POST', auth: true, body: payload }),
    deletePortfolio: (id) => request(`/dashboard/portfolio/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }),
    materials: () => request('/materials'),
    architect: (id) => request(`/architects/${id}`),
    runMatch: () => request('/matches/run', { method: 'POST', auth: true }),
  };
})();
