import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { BlogPostSchema } from './schemas';

const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) => BlogPostSchema(image),
});

export const collections = { blog };