import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

const ToastCtx = createContext(null);
let idc = 0;

export function ToastProvider({ children }) {
    const [items, setItems] = useState([]);
    const push = useCallback((kind, message) => {
        const id = ++idc;
        setItems((prev) => [...prev, { id, kind, message }]);
        setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 5000);
    }, []);

    const value = {
        success: (m) => push('success', m),
        error: (m) => push('error', m),
        info: (m) => push('info', m),
        dismiss: (id) => setItems((prev) => prev.filter((i) => i.id !== id)),
    };

    return (
        <ToastCtx.Provider value={value}>
            {children}
            <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
                {items.map((it) => (
                    <div
                        key={it.id}
                        className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-2xl backdrop-blur-md ${it.kind === 'success'
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                : it.kind === 'error'
                                ? 'border-red-500/30 bg-red-500/10 text-red-300'
                                : 'border-blue-500/30 bg-blue-500/10 text-blue-300'
                            }`}
                    >
                        <span className="mt-0.5 shrink-0">
                            {it.kind === 'success' ? <CheckCircle2 size={16} /> : it.kind === 'error' ? <XCircle size={16} /> : <Info size={16} />}
                        </span>
                        <p className="flex-1 text-sm">{it.message}</p>
                        <button onClick={() => value.dismiss(it.id)} className="opacity-60 hover:opacity-100">
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastCtx.Provider>
    );
}
// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastCtx);