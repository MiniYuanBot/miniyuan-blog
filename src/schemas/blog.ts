import { z, type ImageFunction } from 'astro:content';
import { DateSchema, OptionalDateSchema } from './data';

export const BlogPostSchema = (image: ImageFunction) => z.object({
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