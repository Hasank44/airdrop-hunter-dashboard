import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Wallet as WalletIcon } from 'lucide-react';
import { api } from '../lib/api';
import { Button, Input, Select, Modal, Spinner, ErrorBox, EmptyState, Confirm } from '../components/UI';
import { useToast } from '../components/Toast';

const CHAINS = ['ethereum', 'base', 'bnb', 'arbitrum', 'optimism', 'polygon', 'solana'];

export default function Wallets() {
    const qc = useQueryClient();
    const toast = useToast();
    const [showCreate, setShowCreate] = useState(false);
    const [toDelete, setToDelete] = useState(null);

    const wallets = useQuery({ queryKey: ['wallets'], queryFn: () => api.get('/wallets') });

    const create = useMutation({
        mutationFn: (b) => api.post('/wallets', b),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['wallets'] }); toast.success('Wallet added'); setShowCreate(false); },
        onError: (e) => toast.error(e.message),
    });

    const remove = useMutation({
        mutationFn: (id) => api.del(`/wallets/${id}`),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['wallets'] }); toast.success('Removed'); setToDelete(null); },
        onError: (e) => toast.error(e.message),
    });

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-white">Wallets</h1>
                    <p className="text-sm text-gray-400">Watch-only · no signing keys stored</p>
                </div>
                <Button onClick={() => setShowCreate(true)}><Plus size={14} /> Add wallet</Button>
            </div>

            {wallets.isLoading ? <Spinner /> : wallets.isError ? <ErrorBox error={wallets.error} /> : (
                (wallets.data?.data ?? []).length === 0 ? (
                    <div className="card p-6">
                        <EmptyState icon={WalletIcon} title="No wallets" message="Add a public address to track balances. Private keys are never stored." />
                    </div>
                ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                        {wallets.data.data.map((w) => (
                            <div key={w._id} className="card flex items-start justify-between p-4">
                                <div className="min-w-0">
                                    <p className="font-medium text-white">{w.label}</p>
                                    <p className="mt-1 truncate font-mono text-xs text-gray-400">{w.address}</p>
                                    <div className="mt-2 flex gap-1">
                                        <span className="badge-blue">{w.chain}</span>
                                        {w.disabled && <span className="badge-gray">disabled</span>}
                                    </div>
                                </div>
                                <button className="btn-ghost btn-sm text-red-400 hover:bg-red-500/10" onClick={() => setToDelete(w)}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )
            )}

            <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add wallet" footer={
                <><Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button><Button type="submit" form="new-wallet" loading={create.isPending}>Add</Button></>
            }>
                <form id="new-wallet" onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.target);
                    create.mutate({ label: fd.get('label'), chain: fd.get('chain'), address: fd.get('address') });
                }} className="space-y-3">
                    <Input label="Label *" name="label" required placeholder="main wallet" />
                    <Select label="Chain *" name="chain" defaultValue="ethereum">
                        {CHAINS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </Select>
                    <Input label="Public address *" name="address" required placeholder="0x… or Solana pubkey" />
                    <p className="text-xs text-gray-500">Never enter a seed phrase or private key.</p>
                </form>
            </Modal>

            <Confirm open={!!toDelete} onClose={() => setToDelete(null)} onConfirm={() => toDelete && remove.mutate(toDelete._id)}
                title="Remove wallet?" message={`Remove "${toDelete?.label}"? Balances history will be orphaned.`} loading={remove.isPending} />
        </div>
    );
}