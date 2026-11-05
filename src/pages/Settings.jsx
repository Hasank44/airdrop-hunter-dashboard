import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Lock } from 'lucide-react';
import { api } from '../lib/api';
import { Button, Input, Spinner } from '../components/UI';
import { useToast } from '../components/Toast';

const WEIGHT_KEYS = [
    ['evidence_quality', 'Evidence quality'],
    ['project_credibility', 'Project credibility'],
    ['campaign_confirmation', 'Campaign confirmation'],
    ['task_accessibility', 'Task accessibility'],
    ['cost', 'Cost'],
    ['time_remaining', 'Time remaining'],
    ['ecosystem_activity', 'Ecosystem activity'],
];

export default function Settings() {
    const qc = useQueryClient();
    const toast = useToast();
    const scoring = useQuery({
        queryKey: ['setting', 'scoring.weights'],
        queryFn: () => api.get('/settings/scoring.weights'),
    });

    const [weights, setWeights] = useState(null);
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (scoring.data?.data?.value) setWeights(scoring.data.data.value);
    }, [scoring.data]);

    const saveWeights = useMutation({
        mutationFn: (v) => api.put('/settings/scoring.weights', { value: v, isSecret: false }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['setting', 'scoring.weights'] });
            toast.success('Scoring weights updated');
        },
        onError: (e) => toast.error(e.message),
    });

    const sum = weights ? Object.values(weights).reduce((a, b) => a + Number(b || 0), 0) : 0;

    return (
        <div className="space-y-3  h-[85vh] overflow-y-auto">
            <div>
                <h1 className="text-2xl font-semibold text-white">Settings</h1>
            </div>
            <div className="card p-3">
                <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-sm font-medium text-white">Opportunity scoring weights</h2>
                    <span className={`text-xs ${Math.abs(sum - 1) < 0.01 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        sum: {sum.toFixed(3)}
                    </span>
                </div>
                {scoring.isLoading || !weights ? (
                    <Spinner />
                ) : (
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        saveWeights.mutate(weights);
                    }} className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                            {WEIGHT_KEYS.map(([k, label]) => (
                                <Input
                                    key={k}
                                    label={label}
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="1"
                                    value={weights[k] ?? 0}
                                    onChange={(e) => setWeights({ ...weights, [k]: Number(e.target.value) })}
                                />
                            ))}
                        </div>
                        <Button type="submit" loading={saveWeights.isPending}><Save size={14} /> Save weights</Button>
                    </form>
                )}
            </div>
            <div className="card p-3">
                <div className="mb-2 flex items-center gap-2">
                    <Lock size={14} className="text-amber-400" />
                    <h2 className="text-sm font-medium text-white">Environment-managed values</h2>
                </div>
                <p className="text-sm text-gray-400">
                    Secrets, database connections, API keys, and deployment variables live in <code className="rounded bg-white/5 px-1 text-emerald-400">.env</code> and are never editable from the UI. To change them:
                </p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-gray-500">
                    <li>Edit <code className="rounded bg-white/5 px-1 text-emerald-400">.env</code> in your server folder</li>
                    <li>Restart the backend (<code className="rounded bg-white/5 px-1">npm start</code> and <code className="rounded bg-white/5 px-1">npm run worker</code>)</li>
                </ol>
                <p className="mt-3 text-xs text-gray-500">
                    Managed via .env: JWT secrets, encryption key, MongoDB URI, Redis URL, OpenAI/Gemini keys, Telegram bot token, RPC endpoints, CORS origins, schedule crons.
                </p>
            </div>
        </div>
    );
}