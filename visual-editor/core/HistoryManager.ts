// ─────────────────────────────────────────────────────────────────────────────
// Visual Editor — HistoryManager
// Typed wrapper around sessionStorage for undo history.
// ─────────────────────────────────────────────────────────────────────────────

import type { HistoryItem } from './types';

const STORAGE_KEY = 'visual-editor:editHistory';

export class HistoryManager {
    push(item: HistoryItem): void {
        try {
            const history = this._read();
            history.push(item);
            this._write(history);
        } catch (e) {
            console.error('[HistoryManager] push failed', e);
        }
    }

    pop(): HistoryItem | null {
        try {
            const history = this._read();
            if (history.length === 0) return null;
            const item = history.pop()!;
            this._write(history);
            return item;
        } catch (e) {
            console.error('[HistoryManager] pop failed', e);
            return null;
        }
    }

    clear(): void {
        try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
    }

    size(): number {
        try { return this._read().length; } catch { return 0; }
    }

    private _read(): HistoryItem[] {
        return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
    }

    private _write(history: HistoryItem[]): void {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
}

export const historyManager = new HistoryManager();
