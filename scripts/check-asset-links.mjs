/**
 * Verify that every internal reference in the built site resolves to a real file.
 *
 *   node scripts/check-asset-links.mjs
 *
 * `dist/` is a byte-for-byte copy of everything the site was asked to publish,
 * so a `/images/...` reference is broken exactly when the matching file is not in
 * `dist/`. The check is **case-sensitive**, which is the point: Windows and macOS
 * serve such files happily while Linux hosts (Cloudflare Pages, Netlify, …)
 * return 404.
 *
 * Exit code is non-zero when anything is missing.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist');

if (!existsSync(DIST)) {
	console.error('dist/ not found – run a build first.');
	process.exit(2);
}

function walk(dir, out = []) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) walk(full, out);
		else if (entry.isFile() && entry.name.endsWith('.html')) out.push(full);
	}
	return out;
}

/** Attributes that can carry a site-internal URL. */
const ATTR = /\b(?:src|href|poster|data-src)\s*=\s*"([^"]*)"/g;

const isInternal = (url) =>
	url.startsWith('/') && !url.startsWith('//');

const looksLikeAsset = (path) => {
	if (/^\/(?:images|others|fonts|_astro|pagefind)\//.test(path)) return true;
	return extname(path) !== '';
};

const seen = new Map();
const missing = [];
let checkedAssets = 0;
let checkedPages = 0;

for (const file of walk(DIST)) {
	const html = readFileSync(file, 'utf8');
	const page = relative(DIST, file).replace(/\\/g, '/');

	for (const match of html.matchAll(ATTR)) {
		const raw = match[1];
		if (!isInternal(raw)) continue;

		let path;
		try {
			// References are percent-encoded; generated directories keep the
			// literal characters, so decode before touching the filesystem.
			path = decodeURIComponent(raw.split('#')[0].split('?')[0]);
		} catch {
			path = raw.split('#')[0].split('?')[0];
		}
		if (!path || path === '/') continue;

		// `/_astro/foo.css` etc. always resolve to a file.
		const asFile = join(DIST, path);
		const asPage = join(DIST, path, 'index.html');
		const asPageHtml = join(DIST, `${path.replace(/\/$/, '')}.html`);

		const fileOk = existsSync(asFile) && statSync(asFile).isFile();
		const pageOk = existsSync(asPage) || existsSync(asPageHtml);

		if (looksLikeAsset(path)) {
			checkedAssets += 1;
			if (!fileOk) missing.push({ page, ref: raw, expected: relative(ROOT, asFile), kind: 'asset' });
		} else {
			checkedPages += 1;
			if (!pageOk && !fileOk) {
				missing.push({ page, ref: raw, expected: relative(ROOT, asPage), kind: 'page' });
			}
		}

		seen.set(path, (seen.get(path) ?? 0) + 1);
	}
}

console.log(`pages scanned        : ${walk(DIST).length}`);
console.log(`asset references     : ${checkedAssets}`);
console.log(`page references      : ${checkedPages}`);
console.log(`distinct targets     : ${seen.size}`);
console.log(`missing              : ${missing.length}`);

if (missing.length) {
	console.log('\nMISSING:');
	const grouped = new Map();
	for (const item of missing) {
		const key = `${item.kind}|${item.ref}`;
		if (!grouped.has(key)) grouped.set(key, []);
		grouped.get(key).push(item.page);
	}
	for (const [key, pages] of grouped) {
		const [, ref] = key.split('|');
		console.log(`  [${key.split('|')[0]}] ${ref}`);
		console.log(`      expected: ${missing.find((m) => m.ref === ref)?.expected}`);
		console.log(`      used by : ${pages.slice(0, 3).join(', ')}${pages.length > 3 ? ` … (${pages.length} pages)` : ''}`);
	}
	process.exitCode = 1;
} else {
	console.log('\nAll internal references resolve.');
}
