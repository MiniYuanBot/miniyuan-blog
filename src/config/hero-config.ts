import type { z } from 'astro:content';
import type { HeroConfigSchema } from '../schemas';

export const heroConfig = {
    avatarSrc: "/images/miniyuan.jpg",
    avatarAlt: "profile photo",
    name: "miniyuan",
    introduction: [
        "我是来自北京大学工学院工程科学计算专业的大二学生，同时修读计算机科学技术双专业。",
        "我喜欢一切有挑战的任务，也喜欢摆烂（bushi）",
        "Miniyuan is getting stronger!",
    ],
} satisfies z.infer<typeof HeroConfigSchema>;

export type HeroConfig = z.infer<typeof HeroConfigSchema>;