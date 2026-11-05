import { useQuery } from '@tanstack/react-query';
import { Activity, Database, Server, Wifi, WifiOff } from 'lucide-react';
import { api } from '../lib/api';
import { Spinner, ErrorBox } from '../components/UI';

export default function System() {
    const health = useQuery({ queryKey: ['sys-health'], queryFn: () => api.get('/system/health'), refetchInterval: 15_000 });
    const queues = useQuery({ queryKey: ['sys-queues'], queryFn: () => api.get('/system/queues'), refetchInterval: 15_000 });

    return (
        <div className="space-y-3 h-[85vh] overflow-y-auto">
            <div>
                <h1 className="text-2xl font-semibold text-white">System</h1>
            </div>
            {health.isLoading ? <Spinner /> : health.isError ? <ErrorBox error={health.error} /> : (
                <>
                    <div className="grid gap-3 md:grid-cols-3">
                        <StatusCard icon={Database} label="MongoDB" value={health.data.data.db} />
                        <StatusCard icon={Server} label="Redis" value={health.data.data.redis} />
                        <StatusCard icon={Activity} label="Telegram" value={health.data.data.telegram} />
                    </div>

                    <div className="card p-3">
                        <h3 className="mb-3 text-sm font-medium text-white">RPC endpoints</h3>
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {Object.entries(health.data.data.rpc ?? {}).map(([chain, status]) => (
                                <div key={chain} className="flex items-center justify-between rounded-md border border-white/5 bg-white/[0.02] px-3 py-2">
                                    <span className="text-sm text-gray-300">{chain}</span>
                                    <span className={status === 'configured' ? 'badge-green' : 'badge-gray'}>{status}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card p-3">
                        <h3 className="mb-3 text-sm font-medium text-white">Uptime</h3>
                        <p className="text-2xl font-semibold text-white">{Math.floor(health.data.data.uptime / 60)} min</p>
                    </div>
                </>
            )}

            {queues.isLoading ? <Spinner /> : queues.isError ? <ErrorBox error={queues.error} /> : (
                <div className="card overflow-x-auto p-0">
                    <table className="table">
                        <thead><tr><th>Queue</th><th>Waiting</th><th>Active</th><th>Completed</th><th>Failed</th><th>Delayed</th></tr></thead>
                        <tbody>
                            {Object.entries(queues.data.data ?? {}).map(([name, c]) => (
                                <tr key={name}>
                                    <td className="font-medium text-white">{name}</td>
                                    <td>{c.waiting ?? 0}</td>
                                    <td>{c.active ?? 0}</td>
                                    <td className="text-emerald-400">{c.completed ?? 0}</td>
                                    <td className={c.failed ? 'text-red-400' : ''}>{c.failed ?? 0}</td>
                                    <td className="text-amber-400">{c.delayed ?? 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// eslint-disable-next-line no-unused-vars
function StatusCard({ icon: Icon, label, value }) {
    const ok = value === 'up' || value === 'configured';
    return (
        <div className="card p-3">
            <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
                {ok ? <Wifi size={16} className="text-emerald-400" /> : <WifiOff size={16} className="text-red-400" />}
            </div>
            <p className={`mt-2 text-lg font-semibold ${ok ? 'text-emerald-400' : 'text-red-400'}`}>{value}</p>
        </div>
    );
}