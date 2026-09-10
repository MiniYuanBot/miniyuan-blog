import { z } from 'astro/zod'

export const SiteConfigSchema = z.object({
    title: z.string(),
    description: z.string(),
    /** Canonical origin, used for links shown to visitors (e.g. friend links). */
    url: z.string().url().default('https://miniyuan.site'),
    favicon: z.string().default('/favicon.svg'),
    lang: z.enum(['zh-CN', 'en-US']),
    /** Cards per listing page (blog / note indexes and tag pages). */
    postsPerPage: z.number().int().positive().default(10),
});

export type SiteConfig = z.infer<typeof SiteConfigSchema>;
