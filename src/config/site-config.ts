import type { z } from 'astro:content';
import type { SiteConfigSchema } from '../schemas';

export const siteConfig = {
    title: 'MINIYUAN',
    description: "Welcome to miniyuan's blog",
    favicon: '/favicon.svg',
} satisfies z.infer<typeof SiteConfigSchema>;

export type SiteConfig = z.infer<typeof SiteConfigSchema>;