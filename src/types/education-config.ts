import type { z } from 'astro:content';
import type { EducationItemSchema, EducationConfigSchema } from '../schemas/education';

export const educationConfig = [
    {
        school: "北京大学",
        period: "August 2024 - Present",
        location: "Beijing",
        description: "College of Engineering",
        logo: "images/PKU-logo.png",
    },
    {
        school: "余杭高级中学",
        period: "April 2021 - July 2024",
        location: "Hangzhou",
        description: "High School",
        logo: "images/yugao-logo.png",
    },
] satisfies z.infer<typeof EducationConfigSchema>;

export type EducationItem = z.infer<typeof EducationItemSchema>;
export type EducationConfig = z.infer<typeof EducationConfigSchema>;