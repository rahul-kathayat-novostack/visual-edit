// ─────────────────────────────────────────────────────────────────────────────
// Visual Editor — ClassNameEngine
// Pure functions for parsing and generating Tailwind CSS class strings.
// No React, no DOM, no fetch — fully unit-testable.
// ─────────────────────────────────────────────────────────────────────────────

import type { StylesState } from './types';

// ── Color helpers ─────────────────────────────────────────────────────────────

/** Convert an rgb/rgba string to a lowercase 6-digit hex string. Returns '' for transparent. */
export function rgbToHex(rgb: string): string {
    if (!rgb || rgb === 'rgba(0, 0, 0, 0)' || rgb === 'transparent') return '';
    if (rgb.startsWith('#')) return rgb;
    const rgbValues = rgb.match(/\d+/g);
    if (!rgbValues || rgbValues.length < 3) return '';
    if (rgbValues.length === 4 && rgbValues[3] === '0') return '';
    return '#' + rgbValues.slice(0, 3).map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
}

/** Normalize any color value to a lowercase 6-digit hex string. */
export function normalizeColor(color: string): string {
    if (!color) return color;
    if (color.startsWith('#')) {
        const hex = color.replace('#', '').toLowerCase();
        if (hex.length === 3) return '#' + hex.split('').map(c => c + c).join('');
        return '#' + hex;
    }
    return color;
}

// ── CSS-to-Tailwind mapping helpers ──────────────────────────────────────────

export function mapJustify(val: string): string {
    const map: Record<string, string> = {
        'flex-start': 'justify-start',
        'center': 'justify-center',
        'flex-end': 'justify-end',
        'space-between': 'justify-between',
        'space-around': 'justify-around',
        'space-evenly': 'justify-evenly',
    };
    return map[val] || val;
}

export function mapAlign(val: string): string {
    const map: Record<string, string> = {
        'flex-start': 'items-start',
        'center': 'items-center',
        'flex-end': 'items-end',
        'baseline': 'items-baseline',
        'stretch': 'items-stretch',
    };
    return map[val] || val;
}

export function mapFlexDir(val: string): string {
    if (val === 'row') return 'flex-row';
    if (val === 'column') return 'flex-col';
    return val;
}

export function parseShadow(shadow: string): { size: string; color: string } {
    if (!shadow || shadow === 'none') return { size: '', color: '#000000' };
    const parts = shadow.split(' ');
    const size = parts[2] ? parseInt(parts[2]) + '' : '';
    return { size, color: '#000000' };
}

/**
 * Extract an interaction utility value from the element's class list.
 * e.g. parseInteraction(classList, 'hover', 'scale') reads 'hover:scale-[1.1]' → '1.1'
 */
export function parseInteraction(classList: string[], prefix: string, property: string): string {
    const fullPrefix = `${prefix}:${property}-[`;
    const found = classList.find(c => c.startsWith(fullPrefix));
    if (!found) return '';
    let val = found.substring(fullPrefix.length, found.length - 1);
    if (property === 'rotate') val = val.replace('deg', '');
    if (property === 'opacity') val = (parseFloat(val) * 100).toString();
    return val;
}

// ── Main class-name builder ───────────────────────────────────────────────────

/**
 * Given the element's existing class string and the new style state,
 * produce a new Tailwind class string with only the changed properties replaced.
 */
