/**
 * One-off helper: rewrite `src/content` image references from long absolute
 * paths into the short names understood by `src/plugins/remark-content-image.js`.
 *
 *   node scripts/content-image-migrate.mjs           # dry run
 *   node scripts/content-image-migrate.mjs --write   # apply
 *
 * It is fence-aware (never touches fenced code blocks) and it verifies that
 * every referenced file actually exists on disk before rewriting.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const CONTENT_DIR = join(ROOT, 'src', 'content');
const PUBLIC_DIR = join(ROOT, 'public');
const WRITE = process.argv.includes('--write');

const IMAGE_EXT = /\.(?:png|jpe?g|gif|webp|avif|svg|bmp|ico)$/i;

/** lowercase basename -> [paths relative to public] */
const imageIndex = new Map();

function walkImages(dir, prefix = '') {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (entry.name.startsWith('.')) continue;
		const full = join(dir, entry.name);
		const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
		if (entry.isDirectory()) walkImages(full, rel);
		else if (entry.isFile() && IMAGE_EXT.test(entry.name)) {
			const key = entry.name.toLowerCase();
			if (!imageIndex.has(key)) imageIndex.set(key, []);
			imageIndex.get(key).push(`/${rel}`);
		}
	}
}

function walkMarkdown(dir, out = []) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) walkMarkdown(full, out);
		else if (entry.isFile() && entry.name.endsWith('.md')) out.push(full);
	}
	return out;
}

/** Split on `|` while ignoring separators inside [[…]] / {{…}}. */
function splitTopLevel(value) {
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
		if (value[i] === '|' && depth === 0) {
			parts.push(current);
			current = '';
			continue;
		}
		current += value[i];
	}
	parts.push(current);
	return parts;
}

const normalizeWidth = (value) => {
	const v = String(value).trim();
	if (/^\d+(?:\.\d+)?$/.test(v)) return `${v}%`;
	return v;
};

/** Mirror of the plugin's alt parsing so the rewrite is lossless. */
function parseAlt(alt) {
	let caption = alt ?? '';
	let credit = '';

	const legacy = caption.match(/^(.*?)\s*%%\s*([\s\S]+)$/);
	if (legacy) {
		caption = legacy[1];
		credit = legacy[2].trim();
	}

	let width = null;
	const captionParts = [];
	for (const raw of splitTopLevel(caption)) {
		const segment = raw.trim();
		const w = segment.match(/^(?:w|width)\s*[:=]\s*(.+)$/i);
		const c = segment.match(/^(?:credit|c)\s*[:=]\s*([\s\S]+)$/i);
		if (w) width = normalizeWidth(w[1]);
		else if (c) credit = c[1].trim();
		else if (segment) captionParts.push(segment);
	}

	return { caption: captionParts.join(' | ').trim(), width, credit };
}

function renderAlt({ caption, width, credit }) {
	let alt = caption;
	if (width) alt += `|w=${width}`;
	if (credit) alt += `|credit: ${credit}`;
	return alt;
}

