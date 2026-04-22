'use client';
// ─────────────────────────────────────────────────────────────────────────────
// Visual Editor — ClickEditor (UI only)
// Handles: enable/disable edit mode, element selection overlay, resize handles,
// double-click inline text editing, and Ctrl+Z undo.
//
// Zero fetch() calls — all persistence goes through EditorController.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState, useRef } from 'react';
import StyleEditorPanel from './StyleEditorPanel';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Code, CornerLeftUp } from 'lucide-react';
import { useEditorController } from './EditorContext';
import type { StyleEditorPanelHandle } from '../core/types';

export default function ClickEditor({ children }: { children?: React.ReactNode }) {
    const controller = useEditorController();

    const [enabled, setEnabled] = useState(false);
    const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
    const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties | null>(null);
    const [textValue, setTextValue] = useState('');

    // ── Global Undo (Ctrl+Z / Cmd+Z) ─────────────────────────────────────────
    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                await controller.undo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [controller]);

    // ── Overlay position tracking ──────────────────────────────────────────────
    useEffect(() => {
        if (!selectedElement) { setOverlayStyle(null); return; }

        let rafId: number | null = null;

        const updateOverlay = () => {
            if (!selectedElement) return;
            const rect = selectedElement.getBoundingClientRect();
            setOverlayStyle({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
        };

        const throttledUpdate = () => {
            if (rafId !== null) return;
            rafId = requestAnimationFrame(() => { updateOverlay(); rafId = null; });
        };

        updateOverlay();
        window.addEventListener('resize', throttledUpdate, { passive: true });
        window.addEventListener('scroll', throttledUpdate, { capture: true, passive: true });
        const observer = new ResizeObserver(throttledUpdate);
        observer.observe(selectedElement);

        return () => {
            window.removeEventListener('resize', throttledUpdate);
            window.removeEventListener('scroll', throttledUpdate, true);
            observer.disconnect();
            if (rafId !== null) cancelAnimationFrame(rafId);
        };
    }, [selectedElement]);

    // ── Click & Double-click handlers ─────────────────────────────────────────
    useEffect(() => {
        if (!enabled) { setSelectedElement(null); return; }

        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target || !target.isConnected) return;

            const isSidebarArea = e.clientX > window.innerWidth - 410;
            const isUI = target.closest('[data-editor-ui="true"]') ||
                target.closest('[data-radix-portal]') ||
                target.closest('[data-radix-popper-content-wrapper]');
            if (isSidebarArea || isUI) return;

            if (target.getAttribute('data-editable') !== 'true') {
                setSelectedElement(null);
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            setSelectedElement(target);
        };

        const handleDoubleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.getAttribute('data-editable') !== 'true') return;
            if (target.tagName === 'HTML' || target.tagName === 'BODY') return;
            if (target.tagName.toLowerCase() === 'img') return;

            e.preventDefault();
            e.stopPropagation();

            const oldValue = target.innerText;
            target.contentEditable = 'true';
            target.focus();
            target.style.outline = 'none';

            const handleBlur = async () => {
                target.contentEditable = 'false';
                const newValue = target.innerText;
                if (newValue !== oldValue) {
                    await controller.applyTextEdit(target, newValue, oldValue);
                }
                target.removeEventListener('blur', handleBlur);
                target.removeEventListener('keydown', handleKeyDown);
            };

            const handleKeyDown = (k: KeyboardEvent) => {
                if (k.key === 'Enter' && !k.shiftKey) { k.preventDefault(); target.blur(); }
                if (k.key === 'Escape') { target.innerText = oldValue; target.blur(); }
            };

            target.addEventListener('blur', handleBlur);
            target.addEventListener('keydown', handleKeyDown);
        };

        document.addEventListener('click', handleClick, true);
        document.addEventListener('dblclick', handleDoubleClick, true);
        return () => {
            document.removeEventListener('click', handleClick, true);
            document.removeEventListener('dblclick', handleDoubleClick, true);
        };
    }, [enabled, controller]);

    // ── Resize handles ────────────────────────────────────────────────────────
    const panelRef = useRef<StyleEditorPanelHandle | null>(null);

    const handleResizeStart = (e: React.MouseEvent, direction: string) => {
        if (!selectedElement) return;
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = selectedElement.offsetWidth;
        const startHeight = selectedElement.offsetHeight;

        const onMouseMove = (moveEvent: MouseEvent) => {
            if (!selectedElement) return;
            const dx = moveEvent.clientX - startX;
            const dy = moveEvent.clientY - startY;
            let newWidth = startWidth;
            let newHeight = startHeight;
            if (direction.includes('e')) newWidth = startWidth + dx;
            if (direction.includes('s')) newHeight = startHeight + dy;
            selectedElement.style.width = `${newWidth}px`;
            selectedElement.style.height = `${newHeight}px`;
            panelRef.current?.updateDimensions(newWidth, newHeight);
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    // ── Style update (called from StyleEditorPanel on Apply) ──────────────────
    const handleStyleUpdate = async (newClassName: string, oldClassName: string, imageSrc?: string, oldImageSrc?: string) => {
        if (!selectedElement) return;

        // Apply className
        selectedElement.className = newClassName;
        selectedElement.style.width = '';
        selectedElement.style.height = '';
        await controller.applyStyleEdit(selectedElement, newClassName, oldClassName);

        // Apply image src if changed
        if (imageSrc !== undefined && imageSrc !== oldImageSrc && selectedElement.tagName === 'IMG') {
            (selectedElement as HTMLImageElement).src = imageSrc;
            await controller.applyImageSrc(selectedElement, imageSrc, oldImageSrc ?? '');
        }
    };

    return (
        <>
            <div data-editable="false" className="relative min-h-screen w-full">
                {children}
            </div>

            {/* Selection overlay */}
            {enabled && selectedElement && overlayStyle && (
                <div data-editor-ui="true">
                    <div
                        data-editor-ui="true"
                        style={{
                            position: 'fixed',
                            ...overlayStyle,
                            pointerEvents: 'none',
                            border: '2px solid #3b82f6',
                            zIndex: 9999,
                        }}
                    >
                        {/* Resize handles */}
                        {(['se', 'e', 's'] as const).map(dir => (
                            <div
                                key={dir}
                                onMouseDown={e => handleResizeStart(e, dir)}
                                style={{
                                    position: 'absolute',
                                    width: '10px',
                                    height: '10px',
                                    background: 'white',
                                    border: '1px solid #3b82f6',
                                    pointerEvents: 'auto',
                                    cursor: `${dir}-resize`,
                                    ...(dir === 'se' ? { bottom: -6, right: -6 } : {}),
                                    ...(dir === 'e' ? { top: '50%', right: -6, transform: 'translateY(-50%)' } : {}),
                                    ...(dir === 's' ? { bottom: -6, left: '50%', transform: 'translateX(-50%)' } : {}),
                                }}
                            />
                        ))}

                        {/* Element label */}
                        <div style={{
                            position: 'absolute', top: -24, left: 0,
                            background: '#3b82f6', color: 'white',
                            fontSize: '12px', padding: '2px 6px',
                            borderRadius: '4px 4px 0 0',
                            pointerEvents: 'none', whiteSpace: 'nowrap',
                        }}>
                            {selectedElement.tagName.toLowerCase()}
                            {selectedElement.id ? `#${selectedElement.id}` : ''}
                        </div>

                        {/* Inline input bar */}
                        {selectedElement && (
                            <div style={{
                                position: 'absolute', top: '100%', left: 0,
                                width: '380px', padding: '4px',
                                pointerEvents: 'auto', marginTop: '6px',
                            }}>
                                <input
                                    type="text"
                                    placeholder="Ask agent..."
                                    value={textValue}
                                    onChange={e => setTextValue(e.target.value)}
                                    className="w-full border bg-white border-gray-400 text-black text-xs shadow-md outline-none p-[12px] rounded-sm"
                                />
                                <span className="flex flex-col justify-center items-center gap-[12px]">
                                    <ArrowUpRight stroke="black" width={20} height={20} className="absolute right-20 top-1/2 -translate-y-1/2 cursor-pointer opacity-60 hover:opacity-100 transition-opacity" />
                                    <div className="absolute right-[72px] top-1/2 -translate-y-1/2 w-[1px] h-8 bg-gray-200" />
                                    <CornerLeftUp
                                        stroke="black" width={20} height={20}
                                        className="absolute right-12 top-1/2 -translate-y-1/2 cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
                                        onClick={e => {
                                            e.stopPropagation();
                                            if (selectedElement?.parentElement) {
                                                const parent = selectedElement.parentElement;
                                                if (parent.tagName !== 'HTML' && parent.tagName !== 'BODY') {
                                                    setSelectedElement(parent as HTMLElement);
                                                }
                                            }
                                        }}
                                    />
                                    <Code stroke="black" width={20} height={20} className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer opacity-60 hover:opacity-100 transition-opacity" />
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Style panel */}
            {enabled && selectedElement && (
                <StyleEditorPanel
                    ref={panelRef}
                    selectedElement={selectedElement}
                    onUpdate={handleStyleUpdate}
                    onClose={() => setSelectedElement(null)}
                />
            )}

            {/* Enable/Disable toggle */}
            <div className="fixed bottom-4 right-4 z-50 flex gap-2" data-editor-ui="true">
                <Button
                    onClick={() => setEnabled(!enabled)}
                    variant={enabled ? 'destructive' : 'default'}
                    className="rounded-full shadow-lg font-bold"
                >
                    {enabled ? 'Disable Edit Mode' : 'Enable Edit Mode'}
                </Button>
            </div>
        </>
    );
}
