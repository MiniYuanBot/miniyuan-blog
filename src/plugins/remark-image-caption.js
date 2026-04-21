import { visit } from 'unist-util-visit';

/**
 * Convert custom Markdown-like syntax to HTML
 * Supports:
 *   - bold: __text__ (recommended, **text** may not work)
 *   - italic: _text_ (recommended, *text* may not work)
 *   - links: [[text|url]] or {{text|url}} (recommended, [text](url) may not work)
 */
function mdToHtml(md) {
    if (!md) return '';

    let html = md;

    // Escape HTML entities to prevent XSS
    html = html.replace(/&/g, '&amp;');
    html = html.replace(/</g, '&lt;');
    html = html.replace(/>/g, '&gt;');

    // Bold: __text__ (**text** as fallback)
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

    // Italic: _text_ (*text* as fallback)
    // Process after bold to avoid conflicts with ** syntax
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');

    // links: [[text|url]] or {{text|url}} ([text](url) as fallback)
    html = html.replace(/\[\[(.+?)\|(.+?)\]\]/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    html = html.replace(/\{\{(.+?)\|(.+?)\}\}/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    return html;
}

export default function remarkImageCaption() {
    return (tree) => {
        visit(tree, 'paragraph', (node, index, parent) => {
            // Only process paragraphs containing exactly one image
            if (node.children.length !== 1) return;
            if (node.children[0].type !== 'image') return;

            const image = node.children[0];
            const alt = image.alt || '';

            let captionMd = alt;
            let width = '80%';
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

            // Only wrap images whose alt starts with '图'
            if (!alt.startsWith('图')) return;

            const widthStyle = `style="width: ${width};"`;
            const captionHtml = mdToHtml(captionMd);
            const creditHtml = mdToHtml(creditMd);

            const figcaptionContent = creditMd
                ? `${captionHtml}<br>${creditHtml}`
                : captionHtml;

            const figureNode = {
                type: 'html',
                value:
                    `<figure class="text-center my-0">
    <a href="${image.url}" target="_blank" rel="noopener noreferrer">
        <img src="${image.url}" alt="${captionMd.replace(/"/g, '&quot;')}" ${widthStyle} loading="lazy" class="shadow-lg mx-auto rounded-lg hover:scale-105 transition-transform" />
    </a>
    <figcaption class="mt-3 text-muted-foreground italic text-sm">
        ${figcaptionContent}
    </figcaption>
</figure>`
            };

            // Replace the original paragraph with the figure node
            parent.children.splice(index, 1, figureNode);
        });
    };
}