import { z } from 'astro:content';

export const SkillItemSchema = z.object({
    category: z.string(),
    items: z.array(z.string()),
});

export const SkillCardSchema = z.object({
    title: z.string().default('Skills'),
    skills: z.array(SkillItemSchema),
    showHeader: z.boolean().default(false),
    padding: z.enum(['none', 'sm', 'md', 'lg', 'xl']).default('md'),
    hover: z.boolean().default(true),
});

export const SkillCardConfigSchema = z.array(SkillCardSchema);

export type SkillItem = z.infer<typeof SkillItemSchema>;
export type SkillCard = z.infer<typeof SkillCardSchema>;
export type SkillCardConfig = z.infer<typeof SkillCardConfigSchema>;