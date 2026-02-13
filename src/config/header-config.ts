import type { z } from 'astro:content';
import type { HeaderConfigSchema } from '../schemas';
import { siteConfig } from './site-config';
import { ICONS, type IconKey } from '../components/icons'



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
        { title: 'Home', link: '/', svg: ICONS.home },
        { title: 'Search', link: '/search', svg: ICONS.search },
    ],
} satisfies z.infer<typeof HeaderConfigSchema>;