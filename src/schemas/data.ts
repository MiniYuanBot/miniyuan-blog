import { z } from 'astro:content';

export const DateSchema = z.coerce.date();
export const OptionalDateSchema = z.coerce.date().optional();

export const ImagePathSchema = z.string().refine(
    (val) => val.startsWith('/') || val.startsWith('http'),
    { message: 'Image path must start with / or http' }
);