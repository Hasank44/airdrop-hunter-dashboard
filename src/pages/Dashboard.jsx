import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { fmtUSD, fmtNum } from '../lib/format';
import { Spinner, ErrorBox } from '../components/UI';
import {
    Sparkles, AlertTriangle, Clock, Gift, Coins, TrendingUp, TrendingDown, Rss,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function Stat({ icon: Icon, label, value, tone = 'default' }) {
    const tones = {
        default: 'text-gray-400',
        green: 'text-emerald-400',
        red: 'text-red-400',
        amber: 'text-amber-400',
        blue: 'text-blue-400',
        purple: 'text-purple-400',
    };
    return (
        <div className="card p-4">
            <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
                <Icon size={16} className={tones[tone]} />
            </div>
            <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
        </div>
    );
}

export default function Dashboard() {
    const summary = useQuery({
        queryKey: ['dashboard'],
        queryFn: () => api.get('/dashboard'),
        refetchInterval: 60_000,
    });
    const sources = useQuery({
        queryKey: ['sources-health'],
        queryFn: () => api.get('/analytics/source-health'),
        refetchInterval: 120_000,
    });

    if (summary.isLoading) return <Spinner label="Loading dashboard…" />;
    if (summary.isError) return <ErrorBox error={summary.error} />;

    const d = summary.data?.data ?? {};
    const monthly = d.monthlyChart ?? [];
    const sourceList = sources.data?.data ?? [];

    return (
        <div className="space-y-3">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-white">Overview</h1>
                    {/* <p className="text-sm text-gray-400">Live snapshot of your airdrop pipeline</p> */}
                </div>
                <Link to="/airdrops" className="btn-secondary">
                    <Sparkles size={14} /> Browse airdrops
                </Link>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat icon={Sparkles} label="Total Projects" value={fmtNum(d.totalProjects)} />
                <Stat icon={Rss} label="Active Opportunities" value={fmtNum(d.activeOpportunities)} tone="green" />
                <Stat icon={AlertTriangle} label="High Risk" value={fmtNum(d.highRisk)} tone="red" />
                <Stat icon={Clock} label="Tasks Due" value={fmtNum(d.tasksDue)} tone="amber" />
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat icon={Gift} label="Claims Available" value={fmtNum(d.claimsAvailable)} tone="blue" />
                <Stat icon={Coins} label="Total Earned" value={fmtUSD(d.earnedUsd)} tone="green" />
                <Stat icon={TrendingDown} label="Total Spent" value={fmtUSD(d.spentUsd)} tone="red" />
                <Stat icon={TrendingUp} label="Realized P&L" value={fmtUSD(d.realizedPnlUsd)} tone={d.realizedPnlUsd >= 0 ? 'green' : 'red'} />
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                <div className="card p-3 lg:col-span-2">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-medium text-white">Monthly earnings</h2>
                        <span className="text-xs text-gray-500">last 12 months</span>
                    </div>
                    {monthly.length === 0 ? (
                        <div className="flex h-48 items-center justify-center text-sm text-gray-500">No earnings recorded yet</div>
                    ) : (
                        <div className="h-56">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={monthly.map((m) => ({ name: `${m._id.y}-${String(m._id.m).padStart(2, '0')}`, value: m.amountUsd }))}>
                                    <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} stroke="rgba(255,255,255,0.1)" />
                                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} stroke="rgba(255,255,255,0.1)" />
                                    <Tooltip
                                        contentStyle={{ background: '#0B1220', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                                        formatter={(v) => fmtUSD(v)}
                                    />
                                    <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                <div className="card p-3">
                    <div className="mb-3 flex items-center justify-between">
                        <h2 className="text-sm font-medium text-white">Source health</h2>
                        <Link to="/sources" className="text-xs text-emerald-400 hover:text-emerald-300">Manage →</Link>
                    </div>
                    {sourceList.length === 0 ? (
                        <p className="py-5 text-center text-sm text-gray-500">No sources configured</p>
                    ) : (
                        <ul className="space-y-2">
                            {sourceList.slice(0, 8).map((s, i) => (
                                <li key={i} className="flex items-center justify-between gap-2 rounded-md border border-white/5 bg-white/[0.02] px-2 py-2">
                                    <div className="min-w-0">
                                        <p className="truncate text-sm text-gray-200">{s.name}</p>
                                        <p className="text-[10px] uppercase tracking-wider text-gray-500">{s.type}</p>
                                    </div>
                                    <span className={s.healthy ? 'badge-green' : 'badge-red'}>
                                        {s.healthy ? 'healthy' : 'failing'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}