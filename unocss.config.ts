// unocss.config.ts
import type { TypographyOptions } from '@unocss/preset-typography'
import { defineConfig, presetMini, presetTypography, type Rule } from 'unocss'
import type { Theme } from '@unocss/preset-mini'

const fg = 'hsl(var(--foreground) / <alpha-value>)'
const fgMuted = 'hsl(var(--muted-foreground) / <alpha-value>)'
// const bgMuted = 'hsl(var(--muted) / <alpha-value>)'
const border = 'hsl(var(--border) / <alpha-value>)'
const accent = 'hsl(var(--accent) / <alpha-value>)'
// const card = 'hsl(var(--card) / <alpha-value>)'

const typographyConfig: TypographyOptions = {
    colorScheme: {
        body: fgMuted,
        headings: fg,
        links: accent,
        bold: fg,
        hr: border,
    },
    // cssExtend: {}
}

const themeColors = {
    background: 'hsl(var(--background) / <alpha-value>)',
    foreground: 'hsl(var(--foreground) / <alpha-value>)',

    accent: {
        DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
        dark: 'hsl(var(--accent-dark) / <alpha-value>)'
    },

    // gray: {
    //     DEFAULT: 'hsl(var(--gray) / <alpha-value>)',
    //     light: 'hsl(var(--gray-light) / <alpha-value>)',
    //     dark: 'hsl(var(--gray-dark) / <alpha-value>)'
    // },

    // muted: {
    //     DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
    //     foreground: 'hsl(var(--muted-foreground) / <alpha-value>)'
    // },

    border: 'hsl(var(--border) / <alpha-value>)',
    // card: {
    //     DEFAULT: 'hsl(var(--card) / <alpha-value>)',
    //     foreground: 'hsl(var(--card-foreground) / <alpha-value>)'
    // }
}

const rules: Rule<object>[] = [
    ['animate-fade-in-up', {
        animation: 'fade-in-up 300ms forwards'
    }],

    ['scrollbar-thin', {
        'scrollbar-width': 'thin'
    }]
]

const theme = {
    colors: themeColors,
    fontFamily: {
        sans: 'Atkinson, sans-serif'
    },
    // boxShadow: {
    //     DEFAULT: 'var(--box-shadow)'
    // }
} satisfies Partial<Theme>

const shortcuts = {
    'toggle-button-base': 'box-content size-5 rounded-md border p-1.5 transition-colors',
    'icon-base': 'size-5'
}

export default defineConfig({
    presets: [
        presetMini(),
        presetTypography(typographyConfig)
    ],
    // rules,
    theme,
    shortcuts,
    safelist: [
        'prose',
        'dark:prose-invert',
        'animate-fade-in-up'
    ]
})