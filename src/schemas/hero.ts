import { z } from 'astro:content';
import { ImagePathSchema } from './data';

export const HeroConfigSchema = z.object({
    avatarSrc: ImagePathSchema,
    avatarAlt: z.string(),
    name: z.string(),
    introduction: z.array(z.string()),
});

