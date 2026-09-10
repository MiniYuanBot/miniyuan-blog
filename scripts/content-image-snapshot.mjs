/**
 * Verification helper for the content-image work.
 *
 *   node scripts/content-image-snapshot.mjs <out.json>   # snapshot dist figures
 *   node scripts/content-image-snapshot.mjs --diff <a.json> <b.json>
 *
 * It records, per built page, the ordered list of `{ src, caption }` pairs found
 * in `<figure>` blocks. Captions are normalised (tags stripped, all whitespace
 * removed, `：` -> `:`) so that the `图1：` -> `图 1：` spacing normalisation does
 * not register as a difference, while a genuinely wrong or missing image does.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist');

function walkHtml(dir, out = []) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) walkHtml(full, out);
		else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
	}
	return out;
}

const stripTags = (html) => html.replace(/<[^>]*>/g, '');
const normalizeCaption = (text) =>
	stripTags(text)
		.replace(/&amp;/g, '&')
		.replace(/&quot;/g, '"')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&#39;/g, "'")
		.replace(/：/g, ':')
		.replace(/\s+/g, '')
		.trim();

function snapshot() {
	const result = {};

	for (const file of walkHtml(DIST)) {
		const html = readFileSync(file, 'utf8');
		const key = relative(DIST, file).replace(/\\/g, '/');
		const figures = [];

		const figureRe = /<figure\b[^>]*>([\s\S]*?)<\/figure>/g;
		for (const figure of html.matchAll(figureRe)) {
			const inner = figure[1];
			const img = inner.match(/<img\b[^>]*\bsrc="([^"]*)"/);
			const caption = inner.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/);
			if (!img) continue;
			figures.push({ src: img[1], caption: normalizeCaption(caption?.[1] ?? '') });
		}

		if (figures.length) result[key] = figures;
	}

	return result;
}

const [outFile, aFile, bFile] = process.argv.slice(2);
if (!outFile) throw new Error('usage: <out.json> | --diff <a.json> <b.json>');

if (outFile === '--diff') {
	const a = JSON.parse(readFileSync(aFile, 'utf8'));
	const b = JSON.parse(readFileSync(bFile, 'utf8'));
	const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])].sort();
	let problems = 0;

	for (const key of keys) {
		const before = a[key] ?? [];
		const after = b[key] ?? [];
		const ser = (list) => JSON.stringify(list);
		if (ser(before) === ser(after)) continue;

		problems += 1;
		console.log(`\n## ${key}`);
		const max = Math.max(before.length, after.length);
		for (let i = 0; i < max; i += 1) {
			const x = before[i];
			const y = after[i];
			if (JSON.stringify(x) === JSON.stringify(y)) continue;
			if (x && y && x.src === y.src && x.caption === y.caption) continue;
			console.log(`  [${i}] before: ${x ? `${x.src} | ${x.caption}` : '<none>'}`);
			console.log(`  [${i}] after : ${y ? `${y.src} | ${y.caption}` : '<none>'}`);
		}
	}

	console.log(`\npages with figures: before=${Object.keys(a).length} after=${Object.keys(b).length}`);
	console.log(problems === 0 ? 'IDENTICAL' : `DIFFERENT: ${problems} page(s)`);
	process.exitCode = problems === 0 ? 0 : 1;
} else {
	const data = snapshot();
	writeFileSync(outFile, JSON.stringify(data, null, 1), 'utf8');
	const total = Object.values(data).reduce((sum, list) => sum + list.length, 0);
	console.log(`wrote ${outFile}: ${Object.keys(data).length} pages, ${total} figures`);
}
