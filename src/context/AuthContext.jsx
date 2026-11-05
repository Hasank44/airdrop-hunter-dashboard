import { createContext, useContext, useState, useCallback } from 'react';
import { api, setTokens, clearTokens, hasAuth } from '../lib/api';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
    const [authed, setAuthed] = useState(hasAuth());
    const [user, setUser] = useState(() => {
        try { return JSON.parse(localStorage.getItem('ah_user') || 'null'); } catch { return null; }
    });

    const login = useCallback(async (email, password, totp) => {
        const payload = { email, password };
        if (totp) payload.totp = totp;
        const res = await api.post('/auth/login', payload);
        setTokens(res.data.accessToken, res.data.refreshToken);
        localStorage.setItem('ah_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        setAuthed(true);
        return res.data;
    }, []);

    const logout = useCallback(async () => {
        const rt = localStorage.getItem('ah_rt');
        if (rt) { try { await api.post('/auth/logout', { refreshToken: rt }); } catch { /* ignore */ } }
        clearTokens();
        localStorage.removeItem('ah_user');
        setUser(null);
        setAuthed(false);
    }, []);

    return <Ctx.Provider value={{ authed, user, login, logout }}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const v = useContext(Ctx);
    if (!v) throw new Error('useAuth outside AuthProvider');
    return v;
};