/** Lines that are inside ``` / ~~~ fences must never be rewritten. */
function fencedLineFlags(lines) {
	const flags = new Array(lines.length).fill(false);
	let fence = null;
	for (let i = 0; i < lines.length; i += 1) {
		const match = lines[i].match(/^\s{0,3}(`{3,}|~{3,})/);
		if (fence) {
			flags[i] = true;
			if (match && match[1][0] === fence[0] && match[1].length >= fence.length) fence = null;
			continue;
		}
		if (match) {
			flags[i] = true;
			fence = match[1];
		}
	}
	return flags;
}

/**
 * Locate markdown image references on a line.
 *
 * A plain regex is not enough: credits such as `[[Author|https://doi.org/…]]`
 * put `[`/`]` inside the alt text, so both the alt and the destination need
 * bracket-aware scanning.
 */
function findImageRefs(line) {
	const refs = [];
	let i = 0;

	while ((i = line.indexOf('![', i)) !== -1) {
		// ---- alt text, closing `]` at bracket depth 0
		let j = i + 2;
		let depth = 0;
		let altEnd = -1;
		for (; j < line.length; j += 1) {
			const pair = line.slice(j, j + 2);
			if (pair === '[[' || pair === '{{') {
				depth += 1;
				j += 1;
				continue;
			}
			if (pair === ']]' || pair === '}}') {
				depth = Math.max(0, depth - 1);
				j += 1;
				continue;
			}
			if (line[j] === ']' && depth === 0) {
				altEnd = j;
				break;
			}
		}
		if (altEnd === -1 || line[altEnd + 1] !== '(') {
			i = altEnd === -1 ? line.length : altEnd + 1;
			continue;
		}

		// ---- destination
		let k = altEnd + 2;
		let parenDepth = 0;
		let urlEnd = -1;
		for (; k < line.length; k += 1) {
			if (line[k] === '(') parenDepth += 1;
			else if (line[k] === ')') {
				if (parenDepth === 0) {
					urlEnd = k;
					break;
				}
				parenDepth -= 1;
			}
		}
		if (urlEnd === -1) {
			i = altEnd + 1;
			continue;
		}

		const inner = line.slice(altEnd + 2, urlEnd);
		const parts = inner.match(/^(\S*)(\s+["'(\[].*)?$/);
		refs.push({
			start: i,
			end: urlEnd + 1,
			alt: line.slice(i + 2, altEnd),
			url: parts ? parts[1] : inner,
			tail: parts?.[2] ?? '',
		});

		i = urlEnd + 1;
	}

	return refs;
}

const report = { files: 0, rewritten: 0, missing: [], ambiguous: [], skipped: [] };

walkImages(join(PUBLIC_DIR, 'images'));

for (const file of walkMarkdown(CONTENT_DIR)) {
	const source = readFileSync(file, 'utf8');
	const lines = source.split('\n');
	const flags = fencedLineFlags(lines);
	const postBase = file.replace(/\\/g, '/').split('/').pop().replace(/\.[^.]+$/, '');
	let changed = false;

	for (let i = 0; i < lines.length; i += 1) {
		if (flags[i]) continue;
		if (!lines[i].includes('![')) continue;

		const refs = findImageRefs(lines[i]);
		if (!refs.length) continue;

		let line = lines[i];
		let touched = false;

		// Replace back-to-front so earlier offsets stay valid.
		for (const ref of refs.reverse()) {
			if (!ref.url.startsWith('/images/')) continue;

			const diskPath = join(PUBLIC_DIR, ref.url.replace(/^\//, ''));
			let exists = false;
			try {
				exists = statSync(diskPath).isFile();
			} catch {
				exists = false;
			}

			if (!exists) {
				const hit = imageIndex.get(ref.url.split('/').pop().toLowerCase());
				if (hit?.length === 1) report.ambiguous.push(`${relative(ROOT, file)}: ${ref.url} -> ${hit[0]}`);
				else report.missing.push(`${relative(ROOT, file)}:${i + 1}  ${ref.url}`);
				continue;
			}

			const basename = ref.url.split('/').pop();
			const prefix = `${postBase}-`;
			const short = basename.toLowerCase().startsWith(prefix.toLowerCase())
				? basename.slice(prefix.length)
				: basename;

			const parsed = parseAlt(ref.alt);
			if (!parsed.caption.startsWith('图')) {
				report.skipped.push(`${relative(ROOT, file)}:${i + 1}  (caption without 图) ${ref.alt}`);
				continue;
			}

			report.rewritten += 1;
			touched = true;
			const rebuilt = `![${renderAlt(parsed)}](${short}${ref.tail})`;
			line = line.slice(0, ref.start) + rebuilt + line.slice(ref.end);
		}

		if (touched) {
			changed = true;
			lines[i] = line;
		}
	}

	if (changed) {
		report.files += 1;
		if (WRITE) writeFileSync(file, lines.join('\n'), 'utf8');
	}
}

console.log(`${WRITE ? 'WROTE' : 'DRY RUN'} — files: ${report.files}, references rewritten: ${report.rewritten}`);
if (report.missing.length) {
	console.log(`\nMISSING on disk (${report.missing.length}):`);
	for (const line of report.missing) console.log(`  ${line}`);
}
if (report.ambiguous.length) {
	console.log(`\nCASE / PATH MISMATCH (${report.ambiguous.length}):`);
	for (const line of report.ambiguous) console.log(`  ${line}`);
}
if (report.skipped.length) {
	console.log(`\nSKIPPED (${report.skipped.length}):`);
	for (const line of report.skipped) console.log(`  ${line}`);
}
