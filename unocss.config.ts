// unocss.config.ts
import type { TypographyOptions } from '@unocss/preset-typography'
import { defineConfig, presetMini, presetTypography, type Rule } from 'unocss'
import type { Theme } from '@unocss/preset-mini'
import { shortcuts } from './src/assets/styles'

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


const typographyConfig: TypographyOptions = {
    colorScheme: {
        body: mutedForeground,
        headings: foreground,
        links: accent,
        bold: foreground,
        hr: border,
    },
    // cssExtend: {}
}

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

const theme = {
    colors: themeColors,
    fontFamily: {
        sans: 'Atkinson, sans-serif'
    },
    // boxShadow: {
    //     DEFAULT: 'var(--box-shadow)'
    // }
} satisfies Partial<Theme>

const rules: Rule<object>[] = [
    ['animate-fade-in-up', {
        animation: 'fade-in-up 300ms forwards'
    }],

    ['scrollbar-thin', {
        'scrollbar-width': 'thin'
    }]
]

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