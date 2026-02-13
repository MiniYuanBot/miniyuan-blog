import type { z } from 'astro:content';
import type { HeaderConfigSchema } from '../schemas';
import { siteConfig } from './site-config';


export const headerConfig = {
    left: {
        title: siteConfig.title,
        link: '/',
    },
    center: [
        { title: 'Blog', link: '/blog' },
        { title: 'Tags', link: '/tags' },
        { title: 'Links', link: '/links' },
        { title: 'About', link: '/about' },
    ],
    right: [
        { title: 'Home', link: '/', icon: "home" },
        { title: 'Search', link: '/search', icon: "search" },
    ],
} satisfies z.infer<typeof HeaderConfigSchema>;