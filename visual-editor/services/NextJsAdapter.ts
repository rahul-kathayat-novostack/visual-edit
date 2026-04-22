// ─────────────────────────────────────────────────────────────────────────────
// Visual Editor — NextJsAdapter
// Default IEditorAdapter implementation that talks to the Next.js API routes.
//
// THIS IS THE ONLY FILE IN THE ENTIRE PACKAGE THAT CALLS fetch().
// ─────────────────────────────────────────────────────────────────────────────

import type { IEditorAdapter } from './IEditorAdapter';
import type { EditSourcePayload } from '../core/types';

export class NextJsAdapter implements IEditorAdapter {
    /**
     * @param baseUrl  Base path for API routes. Defaults to '' (same origin).
     *                 Override to point at a different host/port.
     */
    constructor(private readonly baseUrl: string = '') {}

    async editSource(payload: EditSourcePayload): Promise<void> {
        const res = await fetch(`${this.baseUrl}/api/edit-source`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(`[NextJsAdapter] editSource failed (${res.status}): ${body?.error ?? res.statusText}`);
        }
    }

    async uploadFile(file: File): Promise<string> {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`${this.baseUrl}/api/upload`, {
            method: 'POST',
            body: formData,
        });
        if (!res.ok) {
            throw new Error(`[NextJsAdapter] uploadFile failed (${res.status}): ${res.statusText}`);
        }
        const data = await res.json();
        if (!data.url) throw new Error('[NextJsAdapter] Upload response missing "url" field');
        return data.url as string;
    }
}
