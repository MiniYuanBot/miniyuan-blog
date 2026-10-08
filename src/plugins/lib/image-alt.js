/**
 * Shared caption/credit/width parsing for the two content plugins.
 *
 * Both `remark-content-image` (which normalises alt text) and
 * `remark-image-caption` (which renders it) need to agree on exactly what a
 * given alt means, so the parsing lives here once.
 *
 * Supported alt syntax (pipe separated, order independent):
 *
 *     ![caption]
 *     ![caption|w=50%]
 *     ![caption|width:50%]
 *     ![caption|credit: someone]
 *     ![caption %% credit: someone]        <- legacy spelling
 *     ![caption|300]                       <- Obsidian pixel width
 */

/**
 * Split on `|` while ignoring separators nested inside `[[…]]` / `{{…}}`, so
 * credit links such as `[[Author|https://doi.org/…]]` stay in one piece.
 */
export function splitTopLevel(value, separator = '|') {
	const parts = [];
	let current = '';
	let depth = 0;

	for (let i = 0; i < value.length; i += 1) {
		const pair = value.slice(i, i + 2);

		if (pair === '[[' || pair === '{{') {
			depth += 1;
			current += pair;
			i += 1;
			continue;
		}
		if (pair === ']]' || pair === '}}') {
			depth = Math.max(0, depth - 1);
			current += pair;
			i += 1;
			continue;
		}
		if (value[i] === separator && depth === 0) {
			parts.push(current);
			current = '';
			continue;
		}

		current += value[i];
	}

	parts.push(current);
	return parts;
}

/** `50` -> `50%`; unknown values fall back to a plain CSS length. */
export function normalizeWidth(value) {
	const trimmed = String(value ?? '').trim();
	if (!trimmed) return null;
	if (/^\d+(?:\.\d+)?$/.test(trimmed)) return `${trimmed}%`;
	if (/^\d+(?:\.\d+)?(?:px|rem|em|vw|vh|ch|%)$/.test(trimmed)) return trimmed;
	if (trimmed === 'auto') return 'auto';
	return null;
}

/**
 * Drop a `credit:` / `c=` label from a credit value.
 *
 * Authors write both `%% credit: PKU Slides` and `%% [[Author|url]]`; the label
 * is presentation, so it is stripped here and re-added by the renderer. That
 * keeps the two spellings equivalent and stops `credit: credit:` from leaking
 * into the output.
 */
export function stripCreditLabel(value) {
	return String(value ?? '')
		.replace(/^(?:credit|c)\s*[:=]\s*/i, '')
		.trim();
}

/** Split an alt string into `{ caption, width, credit }`. */
export function parseAlt(alt) {
	let width = null;
	let credit = '';
	const captionParts = [];

	// Split on top-level `|` first, then on `%%` inside each piece, so that
	// `caption %% credit: [[Author|url]] | width=100%` and
	// `caption | width=100% %% credit: …` both resolve the same way.
	for (const segment of splitTopLevel(alt ?? '')) {
		for (const part of segment.split(/\s*%%\s*/)) {
			const trimmed = part.trim();
			if (!trimmed) continue;

			const widthMatch = trimmed.match(/^(?:w|width)\s*[:=]\s*(.+)$/i);
			if (widthMatch) {
				width = normalizeWidth(widthMatch[1]) ?? width;
				continue;
			}

			// Obsidian's `![caption|300]` / `![caption|300x200]` (pixels).
			const obsidianWidth = trimmed.match(/^(\d+)(?:x\d+)?$/);
			if (obsidianWidth && segment !== alt) {
				width = `${obsidianWidth[1]}px`;
				continue;
			}

			const creditMatch = trimmed.match(/^(?:credit|c)\s*[:=]\s*([\s\S]+)$/i);
			if (creditMatch) {
				credit = stripCreditLabel(creditMatch[1]) || credit;
				continue;
			}

			captionParts.push(trimmed);
		}
	}

	return { caption: captionParts.join(' | ').trim(), width, credit };
}

/** Serialize the canonical alt form consumed by `remark-image-caption`. */
export function buildAlt({ caption, width, credit }) {
	let alt = caption;
	if (width) alt += `|w=${width}`;
	if (credit) alt += `|credit: ${credit}`;
	return alt;
}

/** `true` when this alt should become a `<figure>`. */
export function isCaptioned(caption) {
	return /^\s*图/.test(caption ?? '');
}
