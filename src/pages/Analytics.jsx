import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Spinner } from '../components/UI';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, CartesianGrid } from 'recharts';

function Panel({ title, children }) {
    return (
        <div className="card p-3">
            <h3 className="mb-3 text-sm font-medium text-white">{title}</h3>
            {children}
        </div>
    );
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Analytics() {
    const trend = useQuery({ queryKey: ['an-trend'], queryFn: () => api.get('/analytics/discovery-trend?days=30') });
    const statuses = useQuery({ queryKey: ['an-status'], queryFn: () => api.get('/analytics/status-breakdown') });
    const risk = useQuery({ queryKey: ['an-risk'], queryFn: () => api.get('/analytics/risk-distribution') });
    const chains = useQuery({ queryKey: ['an-chain'], queryFn: () => api.get('/analytics/chain-distribution') });
    const pnl = useQuery({ queryKey: ['an-pnl'], queryFn: () => api.get('/analytics/project-pnl') });

    const loading = [trend, statuses, risk, chains, pnl].some((q) => q.isLoading);

    if (loading) return <Spinner label="Loading analytics…" />;

    return (
        <div className="space-y-3 h-[85vh] overflow-y-auto pb-2">
            <div>
                <h1 className="text-2xl font-semibold text-white">Analytics</h1>
                <p className="text-sm text-gray-400">Discovery, risk, chain, and profitability insights</p>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
                <Panel title="Discovery trend (30d)">
                    <div className="h-56">
                        <ResponsiveContainer>
                            <LineChart data={(trend.data?.data ?? []).map((d) => ({ date: d._id, count: d.count }))}>
                                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} />
                                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                                <Tooltip contentStyle={{ background: '#0B1220', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                                <Line dataKey="count" stroke="#10b981" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Panel>

                <Panel title="Project status breakdown">
                    <div className="h-56">
                        <ResponsiveContainer>
                            <BarChart data={(statuses.data?.data ?? []).map((s) => ({ name: s._id, count: s.count }))}>
                                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} />
                                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                                <Tooltip contentStyle={{ background: '#0B1220', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Panel>

                <Panel title="Risk distribution">
                    <div className="h-56">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={(risk.data?.data ?? []).map((r) => ({ name: r._id, value: r.count }))}
                                    dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                                    {(risk.data?.data ?? []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#0B1220', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Panel>

                <Panel title="Chain distribution">
                    <div className="h-56">
                        <ResponsiveContainer>
                            <BarChart data={(chains.data?.data ?? []).map((c) => ({ name: c._id, count: c.count }))}>
                                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 10 }} />
                                <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} />
                                <Tooltip contentStyle={{ background: '#0B1220', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Panel>
            </div>

            <Panel title="Per-project profitability">
                {(pnl.data?.data ?? []).length === 0 ? (
                    <p className="py-5 text-center text-sm text-gray-500">No earnings attributed to projects yet</p>
                ) : (
                    <table className="table">
                        <thead><tr><th>Project</th><th className="text-right">Earned</th><th className="text-right">Spent</th><th className="text-right">P&amp;L</th></tr></thead>
                        <tbody>
                            {pnl.data.data.map((p) => (
                                <tr key={p._id}>
                                    <td>{p.projectName}</td>
                                    <td className="text-right text-emerald-400">${p.earned.toFixed(2)}</td>
                                    <td className="text-right text-red-400">${p.spent.toFixed(2)}</td>
                                    <td className={`text-right font-medium ${p.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>${p.pnl.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </Panel>
        </div>
    );
}