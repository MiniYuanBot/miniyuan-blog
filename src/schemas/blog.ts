import { z } from 'astro:content';
import { DateSchema, OptionalDateSchema } from './data';

export const BlogPostSchema = (image: any) => z.object({
    title: z.string(),
    description: z.string(),
    author: z.string().optional(),
    pubDate: DateSchema,
    updatedDate: OptionalDateSchema,
    heroImage: image().optional(),
});