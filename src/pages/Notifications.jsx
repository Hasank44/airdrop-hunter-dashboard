import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck } from 'lucide-react';
import { api } from '../lib/api';
import { fmtRelative } from '../lib/format';
import { Button, Input, Select, Spinner, ErrorBox, EmptyState } from '../components/UI';
import { useToast } from '../components/Toast';

export default function Notifications() {
    const qc = useQueryClient();
    const toast = useToast();
    const [unreadOnly, setUnreadOnly] = useState(false);

    const list = useQuery({
        queryKey: ['notifications', unreadOnly],
        queryFn: () => api.get(`/notifications?unreadOnly=${unreadOnly}&limit=50`),
        refetchInterval: 30_000,
    });

    const prefs = useQuery({ queryKey: ['notification-prefs'], queryFn: () => api.get('/notifications/prefs') });

    const markRead = useMutation({
        mutationFn: (id) => api.post(`/notifications/${id}/read`),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    });
    const markAll = useMutation({
        mutationFn: () => api.post('/notifications/read-all'),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); toast.success('Marked read'); },
    });
    const savePrefs = useMutation({
        mutationFn: (b) => api.put('/notifications/prefs', b),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['notification-prefs'] }); toast.success('Saved'); },
        onError: (e) => toast.error(e.message),
    });

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-white">Notifications</h1>
                </div>
                <div className="flex gap-2">
                    <Select value={unreadOnly ? '1' : '0'} onChange={(e) => setUnreadOnly(e.target.value === '1')} className="w-auto">
                        <option value="0">All</option><option value="1">Unread only</option>
                    </Select>
                    <Button variant="secondary" onClick={() => markAll.mutate()} loading={markAll.isPending}><CheckCheck size={14} /> Mark all read</Button>
                </div>
            </div>
            <div className="grid gap-3 lg:grid-cols-3">
                <div className="card p-3 lg:col-span-2 h-[80vh] overflow-y-auto">
                    <h3 className="mb-3 text-sm font-medium text-white">Recent</h3>
                    {list.isLoading ? <Spinner /> : list.isError ? <ErrorBox error={list.error} /> : (
                        (list.data?.data ?? []).length === 0 ? (
                            <EmptyState icon={Bell} title="No notifications" message="Alerts will appear here when there's activity." />
                        ) : (
                            <ul className="space-y-2">
                                {list.data.data.map((n) => (
                                    <li key={n._id} className={`rounded-md border p-3 ${n.readAt ? 'border-white/5 bg-white/[0.02]' : 'border-emerald-500/20 bg-emerald-500/5'}`}>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-white">{n.title}</p>
                                                {n.body && <p className="mt-1 text-sm text-gray-400">{n.body}</p>}
                                                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                                                    <span className="badge-gray">{n.kind}</span>
                                                    <span>{fmtRelative(n.createdAt)}</span>
                                                    {n.deliveredChannels?.length > 0 && <span>→ {n.deliveredChannels.join(', ')}</span>}
                                                </div>
                                            </div>
                                            {!n.readAt && (
                                                <button className="text-xs text-emerald-400 hover:text-emerald-300" onClick={() => markRead.mutate(n._id)}>
                                                    mark read
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )
                    )}
                </div>
                <div className="card p-3  h-[80vh] overflow-y-auto">
                    <h3 className="mb-3 text-sm font-medium text-white">Preferences</h3>
                    {prefs.isLoading ? <Spinner /> : prefs.isError ? <ErrorBox error={prefs.error} /> : (
                        <PrefsForm initial={prefs.data?.data} onSave={(v) => savePrefs.mutate(v)} loading={savePrefs.isPending} />
                    )}
                </div>
            </div>
        </div>
    );
}

function PrefsForm({ initial, onSave, loading }) {
    const [form, setForm] = useState(initial ?? {});
    // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
    useEffect(() => { setForm(initial ?? {}); }, [initial?._id]);
    const qh = form.quietHours ?? {};
    const ch = form.channels ?? {};
    const th = form.thresholds ?? {};

    function submit(e) {
        e.preventDefault();
        onSave({
            quietHours: { startHour: Number(qh.startHour ?? 23), endHour: Number(qh.endHour ?? 7), timezone: qh.timezone || 'Asia/Dhaka' },
            channels: { inApp: ch.inApp !== false, telegram: ch.telegram !== false },
            thresholds: { minRiskLevel: th.minRiskLevel || 'high', minOpportunity: Number(th.minOpportunity ?? 60) },
        });
    }

    return (
        <form onSubmit={submit} className="space-y-3">
            <div>
                <p className="label">Channels</p>
                <div className="flex gap-3 text-sm">
                    <label className="flex items-center gap-2">
                        <input type="checkbox" checked={ch.inApp !== false} onChange={(e) => setForm({ ...form, channels: { ...ch, inApp: e.target.checked } })} />
                        In-app
                    </label>
                    <label className="flex items-center gap-2">
                        <input type="checkbox" checked={ch.telegram !== false} onChange={(e) => setForm({ ...form, channels: { ...ch, telegram: e.target.checked } })} />
                        Telegram
                    </label>
                </div>
            </div>
            <div>
                <p className="label">Quiet hours</p>
                <div className="grid grid-cols-2 gap-2">
                    <Input label="Start" type="number" min="0" max="23" value={qh.startHour ?? 23}
                        onChange={(e) => setForm({ ...form, quietHours: { ...qh, startHour: e.target.value } })} />
                    <Input label="End" type="number" min="0" max="23" value={qh.endHour ?? 7}
                        onChange={(e) => setForm({ ...form, quietHours: { ...qh, endHour: e.target.value } })} />
                </div>
                <Input label="Timezone" value={qh.timezone ?? 'Asia/Dhaka'} className="mt-2"
                    onChange={(e) => setForm({ ...form, quietHours: { ...qh, timezone: e.target.value } })} />
            </div>
            <div>
                <p className="label">Alert thresholds</p>
                <Select value={th.minRiskLevel ?? 'high'}
                    onChange={(e) => setForm({ ...form, thresholds: { ...th, minRiskLevel: e.target.value } })}>
                    <option value="low">low risk</option><option value="medium">medium risk</option>
                    <option value="high">high risk</option><option value="critical">critical only</option>
                </Select>
                <Input label="Min opportunity score" type="number" min="0" max="100" value={th.minOpportunity ?? 60} className="mt-2"
                    onChange={(e) => setForm({ ...form, thresholds: { ...th, minOpportunity: e.target.value } })} />
            </div>
            <Button type="submit" loading={loading} className="w-full">Save preferences</Button>
        </form>
    );
}