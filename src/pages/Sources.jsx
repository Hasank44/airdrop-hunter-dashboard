import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, RefreshCw, Trash2, Power, PowerOff, Rss } from 'lucide-react';
import { api } from '../lib/api';
import { fmtRelative } from '../lib/format';
import { Button, Input, Select, Modal, Spinner, ErrorBox, EmptyState, Confirm } from '../components/UI';
import { useToast } from '../components/Toast';

const TYPES = ['rss', 'github', 'official_api', 'website', 'aggregator', 'manual'];

export default function Sources() {
    const qc = useQueryClient();
    const toast = useToast();
    const [showCreate, setShowCreate] = useState(false);
    const [toDelete, setToDelete] = useState(null);

    const sources = useQuery({
        queryKey: ['sources'],
        queryFn: () => api.get('/sources'),
    });

    const toggle = useMutation({
        mutationFn: ({ id, enabled }) => api.patch(`/sources/${id}`, { enabled }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['sources'] }),
    });

    const fetchNow = useMutation({
        mutationFn: (id) => api.post(`/sources/${id}/fetch`),
        onSuccess: (res) => {
            toast.success(`Fetched ${res.data?.itemsFound ?? 0} items (${res.data?.itemsNew ?? 0} new)`);
            qc.invalidateQueries({ queryKey: ['sources'] });
            qc.invalidateQueries({ queryKey: ['airdrops'] });
        },
        onError: (e) => toast.error(e.message),
    });

    const remove = useMutation({
        mutationFn: (id) => api.del(`/sources/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['sources'] });
            toast.success('Source deleted');
            setToDelete(null);
        },
        onError: (e) => toast.error(e.message),
    });

    const create = useMutation({
        mutationFn: (body) => api.post('/sources', body),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['sources'] });
            toast.success('Source added');
            setShowCreate(false);
        },
        onError: (e) => toast.error(e.message),
    });

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-white">Sources</h1>
                    <p className="text-sm text-gray-400">Feeds that discovery pulls from</p>
                </div>
                <Button onClick={() => setShowCreate(true)}><Plus size={14} /> Add source</Button>
            </div>

            {sources.isLoading ? <Spinner /> : sources.isError ? <ErrorBox error={sources.error} /> : (
                <div className="card overflow-x-auto p-0">
                    {sources.data?.data?.length === 0 ? (
                        <EmptyState icon={Rss} title="No sources yet" message="Add an RSS feed, GitHub repo, or website to start discovering projects." />
                    ) : (
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Name</th><th>Type</th><th>Status</th><th>Last success</th><th>Failures</th><th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sources.data.data.map((s) => (
                                    <tr key={s._id}>
                                        <td>
                                            <p className="font-medium text-white">{s.name}</p>
                                            <a href={s.url} target="_blank" rel="noreferrer" className="text-xs text-gray-500 hover:text-emerald-400">{s.url}</a>
                                        </td>
                                        <td><span className="badge-gray">{s.type}</span></td>
                                        <td>{s.enabled ? <span className="badge-green">enabled</span> : <span className="badge-gray">disabled</span>}</td>
                                        <td><span className="text-xs text-gray-500">{fmtRelative(s.lastSuccessAt)}</span></td>
                                        <td><span className={s.consecutiveFailures > 0 ? 'text-xs text-red-400' : 'text-xs text-gray-500'}>{s.consecutiveFailures}</span></td>
                                        <td className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <button className="btn-ghost btn-sm" onClick={() => fetchNow.mutate(s._id)} title="Fetch now" disabled={fetchNow.isPending}>
                                                    <RefreshCw size={14} className={fetchNow.isPending ? 'animate-spin' : ''} />
                                                </button>
                                                <button className="btn-ghost btn-sm" onClick={() => toggle.mutate({ id: s._id, enabled: !s.enabled })} title={s.enabled ? 'Disable' : 'Enable'}>
                                                    {s.enabled ? <PowerOff size={14} /> : <Power size={14} />}
                                                </button>
                                                <button className="btn-ghost btn-sm text-red-400 hover:bg-red-500/10" onClick={() => setToDelete(s)} title="Delete">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            <CreateSourceModal open={showCreate} onClose={() => setShowCreate(false)} onSubmit={(v) => create.mutate(v)} loading={create.isPending} />

            <Confirm
                open={!!toDelete}
                onClose={() => setToDelete(null)}
                onConfirm={() => toDelete && remove.mutate(toDelete._id)}
                title="Delete source?"
                message={`Delete "${toDelete?.name}"? This will not delete any projects already discovered.`}
                loading={remove.isPending}
            />
        </div>
    );
}

function CreateSourceModal({ open, onClose, onSubmit, loading }) {
    const [form, setForm] = useState({ name: '', type: 'rss', url: '', trustLevel: 'medium', githubOwner: '', githubRepo: '', subreddit: '' });

    function submit(e) {
        e.preventDefault();
        const config = {};
        if (form.type === 'github') { config.owner = form.githubOwner; config.repo = form.githubRepo; }
        if (form.type === 'official_api' && form.subreddit) { config.provider = 'reddit'; config.subreddit = form.subreddit; }
        onSubmit({ name: form.name.trim(), type: form.type, url: form.url.trim(), trustLevel: form.trustLevel, config });
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Add source"
            footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="create-source" loading={loading}>Add</Button></>}
        >
            <form id="create-source" onSubmit={submit} className="space-y-3">
                <Input label="Name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Select label="Type *" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
                <Input label="URL *" type="url" required placeholder="https://example.com/feed.xml" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
                {form.type === 'github' && (
                    <div className="grid grid-cols-2 gap-2">
                        <Input label="GitHub owner" placeholder="Uniswap" value={form.githubOwner} onChange={(e) => setForm({ ...form, githubOwner: e.target.value })} />
                        <Input label="GitHub repo" placeholder="v4-core" value={form.githubRepo} onChange={(e) => setForm({ ...form, githubRepo: e.target.value })} />
                    </div>
                )}
                {form.type === 'official_api' && (
                    <Input label="Subreddit (Reddit API)" placeholder="CryptoAirdrops" value={form.subreddit} onChange={(e) => setForm({ ...form, subreddit: e.target.value })} />
                )}
                <Select label="Trust level" value={form.trustLevel} onChange={(e) => setForm({ ...form, trustLevel: e.target.value })}>
                    <option value="low">low</option><option value="medium">medium</option><option value="high">high</option>
                </Select>
            </form>
        </Modal>
    );
}