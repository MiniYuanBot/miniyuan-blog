import type { z } from 'astro:content';
import type { HeroConfigSchema, SkillSchema } from '../schemas/hero';

export const heroConfig = {
    avatarSrc: "/images/miniyuan.jpg",
    avatarAlt: "the selfie of miniyuan",
    name: "miniyuan",
    tagline: "curious ",
    introduction: [
        "我是来自北京大学工学院的大二学生，同时修读计算机科学技术双专业。",
        "我喜欢一切有挑战的任务，也喜欢摆烂（bushi）",
        "Miniyuan is getting stronger!",
    ],
    skills: [
        { label: "JavaScript/TypeScript", icon: "⚡" },
        { label: "React/Vue", icon: "🎨" },
        { label: "Node.js", icon: "🚀" },
        { label: "UI/UX 设计", icon: "✨" },
        { label: "性能优化", icon: "⚙️" },
        { label: "系统架构", icon: "🏗️" },
    ],
} satisfies z.infer<typeof HeroConfigSchema>;

export type HeroConfig = z.infer<typeof HeroConfigSchema>;
export type Skill = z.infer<typeof SkillSchema>;