const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

let accessToken = localStorage.getItem('ah_at') || '';
let refreshToken = localStorage.getItem('ah_rt') || '';
let refreshing = null;

export function setTokens(at, rt) {
    accessToken = at || '';
    refreshToken = rt || '';
    if (at) localStorage.setItem('ah_at', at); else localStorage.removeItem('ah_at');
    if (rt) localStorage.setItem('ah_rt', rt); else localStorage.removeItem('ah_rt');
}

export function clearTokens() {
    accessToken = '';
    refreshToken = '';
    localStorage.removeItem('ah_at');
    localStorage.removeItem('ah_rt');
}

export function hasAuth() {
    return Boolean(accessToken);
}

async function doRefresh() {
    if (!refreshToken) return false;
    try {
        const res = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) return false;
        const json = await res.json();
        if (!json.success) return false;
        setTokens(json.data.accessToken, json.data.refreshToken);
        return true;
    } catch {
        return false;
    }
}

async function apiFetch(path, opts = {}, retry = true) {
    const res = await fetch(`${API_URL}${path}`, {
        ...opts,
        headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            ...(opts.headers || {}),
        },
    });

    if (res.status === 401 && retry && refreshToken) {
        if (!refreshing) refreshing = doRefresh().finally(() => { refreshing = null; });
        const ok = await refreshing;
        if (ok) return apiFetch(path, opts, false);
        clearTokens();
        throw new Error('Session expired. Please log in again.');
    }

    let body = {};
    try { body = await res.json(); } catch { /* empty body */ }

    if (!res.ok || body.success === false) {
        const msg = body?.error?.message || body?.message || `Request failed (${res.status})`;
        const err = new Error(msg);
        err.code = body?.error?.code;
        err.details = body?.error?.details;
        err.status = res.status;
        throw err;
    }
    return body;
}

export const api = {
    get: (p) => apiFetch(p, { method: 'GET' }),
    post: (p, b) => apiFetch(p, { method: 'POST', body: b !== undefined ? JSON.stringify(b) : undefined }),
    put: (p, b) => apiFetch(p, { method: 'PUT', body: JSON.stringify(b) }),
    patch: (p, b) => apiFetch(p, { method: 'PATCH', body: JSON.stringify(b) }),
    del: (p) => apiFetch(p, { method: 'DELETE' }),
};