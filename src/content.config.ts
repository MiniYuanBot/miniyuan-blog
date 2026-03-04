import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { BlogPostSchema, NotePostSchema } from './schemas';

const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) => BlogPostSchema(image),
});

const note = defineCollection({
	loader: glob({ base: './src/content/note', pattern: '**/*.{md,mdx}' }),
	schema: ({ image }) => NotePostSchema(image),
});

export const collections = { blog, note };