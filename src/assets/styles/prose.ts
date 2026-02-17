import type { TypographyOptions } from '@unocss/preset-typography'

export const typographyConfig: TypographyOptions = {
    // Base color scheme using theme variables
    colorScheme: {
        body: 'hsl(var(--muted-foreground))',
        headings: 'hsl(var(--foreground))',
        links: 'hsl(var(--accent))',
        bold: 'hsl(var(--foreground))',
        hr: 'hsl(var(--border))',
    },

    // Extend with custom styles
    cssExtend: {
        // ========== Headings with Anchor Links ==========
        'h2, h3, h4, h5, h6': {
            'scroll-margin-top': '4rem',
            fontWeight: '600',
            lineHeight: '1.3',
        },
        'h2': {
            borderBottom: '1px solid hsl(var(--border))',
            paddingBottom: '0.3rem',
        },

        // Anchor link icons that appear on heading hover
        'h1>a, h2>a, h3>a, h4>a, h5>a, h6>a': {
            'margin-inline-start': '0.75rem',
            color: 'hsl(var(--muted-foreground))',
            transition: 'opacity 0.2s ease',
            opacity: '0',
            'user-select': 'none',
            textDecoration: 'none',
            borderBottom: 'none',
        },
        'h1>a:hover, h2>a:hover, h3>a:hover, h4>a:hover, h5>a:hover, h6>a:hover': {
            opacity: '1',
            color: 'hsl(var(--accent))',
        },
        'h1>a:focus, h2>a:focus, h3>a:focus, h4>a:focus, h5>a:focus, h6>a:focus': {
            opacity: '1',
        },
        'h1:target>a, h2:target>a, h3:target>a, h4:target>a, h5:target>a, h6:target>a': {
            opacity: '1',
        },

        // ========== Links ==========
        'a': {
            'word-wrap': 'break-word',
            'word-break': 'break-word',
            'overflow-wrap': 'anywhere',
            textDecoration: 'none',
            borderBottom: '1px solid transparent',
            transition: 'border-color 0.2s ease',
        },
        'a:hover': {
            borderBottom: '1px solid hsl(var(--accent))',
        },

        // ========== Inline Code ==========
        ':not(pre) > code': {
            'white-space': 'pre-wrap',
            'word-break': 'break-all',
            backgroundColor: 'hsl(var(--muted))',
            padding: '0.3em 0.5em',
            borderRadius: '0.375rem',
            fontSize: '0.875em',
            border: '1px solid hsl(var(--border))',
        },
        ':not(pre)>code::before': {
            content: 'none',
        },
        ':not(pre)>code::after': {
            content: 'none',
        },

        // ========== Code Blocks ==========
        'pre': {
            backgroundColor: 'hsl(var(--muted) / 0.5)',
            padding: '1rem',
            borderRadius: '0.5rem',
            overflow: 'auto',
            border: '1px solid hsl(var(--border))',
        },
        'pre code': {
            backgroundColor: 'transparent',
            padding: '0',
            border: 'none',
            fontSize: '0.9em',
            color: 'inherit',
        },

        // ========== Blockquotes ==========
        'blockquote': {
            position: 'relative',
            overflow: 'hidden',
            borderInlineStartColor: 'hsl(var(--accent))',
            borderLeftColor: 'hsl(var(--accent))',
            borderRadius: '0.75rem',
            padding: '1rem 1.6rem',
            backgroundColor: 'hsl(var(--muted) / 0.3)',
            margin: '1.5rem 0',
            fontStyle: 'normal',
        },
        'blockquote::after': {
            color: 'hsl(var(--muted-foreground))',
            position: 'absolute',
            content: '"”"',
            top: '2.6rem',
            right: '-1.4rem',
            fontSize: '10rem',
            fontFamily: 'Georgia, serif',
            transform: 'rotate(-15deg)',
            opacity: '0.1',
            pointerEvents: 'none',
        },

        // ========== Lists ==========
        'ul, ol': {
            paddingInlineStart: '1.625em',
        },
        'li': {
            marginTop: '.5em',
            marginBottom: '.5em',
        },
        'li::marker': {
            color: 'hsl(var(--accent) / 0.7)',
        },

        // ========== Tables ==========
        'table': {
            fontSize: '.875em',
            width: '100%',
            borderCollapse: 'collapse',
        },
        'thead': {
            backgroundColor: 'hsl(var(--muted) / 0.5)',
        },
        'table tr': {
            borderBottom: '1px solid hsl(var(--border))',
        },
        'tbody tr:last-child': {
            borderBottom: 'none',
        },
        'thead th': {
            fontWeight: '500',
            color: 'hsl(var(--foreground))',
            padding: '0.75rem 1rem',
            textAlign: 'left',
        },
        'td, th': {
            padding: '0.75rem 1rem',
        },

        // ========== Images ==========
        'img': {
            borderRadius: '0.75rem',
            margin: '1.5rem auto',
            boxShadow: 'var(--un-shadow-md)',
            display: 'block',
            maxWidth: '100%',
            height: 'auto',
        },

        // ========== Keyboard Input ==========
        'kbd': {
            borderColor: 'hsl(var(--border))',
            backgroundColor: 'hsl(var(--muted))',
            padding: '0.2rem 0.4rem',
            borderRadius: '0.25rem',
            fontSize: '0.875em',
            boxShadow: '0 0 0 1px hsl(var(--card)), 0 3px hsl(var(--card))',
        },

        // ========== Superscript & Footnotes ==========
        'sup>a': {
            'scroll-margin-top': '4rem',
        },

        // ========== Dark Mode Adjustments ==========
        '.dark blockquote': {
            backgroundColor: 'hsl(var(--muted) / 0.15)',
        },
        '.dark pre': {
            backgroundColor: 'hsl(var(--muted) / 0.2)',
        },
        '.dark code': {
            backgroundColor: 'hsl(var(--muted) / 0.3)',
        },

        // ========== Responsive ==========
        '@media (max-width: 640px) blockquote::after': {
            fontSize: '8rem',
            top: '2rem',
            right: '-1rem',
        },
    },
}

export default typographyConfig