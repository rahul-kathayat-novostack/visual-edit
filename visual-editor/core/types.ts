// ─────────────────────────────────────────────────────────────────────────────
// Visual Editor — Shared Types
// All TypeScript types and interfaces for the visual-editor package.
// ─────────────────────────────────────────────────────────────────────────────

/** A single entry in the undo history stack. */
export interface HistoryItem {
    filePath: string;
    line: string;
    column: string;
    /** The previous value to restore on undo. */
    value: string;
    type: 'text' | 'image-src' | 'update-attribute';
    attributeName?: string;
}

/** The full set of style fields managed by the StyleEditorPanel. */
export type StylesState = {
    fontSize: string;
    fontWeight: string;
    color: string;
    lineHeight: string;
    letterSpacing: string;
    fontFamily: string;
    textAlign: string;
    opacity: string;
    paddingX: string;
    paddingY: string;
    marginX: string;
    marginY: string;
    display: string;
    flexDirection: string;
    justifyContent: string;
    alignItems: string;
    gap: string;
    shadowSize: string;
    shadowColor: string;
    borderWidth: string;
    borderColor: string;
    borderStyle: string;
    borderRadius: string;
    backgroundColor: string;
    backgroundImage: string;
    imageSrc: string;
    fontStyle: string;
    textDecoration: string;
    width: string;
    height: string;
    objectFit: string;
    objectPosition: string;
    // Hover Interaction
    hoverScale: string;
    hoverRotate: string;
    hoverTextColor: string;
    hoverBgColor: string;
    hoverOpacity: string;
    hoverShadow: string;
    hoverGlow: string;
    hoverRadius: string;
    // Active Interaction
    activeScale: string;
    activeRotate: string;
    activeTextColor: string;
    activeBgColor: string;
    activeOpacity: string;
    activeRadius: string;
    // Transitions
    transitionDuration: string;
};

/** Ref handle exposed by StyleEditorPanel for external dimension sync. */
export type StyleEditorPanelHandle = {
    updateDimensions: (width: number, height: number) => void;
};

/** The payload sent to the adapter's editSource method. */
export interface EditSourcePayload {
    filePath: string;
    line: string;
    column: string;
    newValue: string;
    type: 'text' | 'image-src' | 'update-attribute';
    attributeName?: string;
}
