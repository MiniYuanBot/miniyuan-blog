import { z } from 'astro:content';

export const LinkItemSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
    url: z.string().url(),
    avatar: z.string().url().optional(),
    target: z.enum(['_blank', '_self']).default('_blank'),
});

export const LinkCardSchema = z.object({
    title: z.string().default('Links'),
    links: z.array(LinkItemSchema),
    description: z.string().optional(),
    icon: z.string().optional(),
});

export const LinkConfigSchema = z.array(LinkCardSchema);

export type LinkItem = z.infer<typeof LinkItemSchema>;
export type LinkCard = z.infer<typeof LinkCardSchema>;
export type LinkConfig = z.infer<typeof LinkConfigSchema>;