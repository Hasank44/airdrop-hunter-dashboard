import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './UI';

export default function Pagination({ page, pages, total, onPage }) {
    if (!pages || pages <= 1) return null;
    return (
        <div className="flex items-center justify-between text-sm text-gray-400">
            <span>{total} total · page {page} of {pages}</span>
            <div className="flex gap-1">
                <Button variant="secondary" size="sm" onClick={() => onPage(page - 1)} disabled={page <= 1}>
                    <ChevronLeft size={14} /> Prev
                </Button>
                <Button variant="secondary" size="sm" onClick={() => onPage(page + 1)} disabled={page >= pages}>
                    Next <ChevronRight size={14} />
                </Button>
            </div>
        </div>
    );
}