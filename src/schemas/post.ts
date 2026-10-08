import { z } from 'astro/zod'
import { type ImageFunction } from 'astro:content';
import { DateSchema, OptionalDateSchema } from './data';

/**
 * Frontmatter of a blog post or a note. The two collections share one schema:
 * they only differ in where they live and how they are listed, so code that
 * renders either one can treat them alike (see `@/utils/content`).
 */
export const PostSchema = (image: ImageFunction) => z.object({
    title: z.string(),
    excerpt: z.string(),
    author: z.string().optional(),
    position: z.string().optional(),
    tags: z.array(z.string()).optional(),
    pubDate: DateSchema,
    updatedDate: OptionalDateSchema,
    heroImageLight: image().optional(),
    heroImageDark: image().optional(),
});

export type PostData = z.infer<ReturnType<typeof PostSchema>>;
