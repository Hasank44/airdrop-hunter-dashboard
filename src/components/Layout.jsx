import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { LayoutDashboard, Sparkles, Rss, ListChecks, Wallet, Gift, Coins, Tag, BarChart3, Bell, Settings as SettingsIcon, Activity, LogOut, Menu, X, ExternalLink } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { Button } from './UI';

const NAV = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/airdrops', label: 'Airdrops', icon: Sparkles },
    { to: '/sources', label: 'Sources', icon: Rss },
    { to: '/tasks', label: 'Tasks', icon: ListChecks },
    { to: '/wallets', label: 'Wallets', icon: Wallet },
    { to: '/claims', label: 'Claims', icon: Gift },
    { to: '/earnings', label: 'Earnings & P&L', icon: Coins },
    { to: '/listings', label: 'Listings', icon: Tag },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
    { to: '/system', label: 'System', icon: Activity },
];

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    async function handleLogout() {
        await logout();
        navigate('/login', { replace: true });
    }

    return (
        <div className="flex min-h-screen">
            <aside
                className={clsx(
                    'fixed inset-y-0 left-0 z-40 w-64 border-r border-white/10 bg-black/60 backdrop-blur-xl transition-transform lg:static lg:translate-x-0',
                    open ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="flex h-14 items-center justify-between border-b border-white/10 px-3">
                    <div className="flex items-center gap-2">
                        <div className="grid h-10 w-10 place-items-center">
                            <img src="/airdrop-hunter.png" alt="logo" className=' rounded-full' />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">Airdrop Hunter</p>
                            <p className="text-[10px] uppercase tracking-widest text-gray-500">admin console</p>
                        </div>
                    </div>
                    <button className="lg:hidden text-gray-400" onClick={() => setOpen(false)}><X size={18} /></button>
                </div>
                <nav className="flex flex-col gap-1 p-3">
                    {NAV.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            onClick={() => setOpen(false)}
                            className={({ isActive }) =>
                                clsx(
                                    'flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors',
                                    isActive
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                )
                            }
                        >
                            <item.icon size={16} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="absolute bottom-10 left-0 right-0 border-t border-white/10 p-3">
                    <a
                        href="/api/v1/system/health"
                        target="_blank"
                        rel="noreferrer"
                        className="mb-2 flex items-center gap-2 rounded px-2 py-1 text-xs text-gray-500 hover:text-gray-300"
                    >
                        <ExternalLink size={12} /> system health
                    </a>
                    <div className="flex items-center justify-between gap-2 rounded-md bg-white/5 px-3 py-2">
                        <div className="min-w-0">
                            <p className="truncate text-xs text-gray-400">{user?.email ?? 'owner'}</p>
                            <p className="text-[10px] uppercase tracking-widest text-emerald-400">owner</p>
                        </div>
                        <button onClick={handleLogout} className="text-gray-400 hover:text-red-400" title="Logout">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>
            {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-white/10 bg-black/40 px-3 backdrop-blur-xl lg:px-6">
                    <button className="lg:hidden text-gray-300" onClick={() => setOpen(true)}><Menu size={20} /></button>
                    <div className="flex-1" />
                    <Button variant="ghost" size="sm" onClick={handleLogout}>
                        <LogOut size={14} /> Logout
                    </Button>
                </header>
                <main className="flex-1 p-3">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}