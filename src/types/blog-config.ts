import type { z } from 'astro:content';
import type { BlogPostSchema } from '../schemas/blog';

export const blogConfig = {
    contentPath: './src/content/blog',
    pageSize: 8,
    showToc: true,
    showPrevNext: true,
} as const;

export type BlogPost = z.infer<ReturnType<typeof BlogPostSchema>>;