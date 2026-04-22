// ─────────────────────────────────────────────────────────────────────────────
// Visual Editor — Public API
// This is the entry point for host applications to consume the package.
// ─────────────────────────────────────────────────────────────────────────────

// Core / Types
export type { StylesState, EditSourcePayload, HistoryItem } from './core/types';
export { generateTailwindClasses, rgbToHex, normalizeColor } from './core/ClassNameEngine';
export { historyManager } from './core/HistoryManager';

// Services
export type { IEditorAdapter } from './services/IEditorAdapter';
export { NextJsAdapter } from './services/NextJsAdapter';
export { setAdapter, getAdapter } from './services';

// Controller
export { EditorController } from './controller/EditorController';

// UI
export { EditorProvider, useEditorController } from './ui/EditorContext';
export { default as ClickEditor } from './ui/ClickEditor';
export { default as StyleEditorPanel } from './ui/StyleEditorPanel';
