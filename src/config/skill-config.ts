import { SkillCardConfigSchema } from '@/schemas';

export const skillConfig = SkillCardConfigSchema.parse([
    {
        title: "Skills",
        showHeader: false,
        padding: "md",
        hover: true,
        skills: [
            {
                category: "Language",
                items: ["TypeScript", "JavaScript", "HTML", "CSS", "C++", "C", "Python"]
            },
            {
                category: "Framework",
                items: ["React", "Vue", "Astro", "Next.js", "Node.js", "SQL"]
            },
            {
                category: "Tools",
                items: ["Git", "VS Code", "Docker"]
            }
        ]
    }
]);