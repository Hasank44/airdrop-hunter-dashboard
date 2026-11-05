import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Tag, Zap } from 'lucide-react';
import { api } from '../lib/api';
import { fmtDay } from '../lib/format';
import { Button, Input, Select, Modal, Spinner, ErrorBox, EmptyState } from '../components/UI';
import { useToast } from '../components/Toast';

export default function Listings() {
    const qc = useQueryClient();
    const toast = useToast();
    const [showCreate, setShowCreate] = useState(false);

    const listings = useQuery({ queryKey: ['listings'], queryFn: () => api.get('/listings') });
    const projects = useQuery({ queryKey: ['projects-lite'], queryFn: () => api.get('/airdrops?limit=100') });

    const create = useMutation({
        mutationFn: (b) => api.post('/listings', b),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['listings'] }); toast.success('Listing added'); setShowCreate(false); },
        onError: (e) => toast.error(e.message),
    });

    const capturePrice = useMutation({
        mutationFn: (b) => api.post('/listings/price/capture', b),
        onSuccess: (res) => toast.success(`Price: $${res.data?.priceUsd} via ${res.data?.provider}`),
        onError: (e) => toast.error(e.message),
    });

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-white">Listings</h1>
                    <p className="text-sm text-gray-400">Announced exchange listings and price snapshots</p>
                </div>
                <Button onClick={() => setShowCreate(true)}><Plus size={14} /> Add listing</Button>
            </div>

            <div className="card p-3">
                <form onSubmit={(e) => { e.preventDefault(); capturePrice.mutate({ symbol: e.target.symbol.value.toUpperCase() }); }}
                    className="flex flex-wrap gap-2">
                    <input name="symbol" placeholder="Price check (e.g. ETH, BTC)" className="input flex-1 min-w-[180px]" />
                    <Button type="submit" loading={capturePrice.isPending}><Zap size={14} /> Get price</Button>
                </form>
            </div>

            {listings.isLoading ? <Spinner /> : listings.isError ? <ErrorBox error={listings.error} /> : (
                (listings.data?.data ?? []).length === 0 ? (
                    <div className="card p-6"><EmptyState icon={Tag} title="No listings yet" message="Record exchange listings you're tracking." /></div>
                ) : (
                    <div className="card overflow-x-auto p-0">
                        <table className="table">
                            <thead><tr><th>Exchange</th><th>Symbol</th><th>Status</th><th>Scheduled</th><th>Source</th></tr></thead>
                            <tbody>
                                {listings.data.data.map((l) => (
                                    <tr key={l._id}>
                                        <td className="font-medium text-white">{l.exchange}</td>
                                        <td>{l.symbol}</td>
                                        <td><span className={l.status === 'live' ? 'badge-green' : l.status === 'verified' ? 'badge-blue' : 'badge-gray'}>{l.status}</span></td>
                                        <td className="text-xs text-gray-500">{fmtDay(l.scheduledAt)}</td>
                                        <td><a href={l.evidenceUrl} target="_blank" rel="noreferrer" className="text-xs text-emerald-400 hover:underline">evidence</a></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            )}

            <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add listing" footer={
                <><Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button type="submit" form="listing-form" loading={create.isPending}>Add</Button></>
            }>
                <form id="listing-form" onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.target);
                    create.mutate({
                        projectId: fd.get('projectId'),
                        exchange: fd.get('exchange'),
                        symbol: fd.get('symbol').toUpperCase(),
                        status: fd.get('status'),
                        scheduledAt: fd.get('scheduledAt') ? new Date(fd.get('scheduledAt')).toISOString() : null,
                        evidenceUrl: fd.get('evidenceUrl'),
                    });
                }} className="space-y-3">
                    <Select label="Project *" name="projectId" required>
                        <option value="">— select —</option>
                        {(projects.data?.data ?? []).map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                    </Select>
                    <Input label="Exchange *" name="exchange" required placeholder="Binance" />
                    <Input label="Symbol *" name="symbol" required placeholder="ABC" />
                    <Select label="Status" name="status" defaultValue="announced">
                        {['announced', 'verified', 'live', 'delisted', 'rumored'].map((s) => <option key={s} value={s}>{s}</option>)}
                    </Select>
                    <Input label="Scheduled date" name="scheduledAt" type="date" />
                    <Input label="Evidence URL *" name="evidenceUrl" type="url" required />
                </form>
            </Modal>
        </div>
    );
}