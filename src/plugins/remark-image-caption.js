import { visit } from 'unist-util-visit';
import { isCaptioned, normalizeWidth, parseAlt } from './lib/image-alt.js';

/**
 * Convert a small subset of Markdown-ish shorthand used inside captions/credits.
 * Supports:
 *   - bold: @@text@@
 *   - italic: @text@
 *   - links: [[text|url]] or {{text|url}}
 *
 * The input is escaped first, so the only thing that can inject markup is the
 * link rule below – which is why the URL goes through `sanitizeUrl` as well.
 */
function mdToHtml(md) {
	if (!md) return '';

	let html = String(md);

	// Escape HTML entities to prevent XSS
	html = html.replace(/&/g, '&amp;');
	html = html.replace(/</g, '&lt;');
	html = html.replace(/>/g, '&gt;');

	// Bold: @@text@@
	html = html.replace(/@@(.+?)@@/g, '<strong>$1</strong>');

	// Italic: @text@
	html = html.replace(/@([^\s@][^@]*?)@/g, '<em>$1</em>');

	// links: [[text|url]] or {{text|url}}
	html = html.replace(
		/\[\[(.+?)\|(.+?)\]\]/g,
		(_match, text, url) =>
			`<a href="${sanitizeUrl(url)}" target="_blank" rel="noopener noreferrer">${text}</a>`,
	);
	html = html.replace(
		/\{\{(.+?)\|(.+?)\}\}/g,
		(_match, text, url) =>
			`<a href="${sanitizeUrl(url)}" target="_blank" rel="noopener noreferrer">${text}</a>`,
	);

	return html;
}

