import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ListChecks } from 'lucide-react';
import { api } from '../lib/api';
import { fmtDay } from '../lib/format';
import { Button, Input, Select, Modal, Spinner, ErrorBox, EmptyState } from '../components/UI';
import { useToast } from '../components/Toast';

const TYPES = ['social', 'testnet', 'on-chain', 'referral', 'kyc', 'snapshot', 'claim', 'research', 'other'];
const STATUSES = ['not_started', 'in_progress', 'completed', 'skipped', 'blocked'];

export default function Tasks() {
    const qc = useQueryClient();
    const toast = useToast();
    const [showCreate, setShowCreate] = useState(false);
    const [filter, setFilter] = useState('');

    const tasks = useQuery({ queryKey: ['tasks'], queryFn: () => api.get('/tasks') });
    const projects = useQuery({ queryKey: ['projects-lite'], queryFn: () => api.get('/airdrops?limit=100') });

    const create = useMutation({
        mutationFn: (b) => api.post('/tasks', b),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Task created'); setShowCreate(false); },
        onError: (e) => toast.error(e.message),
    });

    const updateParticip = useMutation({
        mutationFn: ({ taskId, body }) => api.put(`/tasks/${taskId}/participation`, body),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Updated'); },
        onError: (e) => toast.error(e.message),
    });

    const items = (tasks.data?.data ?? []).filter((t) => !filter || t.type === filter);

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold text-white">Tasks</h1>
                    <p className="text-sm text-gray-400">Airdrop campaign steps and deadlines</p>
                </div>
                <Button onClick={() => setShowCreate(true)}><Plus size={14} /> New task</Button>
            </div>
            <div className="card p-3">
                <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-[240px]">
                    <option value="">All types</option>
                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
            </div>

            {tasks.isLoading ? <Spinner /> : tasks.isError ? <ErrorBox error={tasks.error} /> : (
                items.length === 0 ? (
                    <div className="card p-6"><EmptyState icon={ListChecks} title="No tasks yet" message="Add tasks per project to track what's needed." /></div>
                ) : (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {items.map((t) => (
                            <div key={t._id} className="card p-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="truncate font-medium text-white">{t.title}</p>
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            <span className="badge-gray">{t.type}</span>
                                            {t.deadline && <span className="badge-yellow">due {fmtDay(t.deadline)}</span>}
                                        </div>
                                    </div>
                                </div>
                                {t.description && <p className="mt-2 line-clamp-2 text-xs text-gray-400">{t.description}</p>}
                                <div className="mt-3 flex gap-1">
                                    {STATUSES.map((s) => (
                                        <button
                                            key={s}
                                            className={`rounded px-2 py-1 text-xs ${s === 'completed' ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-gray-400 hover:bg-white/5'}`}
                                            onClick={() => updateParticip.mutate({ taskId: t._id, body: { taskStatus: s } })}
                                        >
                                            {s.replace(/_/g, ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            <CreateTaskModal
                open={showCreate}
                onClose={() => setShowCreate(false)}
                projects={projects.data?.data ?? []}
                onSubmit={(v) => create.mutate(v)}
                loading={create.isPending}
            />
        </div>
    );
}

function CreateTaskModal({ open, onClose, onSubmit, loading, projects }) {
    const [form, setForm] = useState({ title: '', description: '', type: 'social', projectId: '', deadline: '', officialUrl: '' });
    function submit(e) {
        e.preventDefault();
        onSubmit({
            title: form.title.trim(),
            description: form.description || null,
            type: form.type,
            projectId: form.projectId || null,
            deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
            officialUrl: form.officialUrl || null,
        });
    }
    return (
        <Modal open={open} onClose={onClose} title="New task" footer={
            <><Button variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" form="new-task" loading={loading}>Create</Button></>
        }>
            <form id="new-task" onSubmit={submit} className="space-y-3">
                <Input label="Title *" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
                <Select label="Project (optional)" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
                    <option value="">— none —</option>
                    {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </Select>
                <Input label="Deadline" type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
                <Input label="Official URL" type="url" value={form.officialUrl} onChange={(e) => setForm({ ...form, officialUrl: e.target.value })} />
            </form>
        </Modal>
    );
}