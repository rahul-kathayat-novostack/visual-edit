'use client';
// ─────────────────────────────────────────────────────────────────────────────
// Visual Editor — EditorContext
// React context that holds the active EditorController instance.
// Wrap your app with <EditorProvider> once; consume with useEditorController().
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useMemo } from 'react';
import { EditorController } from '../controller/EditorController';
import { getAdapter } from '../services';

const EditorControllerContext = createContext<EditorController | null>(null);

/** Provides an EditorController instance to the component tree. */
export function EditorProvider({ children }: { children: React.ReactNode }) {
    // Memoize so the controller instance is stable across re-renders.
    const controller = useMemo(() => new EditorController(getAdapter()), []);
    return (
        <EditorControllerContext.Provider value={controller}>
            {children}
        </EditorControllerContext.Provider>
    );
}

/** Returns the active EditorController. Must be used inside <EditorProvider>. */
export function useEditorController(): EditorController {
    const ctx = useContext(EditorControllerContext);
    if (!ctx) throw new Error('[visual-editor] useEditorController must be used inside <EditorProvider>');
    return ctx;
}
