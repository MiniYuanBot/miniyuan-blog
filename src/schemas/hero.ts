import { z } from 'astro:content';
import { ImagePathSchema } from './data';

export const SkillSchema = z.object({
    label: z.string(),
    icon: z.string(),
});

export const HeroConfigSchema = z.object({
    avatarSrc: ImagePathSchema,
    avatarAlt: z.string(),
    name: z.string(),
    tagline: z.string(),
    introduction: z.array(z.string()),
});