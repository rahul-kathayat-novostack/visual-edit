// ─────────────────────────────────────────────────────────────────────────────
// Visual Editor — IEditorAdapter
// The adapter interface. Any backend must implement this to work with the editor.
// Swap implementations to target Next.js API routes, WebSocket, Electron IPC, etc.
// ─────────────────────────────────────────────────────────────────────────────

import type { EditSourcePayload } from '../core/types';

export interface IEditorAdapter {
    /**
     * Persist a source-code change (text content, className, image src, etc.)
     * to the target file on disk.
     */
    editSource(payload: EditSourcePayload): Promise<void>;

    /**
     * Upload an image file and return the public URL to use as src / background-image.
     */
    uploadFile(file: File): Promise<string>;
}
