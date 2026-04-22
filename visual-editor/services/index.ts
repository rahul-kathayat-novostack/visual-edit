// ─────────────────────────────────────────────────────────────────────────────
// Visual Editor — Services index
// Manages the active adapter singleton and exposes setAdapter() so host apps
// can swap backends (e.g. swap NextJsAdapter for a mock in tests).
// ─────────────────────────────────────────────────────────────────────────────

import { NextJsAdapter } from './NextJsAdapter';
import type { IEditorAdapter } from './IEditorAdapter';

export type { IEditorAdapter };

let _activeAdapter: IEditorAdapter = new NextJsAdapter();

/** Returns the currently active adapter. Used internally by the controller. */
export function getAdapter(): IEditorAdapter {
    return _activeAdapter;
}

/**
 * Replace the active adapter at runtime.
 * Call this in your app entry point if you need a custom backend.
 *
 * @example
 * import { setAdapter } from './visual-editor/services';
 * setAdapter(new MyCustomAdapter());
 */
export function setAdapter(adapter: IEditorAdapter): void {
    _activeAdapter = adapter;
}
