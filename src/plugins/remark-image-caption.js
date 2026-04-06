import { visit } from 'unist-util-visit';

export default function remarkImageCaption() {
    return (tree) => {
        visit(tree, 'paragraph', (node, index, parent) => {
            // Only contains one image child
            if (node.children.length !== 1) return;
            if (node.children[0].type !== 'image') return;

            const image = node.children[0];
            const alt = image.alt || '';

            let caption = alt;
            let width = '80%';

            // Match pattern: 图 xxxx | width=50% or width:50%
            const widthMatch = alt.match(/[|]\s*width[:=]\s*([^\s|]+)/i);
            if (widthMatch) {
                width = widthMatch[1];
                caption = alt.replace(widthMatch[0], '').trim();
                caption = caption.replace(/[|]\s*$/, '').trim();
            }

            // If alt start with specific char, then do the wrapper
            if (alt.startsWith('图')) {
                const widthStyle = `style="width: ${width};"`;

                const figureNode = {
                    type: 'html',
                    value:
                        `<figure class="text-center my-0">
    <a href="${image.url}" target="_blank" rel="noopener noreferrer">
        <img src="${image.url}" alt="${caption}" ${widthStyle} loading="lazy" class="shadow-lg mx-auto rounded-lg hover:scale-105 transition-transform" />
    </a>
    <figcaption class="mt-3 text-muted-foreground italic text-sm">
        ${caption}
    </figcaption>
</figure>`
                };

                // Replace
                parent.children.splice(index, 1, figureNode);
            }
        });
    };
}