/** Escape a value for use inside a double-quoted HTML attribute. */
function escapeAttr(value) {
	return String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/"/g, '&quot;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

/** Keep `javascript:` and friends out of generated links. */
function sanitizeUrl(url) {
	const value = String(url).replace(/[\u0000-\u0020]/g, '');
	if (!value || /^(?:javascript|data|vbscript|file):/i.test(value)) return '#';
	return escapeAttr(value);
}

/** Width is a bare percentage/number unless the author gave a CSS length. */
/** Parse image alt: extract width, caption, credit, and validate prefix */
function parseImageMeta(image) {
	const { caption, width, credit } = parseAlt(image.alt);
	return { captionMd: caption, creditMd: credit, width, valid: isCaptioned(caption) };
}

/** Shared sizing attributes so figures keep their aspect ratio while loading. */
function sizeAttrs(size) {
	if (!size?.width || !size?.height) return '';
	return ` width="${size.width}" height="${size.height}"`;
}

/**
 * The credit line keeps its `credit:` label so the rendered output is unchanged
 * from before the label moved into the parser.
 */
const creditLine = (creditHtml) => (creditHtml ? `credit: ${creditHtml}` : '');

/** Build figure HTML for 1~3 images */
function buildFigure(images) {
	// Single image: keep original figure semantics
	if (images.length === 1) {
		const img = images[0];
		const width = normalizeWidth(img.width);
		// No author-specified width: let CSS pick a responsive default (full
		// width on phones, 80% from `sm` up) instead of a fixed 80%.
		const sizing = width
			? ` style="width: ${width};"`
			: '';
		const defaultClass = width ? '' : ' content-figure-default-width';
		const figcaptionContent = img.creditHtml
			? `${img.captionHtml}<br>${img.creditHtml}`
			: img.captionHtml;

		return `<figure class="content-figure text-center my-0">
    <a href="${escapeAttr(img.url)}" target="_blank" rel="noopener noreferrer" class="content-figure-link">
        <img src="${escapeAttr(img.url)}" alt="${escapeAttr(img.alt)}"${sizeAttrs(img.size)}${sizing} loading="lazy" decoding="async" class="shadow-lg mx-auto h-auto rounded-lg${defaultClass} hover:scale-105 transition-transform" />
    </a>
    <figcaption class="mt-3 text-muted-foreground italic text-sm">
        ${figcaptionContent}
    </figcaption>
</figure>`;
	}

	// 2~3 images: stack on phones, sit side by side from `sm` upwards. Three
	// thumbnails squeezed into a 360px viewport are unreadable, so the column
	// layout is the mobile default rather than a fallback.
	const figures = images
		.map((img) => {
			const width = normalizeWidth(img.width);
			const widthAttr = width ? ` style="width: ${width};"` : '';
			const figcaptionContent = img.creditHtml
				? `${img.captionHtml}<br>${img.creditHtml}`
				: img.captionHtml;

			return `<figure class="content-figure text-center flex-1 min-w-0 my-0">
    <a href="${escapeAttr(img.url)}" target="_blank" rel="noopener noreferrer" class="content-figure-link block">
        <img src="${escapeAttr(img.url)}" alt="${escapeAttr(img.alt)}"${sizeAttrs(img.size)}${widthAttr} loading="lazy" decoding="async" class="shadow-lg h-auto rounded-lg w-full object-cover hover:scale-105 transition-transform" />
    </a>
    <figcaption class="mt-3 text-muted-foreground italic text-sm">
        ${figcaptionContent}
    </figcaption>
</figure>`;
		})
		.join('\n    ');

	return `<div class="content-figure-group flex flex-col sm:flex-row gap-4 items-center sm:items-start justify-center my-0">
    ${figures}
</div>`;
}

/**
 * Alt text for the `<img>`: the caption shorthand is presentation, not text.
 * Without this the raw `@@…@@` / `[[label|url]]` markers end up in the alt
 * attribute, where screen readers read them out literally.
 */
function plainCaption(caption) {
	return String(caption ?? '')
		.replace(/@@([\s\S]+?)@@/g, '$1')
		.replace(/@([^\s@][^@]*?)@/g, '$1')
		.replace(/\[\[(.+?)\|(.+?)\]\]/g, '$1')
		.replace(/\{\{(.+?)\|(.+?)\}\}/g, '$1')
		.replace(/\s+/g, ' ')
		.trim();
}

/** Collect the render data for one image node. */
function imageData(node, meta) {
	return {
		url: node.url,
		alt: plainCaption(meta.captionMd),
		width: meta.width,
		size: node.data?.intrinsicSize ?? null,
		captionHtml: mdToHtml(meta.captionMd),
		creditHtml: creditLine(mdToHtml(meta.creditMd)),
	};
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

		singleImageParagraphs.forEach((item) => {
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
		mergeGroups.forEach((g) => {
			if (!mergeByParent.has(g.parent)) mergeByParent.set(g.parent, []);
			mergeByParent.get(g.parent).push(g);
		});

		for (const [parent, groups] of mergeByParent) {
			groups.sort((a, b) => b.startIndex - a.startIndex);
			for (const group of groups) {
				const images = group.items.map((item) => imageData(item.image, item.meta));

				const figureNode = {
					type: 'html',
					value: buildFigure(images),
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

			const metas = images.map((img) => parseImageMeta(img));
			if (!metas.every((m) => m.valid)) return;

			const imageDataList = images.map((img, idx) => imageData(img, metas[idx]));

			replacements.push({ parent, index, imageData: imageDataList });
		});

		// =====================================================================
		// Phase 5: Execute replacements (reverse index order per parent)
		// =====================================================================
		const replaceByParent = new Map();
		replacements.forEach((r) => {
			if (!replaceByParent.has(r.parent)) replaceByParent.set(r.parent, []);
			replaceByParent.get(r.parent).push(r);
		});

		for (const [parent, items] of replaceByParent) {
			items.sort((a, b) => b.index - a.index);
			for (const item of items) {
				parent.children.splice(item.index, 1, {
					type: 'html',
					value: buildFigure(item.imageData),
				});
			}
		}
	};
}
