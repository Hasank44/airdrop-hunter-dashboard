export const fmtUSD = (n) =>
    n == null ? '—' : `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtNum = (n) => (n == null ? '—' : Number(n).toLocaleString('en-US'));

export const fmtDate = (d) => {
    if (!d) return '—';
    try {
        const dt = new Date(d);
        return dt.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' });
    } catch { return String(d); }
};

export const fmtDay = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-GB'); } catch { return String(d); }
};

export const fmtRelative = (d) => {
    if (!d) return '—';
    const diff = Date.now() - new Date(d).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
};

export const truncate = (s, n = 40) => (s && s.length > n ? s.slice(0, n) + '…' : s);