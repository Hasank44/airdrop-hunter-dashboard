import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Gift } from 'lucide-react';
import { api } from '../lib/api';
import { fmtRelative } from '../lib/format';
import { Select, Spinner, ErrorBox, EmptyState } from '../components/UI';
import { useToast } from '../components/Toast';

const STATUSES = ['unknown', 'unavailable', 'available', 'pending', 'claimed', 'failed'];

export default function Claims() {
    const qc = useQueryClient();
    const toast = useToast();
    const [status, setStatus] = useState('');
    const claims = useQuery({
        queryKey: ['claims', status],
        queryFn: () => api.get(`/claims${status ? '?status=' + status : ''}`),
    });
    const update = useMutation({
        mutationFn: ({ id, body }) => api.post('/claims', body),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['claims'] }); toast.success('Updated'); },
    });

    return (
        <div className="space-y-3">
            <div>
                <h1 className="text-2xl font-semibold text-white">Claims</h1>
                <p className="text-sm text-gray-400">Claim status per wallet per project</p>
            </div>

            <div className="card p-3">
                <Select value={status} onChange={(e) => setStatus(e.target.value)} className="max-w-[220px]">
                    <option value="">All statuses</option>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
            </div>

            {claims.isLoading ? <Spinner /> : claims.isError ? <ErrorBox error={claims.error} /> : (
                (claims.data?.data ?? []).length === 0 ? (
                    <div className="card p-6"><EmptyState icon={Gift} title="No claims yet" message="Claims appear when you record them after receiving tokens." /></div>
                ) : (
                    <div className="card overflow-x-auto p-0">
                        <table className="table">
                            <thead><tr><th>Symbol</th><th>Chain</th><th>Status</th><th>Amount</th><th>Claimed</th></tr></thead>
                            <tbody>
                                {claims.data.data.map((c) => (
                                    <tr key={c._id}>
                                        <td className="font-medium text-white">{c.tokenSymbol ?? '—'}</td>
                                        <td><span className="badge-blue">{c.chain}</span></td>
                                        <td><span className={c.status === 'claimed' ? 'badge-green' : c.status === 'available' ? 'badge-yellow' : 'badge-gray'}>{c.status}</span></td>
                                        <td>{c.amountReceived ?? c.amountEstimate ?? '—'}</td>
                                        <td className="text-xs text-gray-500">{fmtRelative(c.claimedAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            )}
        </div>
    );
}