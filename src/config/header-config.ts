import type { HeaderConfig } from '../schemas';
import { siteConfig } from './site-config';


export const headerConfig: HeaderConfig = {
    left: {
        title: siteConfig.title,
        link: '/',
    },
    center: [
        { title: 'Blog', link: '/blog' },
        { title: 'Note', link: '/note' },
        { title: 'Tags', link: '/tags' },
        { title: 'Links', link: '/links' },
        { title: 'About', link: '/about' },
    ],
    right: [
        { title: 'Home', link: '/', icon: "home" },
        { title: 'Search', link: '/search', icon: "search" },
    ],
}