export function generateTailwindClasses(currentClass: string, s: StylesState): string {
    let classList = currentClass.split(/\s+/).filter(Boolean);

    const removeByPrefix = (prefixes: string[]) => {
        classList = classList.filter(cls => !prefixes.some(p => cls.startsWith(p)));
    };
    const removeByRegex = (regex: RegExp) => {
        classList = classList.filter(cls => !regex.test(cls));
    };

    // Font Size
    removeByPrefix(['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl', 'text-7xl', 'text-8xl', 'text-9xl']);
    removeByRegex(/^text-\[\d+(\.\d+)?(px|rem|em|%)\]$/);
    if (s.fontSize) classList.push(`text-[${s.fontSize}px]`);

    // Font Weight
    removeByPrefix(['font-thin', 'font-extralight', 'font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold', 'font-extrabold', 'font-black']);
    removeByRegex(/^font-\[\d+\]$/);
    if (s.fontWeight) classList.push(`font-[${s.fontWeight}]`);

    // Font Family
    removeByPrefix(['font-sans', 'font-serif', 'font-google-sans']);
    removeByRegex(/^font-\['[^\]]*'\]$/);
    removeByRegex(/^font-\["[^\]]*"\]$/);
    if (s.fontFamily) {
        const fontVal = s.fontFamily.includes(' ') ? `'${s.fontFamily}'` : s.fontFamily;
        classList.push(`font-[${fontVal}]`);
    }

    // Font Style
    removeByPrefix(['italic', 'not-italic']);
    if (s.fontStyle === 'italic') classList.push('italic');

    // Text Decoration
    removeByPrefix(['underline', 'line-through', 'no-underline']);
    if (s.textDecoration === 'underline') classList.push('underline');

    // Text Color
    const tailwindColors = ['black', 'white', 'gray', 'red', 'blue', 'green', 'yellow', 'purple', 'pink', 'indigo', 'cyan', 'teal', 'orange', 'lime', 'emerald', 'sky', 'violet', 'fuchsia', 'rose', 'amber', 'slate', 'zinc', 'neutral', 'stone'];
    removeByRegex(new RegExp(`^text-(${tailwindColors.join('|')})(-\\d+)?$`));
    removeByRegex(/^text-\[#?[0-9a-fA-F]{3,6}\]$/);
    removeByRegex(/^text-\[rgba?\([^\]]+\)\]$/);
    removeByRegex(/^text-\[hsla?\([^\]]+\)\]$/);
    if (s.color) classList.push(`text-[${s.color}]`);

    // Line Height
    removeByPrefix(['leading-']);
    if (s.lineHeight) classList.push(`leading-[${s.lineHeight}]`);

    // Letter Spacing
    removeByPrefix(['tracking-']);
    if (s.letterSpacing) classList.push(`tracking-[${s.letterSpacing}px]`);

    // Text Align
    removeByPrefix(['text-left', 'text-center', 'text-right', 'text-justify']);
    if (s.textAlign && s.textAlign !== 'start') classList.push(`text-${s.textAlign}`);

    // Opacity
    removeByPrefix(['opacity-']);
    if (s.opacity && s.opacity !== '100') classList.push(`opacity-[${s.opacity}%]`);

    // Padding
    removeByPrefix(['p-', 'px-', 'py-', 'pt-', 'pb-', 'pl-', 'pr-', 'ps-', 'pe-']);
    if (s.paddingX) classList.push(`px-[${s.paddingX}px]`);
    if (s.paddingY) classList.push(`py-[${s.paddingY}px]`);

    // Margin
    removeByPrefix(['m-', 'mx-', 'my-', 'mt-', 'mb-', 'ml-', 'mr-', 'ms-', 'me-', '-m-']);
    if (s.marginX) classList.push(`mx-[${s.marginX}px]`);
    if (s.marginY) classList.push(`my-[${s.marginY}px]`);

    // Width / Height
    removeByRegex(/^w-\[[^\]]+\]$/);
    removeByRegex(/^h-\[[^\]]+\]$/);
    if (s.width) classList.push(`w-[${s.width}px]`);
    if (s.height) classList.push(`h-[${s.height}px]`);

    // Object Fit / Position
    removeByPrefix(['object-']);
    if (s.objectFit) {
        const fitMap: Record<string, string> = { cover: 'object-cover', contain: 'object-contain', fill: 'object-fill', 'scale-down': 'object-scale-down' };
        if (fitMap[s.objectFit]) classList.push(fitMap[s.objectFit]);
    }
    if (s.objectPosition) {
        classList.push(`object-[${s.objectPosition.replace(/\s+/g, '_')}]`);
    }

    // Display
    removeByPrefix(['block', 'flex', 'grid', 'inline', 'hidden', 'inline-block', 'inline-flex', 'inline-grid']);
    if (s.display) classList.push(s.display);

    // Flex Direction
    removeByPrefix(['flex-row', 'flex-col']);
    if (s.flexDirection && s.display?.includes('flex')) classList.push(s.flexDirection);

    // Justify Content
    removeByPrefix(['justify-']);
    if (s.justifyContent && (s.display?.includes('flex') || s.display?.includes('grid'))) classList.push(s.justifyContent);

    // Align Items
    removeByPrefix(['items-']);
    if (s.alignItems && (s.display?.includes('flex') || s.display?.includes('grid'))) classList.push(s.alignItems);

    // Gap
    removeByPrefix(['gap-']);
    if (s.gap && (s.display?.includes('flex') || s.display?.includes('grid'))) classList.push(`gap-[${s.gap}px]`);

    // Shadow
    removeByPrefix(['shadow-']);
    removeByRegex(/^shadow(-sm|-md|-lg|-xl|-2xl|-inner|-none)?$/);
    if (s.shadowSize) classList.push(`shadow-[0_4px_${s.shadowSize}px_${s.shadowColor}40]`);

    // Border Width
    removeByRegex(/^border(-[0-9]+)?$/);
    removeByRegex(/^border-\[[^\]]+\]$/);
    if (s.borderWidth) classList.push(`border-[${s.borderWidth}px]`);

    // Border Color
    removeByRegex(new RegExp(`^border-(${tailwindColors.join('|')})(-\\d+)?$`));
    removeByRegex(/^border-\[#?[0-9a-fA-F]{3,6}\]$/);
    removeByRegex(/^border-\[rgba?\([^\]]+\)\]$/);
    if (s.borderColor && s.borderWidth) classList.push(`border-[${s.borderColor}]`);

    // Border Style
    removeByPrefix(['border-solid', 'border-dashed', 'border-dotted', 'border-double', 'border-none']);
    if (s.borderStyle && s.borderWidth) classList.push(`border-${s.borderStyle}`);

    // Border Radius
    removeByPrefix(['rounded-']);
    if (s.borderRadius) classList.push(`rounded-[${s.borderRadius}px]`);

    // Background Color
    removeByRegex(new RegExp(`^bg-(${tailwindColors.join('|')})(-\\d+)?$`));
    removeByRegex(/^bg-\[#?[0-9a-fA-F]{3,6}\]$/);
    removeByRegex(/^bg-\[rgba?\([^\]]+\)\]$/);
    if (s.backgroundColor) classList.push(`bg-[${s.backgroundColor}]`);

    // Background Image
    removeByRegex(/^bg-\[url\([^\)]*\)\]$/);
    if (s.backgroundImage) {
        const url = s.backgroundImage.startsWith('url(')
            ? s.backgroundImage.match(/url\(['"']?([^'"]+)['"']?\)/)?.[1]
            : s.backgroundImage;
        if (url) classList.push(`bg-[url(${url})]`);
    }

    // Transitions
    removeByPrefix(['transition-']);
    const hasInter = s.hoverScale || s.hoverRotate || s.hoverTextColor || s.hoverBgColor ||
        s.hoverOpacity || s.hoverShadow || s.hoverGlow || s.activeScale || s.activeRotate ||
        s.activeTextColor || s.activeBgColor || s.activeOpacity;
    if (hasInter) classList.push('transition-all');

    removeByPrefix(['duration-']);
    if (s.transitionDuration) classList.push(`duration-[${s.transitionDuration}ms]`);

    // Hover utilities
    removeByPrefix(['hover:']);
    if (s.hoverScale) classList.push(`hover:scale-[${s.hoverScale}]`);
    if (s.hoverRotate) classList.push(`hover:rotate-[${s.hoverRotate}deg]`);
    if (s.hoverTextColor) classList.push(`hover:text-[${s.hoverTextColor}]`);
    if (s.hoverBgColor) classList.push(`hover:bg-[${s.hoverBgColor}]`);
    if (s.hoverOpacity) classList.push(`hover:opacity-[${parseFloat(s.hoverOpacity) / 100}]`);
    if (s.hoverShadow) classList.push(`hover:shadow-[0_10px_25px_rgba(0,0,0,0.2)]`);
    if (s.hoverGlow) classList.push(`hover:shadow-[0_0_15px_${s.hoverBgColor || '#3b82f6'}]`);

    // Active utilities
    removeByPrefix(['active:']);
    if (s.activeScale) classList.push(`active:scale-[${s.activeScale}]`);
    if (s.activeRotate) classList.push(`active:rotate-[${s.activeRotate}deg]`);
    if (s.activeTextColor) classList.push(`active:text-[${s.activeTextColor}]`);
    if (s.activeBgColor) classList.push(`active:bg-[${s.activeBgColor}]`);
    if (s.activeOpacity) classList.push(`active:opacity-[${parseFloat(s.activeOpacity) / 100}]`);

    return Array.from(new Set(classList)).join(' ');
}
