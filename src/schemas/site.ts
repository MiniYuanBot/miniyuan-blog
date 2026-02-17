import { z } from 'astro:content';

export const SiteConfigSchema = z.object({
    title: z.string(),
    description: z.string(),
    favicon: z.string().default('/favicon.svg'),
    lang: z.enum(['zh-CN', 'en-US']),
});