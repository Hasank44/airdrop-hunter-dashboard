import clsx from 'clsx';
import { X, Loader2 } from 'lucide-react';

export function Button({ variant = 'primary', size, className, loading, children, ...rest }) {
    const variants = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        danger: 'btn-danger',
        ghost: 'btn-ghost',
    };
    return (
        <button className={clsx(variants[variant], size === 'sm' && 'btn-sm', className)} disabled={loading || rest.disabled} {...rest}>
            {loading && <Loader2 size={14} className="animate-spin" />}
            {children}
        </button>
    );
}

export function Input({ label, error, className, ...rest }) {
    return (
        <div>
            {label && <label className="label">{label}</label>}
            <input className={clsx('input', error && 'border-red-500/50', className)} {...rest} />
            {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        </div>
    );
}

export function Select({ label, error, className, children, ...rest }) {
    return (
        <div>
            {label && <label className="label">{label}</label>}
            <select className={clsx('input', error && 'border-red-500/50', className)} {...rest}>
                {children}
            </select>
            {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        </div>
    );
}

export function Textarea({ label, error, className, ...rest }) {
    return (
        <div>
            {label && <label className="label">{label}</label>}
            <textarea className={clsx('input min-h-[80px]', error && 'border-red-500/50', className)} {...rest} />
            {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        </div>
    );
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
    if (!open) return null;
    const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm">
            <div className={clsx('w-full', sizes[size], 'card max-h-[90vh] overflow-hidden flex flex-col')}>
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h2 className="text-lg font-semibold text-white">{title}</h2>
                    <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-white/5 hover:text-white">
                        <X size={18} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto py-4">{children}</div>
                {footer && <div className="flex justify-end gap-2 border-t border-white/10 pt-3">{footer}</div>}
            </div>
        </div>
    );
}

export function Confirm({ open, onClose, onConfirm, title, message, loading }) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button variant="danger" onClick={onConfirm} loading={loading}>Confirm</Button>
                </>
            }
        >
            <p className="text-gray-300">{message}</p>
        </Modal>
    );
}

export function Spinner({ label = 'Loading…' }) {
    return (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-400">
            <Loader2 size={16} className="animate-spin" /> {label}
        </div>
    );
}

export function ErrorBox({ error }) {
    return (
        <div className="card border-red-500/30 bg-red-500/5 text-red-300">
            <p className="text-sm">{error?.message || String(error)}</p>
        </div>
    );
}

export function EmptyState({ icon: Icon, title, message, action }) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            {Icon && <Icon size={32} className="text-gray-500" />}
            <h3 className="text-base font-medium text-white">{title}</h3>
            {message && <p className="max-w-md text-sm text-gray-400">{message}</p>}
            {action}
        </div>
    );
}