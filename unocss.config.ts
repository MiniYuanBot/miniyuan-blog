// unocss.config.ts
import type { TypographyOptions } from '@unocss/preset-typography'
import { defineConfig, presetWind3, presetTypography, type Rule } from 'unocss'
import type { Theme } from '@unocss/preset-wind3'
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
    ['animate-fade-in-up', {
        animation: 'fade-in-up 300ms forwards'
    }],

    ['scrollbar-thin', {
        'scrollbar-width': 'thin'
    }]
]

export default defineConfig({
    presets: [
        presetWind3(),
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