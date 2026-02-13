import { z } from 'astro:content';

const SvgStringSchema = z.string().refine(
    (val) => val.startsWith('<svg') && val.endsWith('</svg>'),
    { message: 'unavailable svg type' }
);

export const HeaderBaseSchema = z.object({
    title: z.string(),
    link: z.string(),
});

export const HeaderConfigSchema = z.object({
    left: HeaderBaseSchema,
    center: z.array(HeaderBaseSchema),
    right: z.array(
        HeaderBaseSchema.extend({
            svg: SvgStringSchema,
            ariaLabel: z.string().optional(),
        })
    ),
});
