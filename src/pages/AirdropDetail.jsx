import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ShieldAlert, Gauge, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { fmtRelative } from '../lib/format';
import { Button, Spinner, ErrorBox, Select } from '../components/UI';
import { useToast } from '../components/Toast';

const TABS = ['Overview', 'Evidence', 'Research', 'Risk', 'Score'];

export default function AirdropDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const qc = useQueryClient();
    const toast = useToast();
    const [tab, setTab] = useState('Overview');

    const detail = useQuery({
        queryKey: ['airdrop', id],
        queryFn: () => api.get(`/airdrops/${id}`),
    });

    const setStatus = useMutation({
        mutationFn: (status) => api.patch(`/airdrops/${id}/status`, { status }),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['airdrop', id] }); toast.success('Status updated'); },
        onError: (e) => toast.error(e.message),
    });

    const runResearch = useMutation({
        mutationFn: () => api.post(`/research/${id}/run`),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['airdrop', id] }); toast.success('Research complete'); },
        onError: (e) => toast.error(e.message || 'Research failed — check AI provider config'),
    });

    if (detail.isLoading) return <Spinner />;
    if (detail.isError) return <ErrorBox error={detail.error} />;

    const { project, evidence = [], research = [], risk, score } = detail.data.data;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <button onClick={() => navigate(-1)} className="mb-2 flex items-center gap-1 text-xs text-gray-400 hover:text-white">
                        <ArrowLeft size={12} /> back
                    </button>
                    <h1 className="text-2xl font-semibold text-white">{project.name}</h1>
                    <p className="text-sm text-gray-400">
                        {project.campaignType?.replace(/_/g, ' ')} · added {fmtRelative(project.createdAt)}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Select value={project.status} onChange={(e) => setStatus.mutate(e.target.value)} className="w-auto min-w-[180px]">
                        {['discovered', 'researching', 'research_complete', 'watching', 'participating', 'eligible', 'claimed', 'rejected', 'archived'].map((s) => (
                            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                        ))}
                    </Select>
                    <Button onClick={() => runResearch.mutate()} loading={runResearch.isPending}>
                        <Sparkles size={14} /> Run AI research
                    </Button>
                </div>
            </div>

            <div className="flex gap-1 border-b border-white/10">
                {TABS.map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-3 py-2 text-sm transition-colors ${tab === t ? 'border-b-2 border-emerald-500 text-white' : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {tab === 'Overview' && (
                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="card p-4 lg:col-span-2">
                        <h3 className="mb-2 text-sm font-medium text-white">Description</h3>
                        <p className="text-sm text-gray-300">{project.description || <span className="text-gray-500">No description</span>}</p>
                        {project.canonicalUrl && (
                            <a href={project.canonicalUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-emerald-400 hover:text-emerald-300">
                                {project.canonicalUrl}
                            </a>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2">
                            {(project.networks ?? []).map((n) => <span key={n} className="badge-blue">{n}</span>)}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="card p-3">
                            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
                                <Gauge size={12} /> Opportunity score
                            </div>
                            <p className="mt-2 text-3xl font-semibold text-white">{score?.total ?? '—'}</p>
                            {score && <p className="text-xs text-gray-500">v{score.version} · {fmtRelative(score.createdAt)}</p>}
                        </div>
                        <div className="card p-3">
                            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
                                <ShieldAlert size={12} /> Risk
                            </div>
                            <p className={`mt-2 text-2xl font-semibold ${risk?.level === 'critical'
                                ? 'text-red-400'
                                : risk?.level === 'high'
                                ? 'text-amber-400'
                                : risk?.level === 'low'
                                ? 'text-emerald-400'
                                : 'text-gray-300'
                            }`}>
                                {risk?.level ?? 'unknown'}
                            </p>
                            <p className="text-xs text-gray-500">{risk?.score != null ? `${risk.score}/100` : ''}</p>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'Evidence' && (
                <div className="card p-0 overflow-x-auto">
                    {evidence.length === 0 ? (
                        <p className="p-6 text-center text-sm text-gray-500">No evidence collected yet.</p>
                    ) : (
                        <table className="table">
                            <thead>
                                <tr><th>Title</th><th>Kind</th><th>URL</th><th>Fetched</th></tr>
                            </thead>
                            <tbody>
                                {evidence.map((e) => (
                                    <tr key={e._id}>
                                        <td className="max-w-xs truncate">{e.title || '—'}</td>
                                        <td><span className="badge-gray">{e.kind}</span></td>
                                        <td className="max-w-xs truncate"><a href={e.url} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">{e.url}</a></td>
                                        <td className="text-xs text-gray-500">{fmtRelative(e.fetchedAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {tab === 'Research' && (
                <div className="space-y-3">
                    {research.length === 0 ? (
                        <div className="card p-6 text-center text-sm text-gray-500">No research yet. Click "Run AI research" above.</div>
                    ) : research.map((r) => (
                        <div key={r._id} className="card p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="badge-blue">{r.provider}</span>
                                    <span className="text-xs text-gray-500">{r.model} · {fmtRelative(r.createdAt)}</span>
                                </div>
                                <span className="badge-gray">confidence {(r.confidence * 100).toFixed(0)}%</span>
                            </div>
                            <p className="mt-3 text-sm text-gray-300">{r.summary}</p>
                            {r.redFlags?.length > 0 && (
                                <div className="mt-3 rounded-md border border-red-500/20 bg-red-500/5 p-2">
                                    <p className="text-xs uppercase tracking-wide text-red-400">Red flags</p>
                                    <ul className="mt-1 space-y-1">
                                        {r.redFlags.map((f, i) => <li key={i} className="text-sm text-red-300">• {f}</li>)}
                                    </ul>
                                </div>
                            )}
                            {r.uncertainties?.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-xs uppercase tracking-wide text-gray-500">Uncertainties</p>
                                    <ul className="mt-1 space-y-1">
                                        {r.uncertainties.map((u, i) => <li key={i} className="text-sm text-gray-400">• {u}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {tab === 'Risk' && (
                <div className="card p-3">
                    {!risk ? <p className="text-center text-sm text-gray-500">No risk assessment yet.</p> : (
                        <>
                            <div className="mb-3 flex items-center gap-3">
                                <span className={`badge-${risk.level === 'critical' ? 'red' : risk.level === 'high' ? 'yellow' : risk.level === 'low' ? 'green' : 'gray'}`}>
                                    {risk.level}
                                </span>
                                <span className="text-sm text-gray-400">score {risk.score}/100</span>
                                <span className="text-xs text-gray-500">confidence {(risk.confidence * 100).toFixed(0)}%</span>
                            </div>
                            <ul className="space-y-2">
                                {risk.findings?.map((f, i) => (
                                    <li key={i} className="rounded-md border border-white/5 bg-white/[0.02] p-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs uppercase ${f.severity === 'critical' ? 'text-red-400' : f.severity === 'high' ? 'text-amber-400' : 'text-gray-400'}`}>
                                                {f.severity}
                                            </span>
                                            <span className="text-xs text-gray-500">{f.code}</span>
                                        </div>
                                        <p className="mt-1 text-sm text-gray-300">{f.message}</p>
                                        {f.evidenceUrl && <a href={f.evidenceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-emerald-400 hover:underline">{f.evidenceUrl}</a>}
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            )}

            {tab === 'Score' && (
                <div className="card p-3">
                    {!score ? <p className="text-center text-sm text-gray-500">No score computed yet.</p> : (
                        <>
                            <p className="text-4xl font-semibold text-white">{score.total}<span className="text-lg text-gray-500">/100</span></p>
                            <div className="mt-3 space-y-2">
                                {Object.entries(score.breakdown ?? {}).map(([k, v]) => (
                                    <div key={k} className="flex items-center gap-3 text-sm">
                                        <span className="w-48 truncate text-gray-400">{k.replace(/_/g, ' ')}</span>
                                        <div className="h-2 flex-1 rounded-full bg-white/5">
                                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, v?.value ?? 0)}%` }} />
                                        </div>
                                        <span className="w-12 text-right text-gray-300">{v?.value ?? '—'}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}