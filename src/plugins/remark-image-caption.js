import { visit } from 'unist-util-visit';

/**
 * Convert custom Markdown-like syntax to HTML
 * Supports:
 *   - bold: @@text@@
 *   - italic: @text@
 *   - links: [[text|url]] or {{text|url}}
 */
function mdToHtml(md) {
    if (!md) return '';

    let html = md;

    // Escape HTML entities to prevent XSS
    html = html.replace(/&/g, '&amp;');
    html = html.replace(/</g, '&lt;');
    html = html.replace(/>/g, '&gt;');

    // Bold: @@text@@
    html = html.replace(/@@(.+?)@@/g, '<strong>$1</strong>');

    // Italic: @text@
    html = html.replace(/@(.+?)@/g, '<em>$1</em>');

    // links: [[text|url]] or {{text|url}}
    html = html.replace(/\[\[(.+?)\|(.+?)\]\]/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    html = html.replace(/\{\{(.+?)\|(.+?)\}\}/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    return html;
}

/** Parse image alt: extract width, caption, credit, and validate prefix */
function parseImageMeta(image) {
    const alt = image.alt || '';
    let captionMd = alt;
    let width = null;
    let creditMd = '';

    // Extract width parameter: | width=50% or | width:50%
    const widthMatch = alt.match(/[|]\s*width[:=]\s*([^\s|]+)/i);
    if (widthMatch) {
        width = widthMatch[1];
        captionMd = alt.replace(widthMatch[0], '').trim();
        captionMd = captionMd.replace(/[|]\s*$/, '').trim();
    }

    // Split caption and credit using %% separator
    const separatorMatch = captionMd.match(/(.+?)\s*%%\s*(.+)/);
    if (separatorMatch) {
        captionMd = separatorMatch[1].trim();
        creditMd = separatorMatch[2].trim();
    }

    return { captionMd, creditMd, width, valid: alt.startsWith('图') };
}

/** Build figure HTML for 1~3 images */
function buildFigure(images) {
    // Single image: keep original figure semantics
    if (images.length === 1) {
        const img = images[0];
        const widthAttr = img.width ? `style="width: ${img.width};"` : 'style="width: 80%;"';
        const figcaptionContent = img.creditHtml
            ? `${img.captionHtml}<br>${img.creditHtml}`
            : img.captionHtml;

        return `<figure class="text-center my-0">
    <a href="${img.url}" target="_blank" rel="noopener noreferrer" style="text-decoration:none; border-bottom:none">
        <img src="${img.url}" alt="${img.alt.replace(/"/g, '&quot;')}" ${widthAttr} loading="lazy" class="shadow-lg mx-auto rounded-lg hover:scale-105 transition-transform" />
    </a>
    <figcaption class="mt-3 text-muted-foreground italic text-sm">
        ${figcaptionContent}
    </figcaption>
</figure>`;
    }

    // 2~3 images: wrap with flex container; each image keeps its own <figure> for caption
    const figures = images.map(img => {
        const widthAttr = img.width ? `style="width: ${img.width};"` : '';
        const figcaptionContent = img.creditHtml
            ? `${img.captionHtml}<br>${img.creditHtml}`
            : img.captionHtml;

        return `<figure class="text-center flex-1 min-w-0 my-0">
    <a href="${img.url}" target="_blank" rel="noopener noreferrer" class="block" style="text-decoration:none; border-bottom:none">
        <img src="${img.url}" alt="${img.alt.replace(/"/g, '&quot;')}" ${widthAttr} loading="lazy" class="shadow-lg rounded-lg hover:scale-105 transition-transform w-full h-auto object-cover" />
    </a>
    <figcaption class="mt-3 text-muted-foreground italic text-sm">
        ${figcaptionContent}
    </figcaption>
</figure>`;
    }).join('\n    ');

    return `<div class="flex flex-row gap-4 items-start justify-center my-0">
    ${figures}
</div>`;
}

export default function remarkImageCaption() {
    return (tree) => {
        // =====================================================================
        // Phase 1: Collect all single-image paragraphs (alt starts with '图')
        // =====================================================================
        const singleImageParagraphs = [];

        visit(tree, 'paragraph', (node, index, parent) => {
            if (node.children.length !== 1) return;
            if (node.children[0].type !== 'image') return;

            const meta = parseImageMeta(node.children[0]);
            if (!meta.valid) return;

            singleImageParagraphs.push({ parent, index, image: node.children[0], meta });
        });

        // =====================================================================
        // Phase 2: Group consecutive single-image paragraphs (2~3 items)
        // =====================================================================
        const mergeGroups = [];
        const byParent = new Map();

        singleImageParagraphs.forEach(item => {
            if (!byParent.has(item.parent)) byParent.set(item.parent, []);
            byParent.get(item.parent).push(item);
        });

        for (const [parent, items] of byParent) {
            items.sort((a, b) => a.index - b.index);

            let i = 0;
            while (i < items.length) {
                let j = i + 1;
                // Look ahead while indices are consecutive and group size <= 3
                while (j < items.length && items[j].index === items[j - 1].index + 1) {
                    if (j - i >= 3) break;
                    j++;
                }

                const count = j - i;
                if (count >= 2 && count <= 3) {
                    mergeGroups.push({ parent, startIndex: items[i].index, items: items.slice(i, j) });
                    i = j; // skip merged items
                } else {
                    i++;
                }
            }
        }

        // =====================================================================
        // Phase 3: Execute merges (reverse index order per parent so splice is safe)
        // =====================================================================
        const mergeByParent = new Map();
        mergeGroups.forEach(g => {
            if (!mergeByParent.has(g.parent)) mergeByParent.set(g.parent, []);
            mergeByParent.get(g.parent).push(g);
        });

        for (const [parent, groups] of mergeByParent) {
            groups.sort((a, b) => b.startIndex - a.startIndex);
            for (const group of groups) {
                const images = group.items.map(item => ({
                    url: item.image.url,
                    alt: item.meta.captionMd,
                    width: item.meta.width,
                    captionHtml: mdToHtml(item.meta.captionMd),
                    creditHtml: mdToHtml(item.meta.creditMd)
                }));

                const figureNode = {
                    type: 'html',
                    value: buildFigure(images)
                };

                parent.children.splice(group.startIndex, group.items.length, figureNode);
            }
        }

        // =====================================================================
        // Phase 4: Collect remaining paragraphs:
        //          - Standalone single image (not merged)
        //          - Multi-image paragraph (1~3 images, ignoring whitespace text)
        // =====================================================================
        const replacements = [];

        visit(tree, 'paragraph', (node, index, parent) => {
            const images = [];

            for (const child of node.children) {
                if (child.type === 'image') {
                    images.push(child);
                } else if (child.type === 'text' && child.value.trim() === '') {
                    // ignore whitespace-only separators
                } else {
                    // Contains other content (real text, links, etc.) -> abort
                    return;
                }
            }

            if (images.length === 0 || images.length > 3) return;

            const metas = images.map(img => parseImageMeta(img));
            if (!metas.every(m => m.valid)) return;

            const imageData = images.map((img, idx) => ({
                url: img.url,
                alt: metas[idx].captionMd,
                width: metas[idx].width,
                captionHtml: mdToHtml(metas[idx].captionMd),
                creditHtml: mdToHtml(metas[idx].creditMd)
            }));

            replacements.push({ parent, index, imageData });
        });

        // =====================================================================
        // Phase 5: Execute replacements (reverse index order per parent)
        // =====================================================================
        const replaceByParent = new Map();
        replacements.forEach(r => {
            if (!replaceByParent.has(r.parent)) replaceByParent.set(r.parent, []);
            replaceByParent.get(r.parent).push(r);
        });

        for (const [parent, items] of replaceByParent) {
            items.sort((a, b) => b.index - a.index);
            for (const item of items) {
                parent.children.splice(item.index, 1, {
                    type: 'html',
                    value: buildFigure(item.imageData)
                });
            }
        }
    };
}