import type { z } from 'astro:content';
import type { LinkConfigSchema } from '../schemas';

export const linkConfig = [
    {
        title: "Friend Links",
        links: [
            {
                title: "Astro",
                description: "The web framework for content-driven websites",
                url: "https://astro.build",
                avatar: "https://astro.build/favicon.svg",
                target: "_blank",
            },
            {
                title: "Vue.js",
                description: "The Progressive JavaScript Framework",
                url: "https://vuejs.org",
                avatar: "https://vuejs.org/logo.svg",
                target: "_blank",
            },
            {
                title: "React",
                description: "A JavaScript library for building user interfaces",
                url: "https://react.dev",
                avatar: "https://react.dev/favicon.ico",
                target: "_blank",
            },
            {
                title: "Tailwind CSS",
                description: "A utility-first CSS framework",
                url: "https://tailwindcss.com",
                avatar: "https://tailwindcss.com/favicons/favicon-32x32.png",
                target: "_blank",
            },
            {
                title: "Svelte",
                description: "Cybernetically enhanced web apps",
                url: "https://svelte.dev",
                avatar: "https://svelte.dev/favicon.png",
                target: "_blank",
            },
            {
                title: "Next.js",
                description: "The React Framework for Production",
                url: "https://nextjs.org",
                avatar: "https://nextjs.org/favicon.ico",
                target: "_blank",
            }
        ]
    },
    {
        title: "Tool Box",
        links: [
            {
                title: "VS Code",
                description: "Code editing. Redefined",
                url: "https://code.visualstudio.com",
                target: "_blank",
            },
            {
                title: "GitHub",
                description: "Where the world builds software",
                url: "https://github.com",
                avatar: "https://github.com/favicon.ico",
                target: "_blank",
            },
            {
                title: "Figma",
                description: "The collaborative interface design tool",
                url: "https://figma.com",
                avatar: "https://figma.com/favicon.ico",
                target: "_blank",
            },
            {
                title: "Vercel",
                description: "Develop. Preview. Ship.",
                url: "https://vercel.com",
                avatar: "https://vercel.com/favicon.ico",
                target: "_blank",
            },
            {
                title: "ChatGPT",
                description: "AI-powered conversational assistant",
                url: "https://chat.openai.com",
                target: "_blank",
            },
            {
                title: "Notion",
                description: "All-in-one workspace",
                url: "https://notion.so",
                avatar: "https://notion.so/favicon.ico",
                target: "_blank",
            }
        ]
    },
    {
        title: "Study Resources",
        links: [
            {
                title: "MDN Web Docs",
                description: "Resources for developers, by developers",
                url: "https://developer.mozilla.org",
                avatar: "https://developer.mozilla.org/favicon-48x48.png",
                target: "_blank",
            },
            {
                title: "Stack Overflow",
                description: "Where developers learn, share, & build careers",
                url: "https://stackoverflow.com",
                avatar: "https://stackoverflow.com/favicon.ico",
                target: "_blank",
            },
            {
                title: "CSS-Tricks",
                description: "Tips, tricks, and techniques on using CSS",
                url: "https://css-tricks.com",
                avatar: "https://css-tricks.com/favicon.ico",
                target: "_blank",
            },
            {
                title: "Dev.to",
                description: "Where programmers share ideas and help each other grow",
                url: "https://dev.to",
                avatar: "https://dev.to/favicon.ico",
                target: "_blank",
            }
        ]
    }
] satisfies z.infer<typeof LinkConfigSchema>;

export type LinkConfig = z.infer<typeof LinkConfigSchema>;