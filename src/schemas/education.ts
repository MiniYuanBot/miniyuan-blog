import { z } from 'astro:content';
import { ImagePathSchema } from './data';

export const EducationItemSchema = z.object({
    school: z.string(),
    period: z.string(),
    location: z.string(),
    description: z.string(),
    logo: ImagePathSchema,
});

export const EducationConfigSchema = z.array(EducationItemSchema);