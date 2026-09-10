// unocss.config.ts
import { defineConfig, presetWind3, presetTypography, type Rule, type Variant } from 'unocss'
import type { Theme } from '@unocss/preset-wind3'
import { shortcuts, typographyConfig } from './src/assets/styles'

const accent = 'hsl(var(--accent) / <alpha-value>)'
const accentDark = 'hsl(var(--accent-dark) / <alpha-value>)'

const background = 'hsl(var(--background) / <alpha-value>)'
const foreground = 'hsl(var(--foreground) / <alpha-value>)'

const gray = 'hsl(var(--gray) / <alpha-value>)'
const grayLight = 'hsl(var(--gray-light) / <alpha-value>)'
const grayDark = 'hsl(var(--gray-dark) / <alpha-value>)'

const muted = 'hsl(var(--muted) / <alpha-value>)'
const mutedForeground = 'hsl(var(--muted-foreground) / <alpha-value>)'
const border = 'hsl(var(--border) / <alpha-value>)'
const card = 'hsl(var(--card) / <alpha-value>)'
const cardForeground = 'hsl(var(--card-foreground) / <alpha-value>)'


const themeColors = {
    background: background,
    foreground: foreground,
    border: border,

    accent: {
        DEFAULT: accent,
        dark: accentDark
    },

    gray: {
        DEFAULT: gray,
        light: grayLight,
        dark: grayDark
    },

    muted: {
        DEFAULT: muted,
        foreground: mutedForeground
    },

    card: {
        DEFAULT: card,
        foreground: cardForeground
    }
}

const themeShadow = {
    'DEFAULT': '0 1px 3px 0 hsl(var(--gray) / 0.1), 0 1px 2px -1px hsl(var(--gray) / 0.1)',
    'sm': '0 1px 2px 0 hsl(var(--gray) / 0.1)',
    'md': '0 4px 6px -1px hsl(var(--gray) / 0.1), 0 2px 4px -2px hsl(var(--gray) / 0.1)',
    'lg': '0 10px 15px -3px hsl(var(--gray) / 0.2), 0 4px 6px -4px hsl(var(--gray) / 0.2)',
    'xl': '0 20px 25px -5px hsl(var(--gray) / 0.2), 0 8px 10px -6px hsl(var(--gray) / 0.2)',
    'card': '0 2px 8px 0 hsl(var(--gray) / 0.1)',
    'card-hover': '0 8px 16px 0 hsl(var(--gray) / 0.2)',
}

const theme = {
    colors: themeColors,
    fontFamily: {
        sans: 'Atkinson, sans-serif'
    },
    boxShadow: themeShadow,
} satisfies Partial<Theme>

const rules: Rule<object>[] = [
    ['scrollbar-thin', {
        'scrollbar-width': 'thin'
    }]
]

/**
 * Make `hover:` mean "the pointer is hovering", not "the viewport is wide".
 *
 * `preset-wind3` compiles `hover:bg-x` to a bare `:hover` and `group-hover:x`
 * to `.group:hover .group-hover\:x`, with no pointer check. Touch browsers
 * apply `:hover` on tap and then keep it applied until something else is
 * tapped, so every hover decoration became a *stuck* state on phones: a tapped
 * card kept its accent-coloured title, a tapped chip kept its grey background,
 * the image stayed zoomed and the theme toggle stayed highlighted.
 *
 * Gating on `@media (hover: hover)` is the correct tool — `md:` is a viewport
 * width query, which is neither necessary (a narrow desktop window can hover)
 * nor sufficient (a touch tablet is 768px wide but cannot).
 *
 * IMPORTANT: these variants replace the preset's, so they must reproduce
 * **both** halves of what it does — strip the `hover:` prefix to find the rule,
 * *and* transform the selector. Adding the media query without re-appending
 * `:hover` produces `.hover\:-translate-y-2{…}`, i.e. the hover state applied
 * unconditionally on every pointer-capable device.
 *
 * `order: -1` puts these ahead of the preset's own variants, so the `hover:`
 * prefix is consumed here first and the preset's variant never runs.
 */
const pointerVariants: Variant[] = [
    {
        name: 'hover',
        order: -1,
        match: (matcher) => {
            if (!matcher.startsWith('hover:')) return matcher
            return {
                matcher: matcher.slice('hover:'.length),
                selector: (selector: string) => `${selector}:hover`,
                parent: '@media (hover: hover)',
            }
        },
    },
    {
        name: 'group-hover',
        order: -1,
        match: (matcher) => {
            if (!matcher.startsWith('group-hover:')) return matcher
            return {
                matcher: matcher.slice('group-hover:'.length),
                selector: (selector: string) => `.group:hover ${selector}`,
                parent: '@media (hover: hover)',
            }
        },
    },
]

export default defineConfig({
    presets: [
        presetWind3(),
        presetTypography(typographyConfig)
    ],
    rules,
    theme,
    variants: pointerVariants,
    shortcuts,
    safelist: [
        'prose',
        'dark:prose-invert',
        // Animation utilities live in src/assets/styles/global.css so that the
        // `prefers-reduced-motion` override can beat them by source order.
        'animate-fade-in',
        'animate-fade-in-up',
        'animate-toast-in',
    ]
})