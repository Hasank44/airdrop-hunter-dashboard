import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, TrendingUp, TrendingDown, Coins } from 'lucide-react';
import { api } from '../lib/api';
import { fmtUSD, fmtDay } from '../lib/format';
import { Button, Input, Select, Modal, Spinner, ErrorBox } from '../components/UI';
import { useToast } from '../components/Toast';

export default function Earnings() {
    const qc = useQueryClient();
    const toast = useToast();
    const [showEarning, setShowEarning] = useState(false);
    const [showExpense, setShowExpense] = useState(false);

    const earnings = useQuery({ queryKey: ['earnings'], queryFn: () => api.get('/earnings') });
    const dashboard = useQuery({ queryKey: ['dashboard'], queryFn: () => api.get('/dashboard') });

    const createEarning = useMutation({
        mutationFn: (b) => api.post('/earnings', b),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['earnings'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); toast.success('Recorded'); setShowEarning(false); },
        onError: (e) => toast.error(e.message),
    });
    const createExpense = useMutation({
        mutationFn: (b) => api.post('/earnings/expenses', b),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['earnings'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); toast.success('Recorded'); setShowExpense(false); },
        onError: (e) => toast.error(e.message),
    });

    const d = dashboard.data?.data ?? {};
    const list = earnings.data?.data ?? [];

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-white">Earnings &amp; P&amp;L</h1>
                    <p className="text-sm text-gray-400">Realized income, expenses, and net profit</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setShowEarning(true)}><Plus size={14} /> Record earning</Button>
                    <Button variant="secondary" onClick={() => setShowExpense(true)}><Plus size={14} /> Record expense</Button>
                </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
                <div className="card p-3">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500"><TrendingUp size={12} /> Earned</div>
                    <p className="mt-2 text-2xl font-semibold text-emerald-400">{fmtUSD(d.earnedUsd)}</p>
                </div>
                <div className="card p-3">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500"><TrendingDown size={12} /> Spent</div>
                    <p className="mt-2 text-2xl font-semibold text-red-400">{fmtUSD(d.spentUsd)}</p>
                </div>
                <div className="card p-3">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500"><Coins size={12} /> Realized P&amp;L</div>
                    <p className={`mt-2 text-2xl font-semibold ${(d.realizedPnlUsd ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmtUSD(d.realizedPnlUsd)}</p>
                </div>
            </div>

            {earnings.isLoading ? <Spinner /> : earnings.isError ? <ErrorBox error={earnings.error} /> : (
                <div className="card overflow-x-auto p-0">
                    <table className="table">
                        <thead><tr><th>Kind</th><th>Symbol</th><th>Amount (USD)</th><th>Exchange</th><th>Date</th></tr></thead>
                        <tbody>
                            {list.length === 0 ? (
                                <tr><td colSpan={5} className="text-center text-gray-500 py-6">No earnings recorded yet</td></tr>
                            ) : list.map((e) => (
                                <tr key={e._id}>
                                    <td><span className="badge-blue">{e.kind}</span></td>
                                    <td>{e.tokenSymbol ?? '—'}</td>
                                    <td className="text-emerald-400">{fmtUSD(e.amountUsd)}</td>
                                    <td>{e.exchange ?? '—'}</td>
                                    <td className="text-xs text-gray-500">{fmtDay(e.occurredAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal open={showEarning} onClose={() => setShowEarning(false)} title="Record earning" footer={
                <><Button variant="secondary" onClick={() => setShowEarning(false)}>Cancel</Button><Button type="submit" form="earning-form" loading={createEarning.isPending}>Save</Button></>
            }>
                <form id="earning-form" onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.target);
                    createEarning.mutate({
                        kind: fd.get('kind'),
                        tokenSymbol: fd.get('tokenSymbol') || null,
                        amountUsd: Number(fd.get('amountUsd')),
                        quantity: fd.get('quantity') ? Number(fd.get('quantity')) : null,
                        exchange: fd.get('exchange') || null,
                        occurredAt: new Date(fd.get('occurredAt') || Date.now()).toISOString(),
                        notes: fd.get('notes') || null,
                    });
                }} className="space-y-3">
                    <Select label="Kind *" name="kind" defaultValue="token_received">
                        <option value="token_received">token received</option>
                        <option value="sale_proceeds">sale proceeds</option>
                        <option value="estimated_reward">estimated reward (not realized)</option>
                    </Select>
                    <Input label="Token symbol" name="tokenSymbol" placeholder="ARB" />
                    <Input label="Amount USD *" name="amountUsd" type="number" step="0.01" required />
                    <Input label="Quantity" name="quantity" type="number" step="0.0001" />
                    <Input label="Exchange" name="exchange" placeholder="Bybit" />
                    <Input label="Date" name="occurredAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
                </form>
            </Modal>

            <Modal open={showExpense} onClose={() => setShowExpense(false)} title="Record expense" footer={
                <><Button variant="secondary" onClick={() => setShowExpense(false)}>Cancel</Button><Button type="submit" form="expense-form" loading={createExpense.isPending}>Save</Button></>
            }>
                <form id="expense-form" onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.target);
                    createExpense.mutate({
                        kind: fd.get('kind'),
                        amountUsd: Number(fd.get('amountUsd')),
                        occurredAt: new Date(fd.get('occurredAt') || Date.now()).toISOString(),
                        notes: fd.get('notes') || null,
                    });
                }} className="space-y-3">
                    <Select label="Kind *" name="kind" defaultValue="gas">
                        <option value="gas">gas</option><option value="bridge">bridge</option><option value="fee">fee</option><option value="other">other</option>
                    </Select>
                    <Input label="Amount USD *" name="amountUsd" type="number" step="0.01" required />
                    <Input label="Date" name="occurredAt" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
                    <Input label="Notes" name="notes" />
                </form>
            </Modal>
        </div>
    );
}