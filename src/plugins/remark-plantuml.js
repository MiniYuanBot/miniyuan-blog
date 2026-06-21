import { visit } from 'unist-util-visit';
import { encode } from 'plantuml-encoder';

const SERVER = 'https://www.plantuml.com/plantuml/svg';

const COMMON_STYLE = `
hide circle
skinparam classAttributeIconSize 0
skinparam shadowing false
skinparam class {
    BackgroundColor #FEFEFE
    BorderColor #333
    ArrowColor #666
    FontColor #333
    FontSize 14
    AttributeFontSize 12
    MethodFontSize 12
    RoundCorner 4
}
`;

export default function remarkPlantuml() {
    return async (tree) => {
        const targets = [];

        visit(tree, 'code', (node, index, parent) => {
            if (node.lang !== 'plantuml') return;
            targets.push({ node, index, parent });
        });

        await Promise.all(
            targets.map(async ({ node, index, parent }) => {
                let raw = node.value.trim();

                // 把样式塞进 @startuml 里面
                if (raw.includes('@startuml')) {
                    raw = raw.replace('@startuml', '@startuml\n' + COMMON_STYLE.trim());
                } else {
                    raw = `@startuml\n${COMMON_STYLE.trim()}\n${raw}\n@enduml`;
                }

                const encoded = encode(raw);
                const url = `${SERVER}/${encoded}`;

                try {
                    const res = await fetch(url);
                    const svg = await res.text();
                    parent.children[index] = {
                        type: 'html',
                        value: `<div class="plantuml-diagram">${svg}</div>`
                    };
                } catch {
                    parent.children[index] = {
                        type: 'html',
                        value: `<img src="${url}" alt="PlantUML" class="plantuml-diagram" style="max-width:100%" />`
                    };
                }
            })
        );
    };
}