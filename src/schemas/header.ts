import { z } from 'astro:content';
import { ICONS, type IconKey } from '@/components/icons';

export const HeaderBaseSchema = z.object({
    title: z.string(),
    link: z.string(),
});

export const HeaderConfigSchema = z.object({
    left: HeaderBaseSchema,
    center: z.array(HeaderBaseSchema),
    right: z.array(
        HeaderBaseSchema.extend({
            icon: z.enum(Object.keys(ICONS) as [IconKey, ...IconKey[]]),
            ariaLabel: z.string().optional(),
        })
    ),
});
