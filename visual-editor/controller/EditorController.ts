// ─────────────────────────────────────────────────────────────────────────────
// Visual Editor — EditorController
// The mediator between UI events and adapter calls.
//
// Responsibilities:
//   • Read data-source-file / data-line / data-col from DOM elements
//   • Push to HistoryManager before every mutation (for undo)
//   • Forward the normalized payload to the adapter
//   • Handle undo by popping history and calling adapter with the old value
//
// The UI components NEVER call fetch() or touch the adapter directly.
// ─────────────────────────────────────────────────────────────────────────────

import type { IEditorAdapter } from '../services/IEditorAdapter';
import { historyManager } from '../core/HistoryManager';
import type { EditSourcePayload } from '../core/types';

function getSourceAttrs(el: HTMLElement): { filePath: string; line: string; column: string } | null {
    const filePath = el.getAttribute('data-source-file');
    const line = el.getAttribute('data-line');
    const column = el.getAttribute('data-col');
    if (!filePath || !line || !column) return null;
    return { filePath, line, column };
}

export class EditorController {
    constructor(private readonly adapter: IEditorAdapter) {}

    // ── Text content edit ─────────────────────────────────────────────────────

    async applyTextEdit(element: HTMLElement, newValue: string, oldValue: string): Promise<void> {
        const attrs = getSourceAttrs(element);
        if (!attrs) return;

        historyManager.push({
            filePath: attrs.filePath,
            line: attrs.line,
            column: attrs.column,
            value: oldValue,
            type: 'text',
        });

        await this.adapter.editSource({
            ...attrs,
            newValue,
            type: 'text',
        });
    }

    // ── className / style attribute update ────────────────────────────────────

    async applyStyleEdit(element: HTMLElement, newClassName: string, oldClassName: string): Promise<void> {
        const attrs = getSourceAttrs(element);
        if (!attrs) return;

        historyManager.push({
            filePath: attrs.filePath,
            line: attrs.line,
            column: attrs.column,
            value: oldClassName,
            type: 'update-attribute',
            attributeName: 'className',
        });

        await this.adapter.editSource({
            ...attrs,
            newValue: newClassName,
            type: 'update-attribute',
            attributeName: 'className',
        });
    }

    // ── Image src update ──────────────────────────────────────────────────────

    async applyImageSrc(element: HTMLElement, newSrc: string, oldSrc: string): Promise<void> {
        const attrs = getSourceAttrs(element);
        if (!attrs) return;

        historyManager.push({
            filePath: attrs.filePath,
            line: attrs.line,
            column: attrs.column,
            value: oldSrc,
            type: 'image-src',
        });

        await this.adapter.editSource({
            ...attrs,
            newValue: newSrc,
            type: 'image-src',
        });
    }

    // ── Image upload ──────────────────────────────────────────────────────────

    async uploadImage(file: File): Promise<string> {
        return this.adapter.uploadFile(file);
    }

    // ── Undo ──────────────────────────────────────────────────────────────────

    async undo(): Promise<void> {
        const last = historyManager.pop();
        if (!last) {
            console.log('[EditorController] Nothing to undo');
            return;
        }

        console.log('[EditorController] Undoing', last);

        const payload: EditSourcePayload = {
            filePath: last.filePath,
            line: last.line,
            column: last.column,
            newValue: last.value,
            type: last.type,
            ...(last.attributeName ? { attributeName: last.attributeName } : {}),
        };

        await this.adapter.editSource(payload);
    }
}
