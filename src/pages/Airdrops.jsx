import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Bookmark, BookmarkCheck } from 'lucide-react';
import { api } from '../lib/api';
import { fmtRelative } from '../lib/format';
import { Button, Input, Select, Modal, Spinner, ErrorBox, EmptyState } from '../components/UI';
import Pagination from '../components/Pagination';
import { useToast } from '../components/Toast';

const STATUSES = ['discovered', 'researching', 'research_complete', 'watching', 'participating', 'eligible', 'claimed', 'rejected', 'archived'];
const CAMPAIGN_TYPES = ['confirmed_airdrop', 'potential_airdrop', 'points_campaign', 'testnet', 'token_launch', 'rumor', 'unknown'];

function StatusBadge({ status }) {
    const map = {
        discovered: 'badge-gray', researching: 'badge-blue', research_complete: 'badge-blue',
        watching: 'badge-yellow', participating: 'badge-purple',
        eligible: 'badge-green', claimed: 'badge-green',
        rejected: 'badge-red', archived: 'badge-gray',
    };
    return <span className={map[status] ?? 'badge-gray'}>{status?.replace(/_/g, ' ')}</span>;
}

export default function Airdrops() {
    const qc = useQueryClient();
    const toast = useToast();
    const [q, setQ] = useState('');
    const [status, setStatus] = useState('');
    const [campaignType, setCampaignType] = useState('');
    const [page, setPage] = useState(1);
    const [showCreate, setShowCreate] = useState(false);

    const params = useMemo(() => {
        const p = new URLSearchParams({ page, limit: 25 });
        if (q) p.set('q', q);
        if (status) p.set('status', status);
        if (campaignType) p.set('campaignType', campaignType);
        return p.toString();
    }, [q, status, campaignType, page]);

    const list = useQuery({
        queryKey: ['airdrops', params],
        queryFn: () => api.get(`/airdrops?${params}`),
        keepPreviousData: true,
    });

    const bookmark = useMutation({
        mutationFn: ({ id, bookmarked }) => api.patch(`/airdrops/${id}/bookmark`, { bookmarked }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['airdrops'] }),
    });

    const create = useMutation({
        mutationFn: (body) => api.post('/airdrops', body),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['airdrops'] });
            toast.success('Project created');
            setShowCreate(false);
        },
        onError: (e) => toast.error(e.message),
    });

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-white">Airdrops</h1>
                </div>
                <Button onClick={() => setShowCreate(true)}><Plus size={14} /> Add project</Button>
            </div>
            <div className="card p-3">
                <div className="grid gap-2 md:grid-cols-[1fr,180px,220px]">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            className="input pl-8"
                            placeholder="Search by name or description…"
                            value={q}
                            onChange={(e) => { setQ(e.target.value); setPage(1); }}
                        />
                    </div>
                    <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                        <option value="">All statuses</option>
                        {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </Select>
                    <Select value={campaignType} onChange={(e) => { setCampaignType(e.target.value); setPage(1); }}>
                        <option value="">All campaign types</option>
                        {CAMPAIGN_TYPES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </Select>
                </div>
            </div>

            {list.isLoading ? <Spinner /> : list.isError ? <ErrorBox error={list.error} /> : (
                <div className="card overflow-x-auto h-[430px] overflow-y-auto p-0">
                    {list.data?.data?.length === 0 ? (
                        <EmptyState
                            icon={Sparkles}
                            title="No airdrops yet"
                            message="Sources will populate this table automatically. Or trigger a fetch from the Sources page."
                        />
                    ) : (
                            <table className="table">
                            <thead>
                                <tr>
                                    <th>Project</th>
                                    <th>Status</th>
                                    <th>Campaign</th>
                                    <th>Networks</th>
                                    <th>Added</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {list.data.data.map((p) => (
                                    <tr key={p._id}>
                                        <td>
                                            <Link to={`/airdrops/${p._id}`} className="font-medium text-white hover:text-emerald-400">
                                                {p.name}
                                            </Link>
                                            {p.canonicalUrl && (
                                                <p className="text-xs text-gray-500">{p.canonicalUrl}</p>
                                            )}
                                        </td>
                                        <td><StatusBadge status={p.status} /></td>
                                        <td><span className="text-xs text-gray-300">{p.campaignType?.replace(/_/g, ' ')}</span></td>
                                        <td>
                                            <div className="flex flex-wrap gap-1">
                                                {(p.networks ?? []).slice(0, 3).map((n) => <span key={n} className="badge-gray">{n}</span>)}
                                                {(p.networks?.length ?? 0) > 3 && <span className="badge-gray">+{p.networks.length - 3}</span>}
                                            </div>
                                        </td>
                                        <td><span className="text-xs text-gray-500">{fmtRelative(p.createdAt)}</span></td>
                                        <td className="text-right">
                                            <button
                                                onClick={() => bookmark.mutate({ id: p._id, bookmarked: !p.bookmarked })}
                                                className={p.bookmarked ? 'text-emerald-400 hover:text-emerald-300' : 'text-gray-500 hover:text-white'}
                                                title={p.bookmarked ? 'Remove bookmark' : 'Bookmark'}
                                            >
                                                {p.bookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {list.data?.meta && (
                        <div className="border-t border-white/10 p-3">
                            <Pagination
                                page={list.data.meta.page}
                                pages={list.data.meta.pages}
                                total={list.data.meta.total}
                                onPage={setPage}
                            />
                        </div>
                    )}
                </div>
            )}

            <CreateProjectModal open={showCreate} onClose={() => setShowCreate(false)} onSubmit={(v) => create.mutate(v)} loading={create.isPending} />
        </div>
    );
}

function CreateProjectModal({ open, onClose, onSubmit, loading }) {
    const [form, setForm] = useState({ name: '', description: '', campaignType: 'unknown', networks: '', canonicalUrl: '' });
    function submit(e) {
        e.preventDefault();
        onSubmit({
            name: form.name.trim(),
            description: form.description.trim() || null,
            campaignType: form.campaignType,
            networks: form.networks.split(',').map((s) => s.trim()).filter(Boolean),
            canonicalUrl: form.canonicalUrl.trim() || null,
        });
    }
    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Add project"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" form="create-project" loading={loading}>Create</Button>
                </>
            }
        >
            <form id="create-project" onSubmit={submit} className="space-y-3">
                <Input label="Name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <Select label="Campaign type" value={form.campaignType} onChange={(e) => setForm({ ...form, campaignType: e.target.value })}>
                    {CAMPAIGN_TYPES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                </Select>
                <Input label="Networks (comma-separated)" placeholder="ethereum, base" value={form.networks} onChange={(e) => setForm({ ...form, networks: e.target.value })} />
                <Input label="Official URL" type="url" value={form.canonicalUrl} onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value })} />
            </form>
        </Modal>
    );
}

// Sparkles import for empty state icon
import { Sparkles } from 'lucide-react';