/**
 * One-off: move the site's notes to the Obsidian-compatible layout shared with
 * note-buddy (see README "Content conventions").
 *
 *   node scripts/migrate-to-vault.mjs           # dry run, prints the plan
 *   node scripts/migrate-to-vault.mjs --write   # apply (uses `git mv`)
 *
 * 1. `public/images/<collection>/<dir>/<name>` -> `src/content/<collection>/<dir>/assets/<name>`
 *    with `<name>` lower-cased and `_` turned into `-`.
 * 2. Image references become paths relative to the note (`assets/<name>`).
 * 3. Site URLs between notes (`/note/26spring/x/05-foo/#标题`, `../05-foo#标题`)
 *    become relative Markdown links (`05-foo.md#标题`).
 * 4. Note and sidecar file names are lower-cased (URLs do not change: Astro
 *    already lower-cases ids).
 *
 * Fenced code is never touched. Every rewritten reference is checked to exist.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, posix, relative, sep } from 'node:path';
import GithubSlugger from 'github-slugger';

const ROOT = process.cwd();
const CONTENT = join(ROOT, 'src', 'content');
const PUBLIC_IMAGES = join(ROOT, 'public', 'images');
const WRITE = process.argv.includes('--write');
const COLLECTIONS = ['blog', 'note'];
const IMAGE_EXT = /\.(?:png|jpe?g|gif|webp|avif|svg|bmp|ico)$/i;

const toPosix = (p) => p.split(sep).join('/');
const log = (...a) => console.log(...a);

function walk(dir, out = []) {
	if (!existsSync(dir)) return out;
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (entry.name.startsWith('.')) continue;
		const full = join(dir, entry.name);
		if (entry.isDirectory()) walk(full, out);
		else out.push(full);
	}
	return out;
}

const gitMv = (from, to) => execFileSync('git', ['mv', from, to], { cwd: ROOT });

/** Case-only renames need a detour on case-insensitive file systems. */
function rename(from, to) {
	if (from === to) return;
	if (WRITE) {
		mkdirSync(join(ROOT, posix.dirname(to)), { recursive: true });
		if (from.toLowerCase() === to.toLowerCase()) {
			gitMv(from, `${to}.tmp-rename`);
			gitMv(`${to}.tmp-rename`, to);
		} else {
			gitMv(from, to);
		}
	}
	log(`  mv ${from} -> ${to}`);
}

const kebab = (name) => name.toLowerCase().replace(/_/g, '-');

// ---------------------------------------------------------------- 1. images
/** old public URL (lower-cased) -> new path relative to src/content */
const moved = new Map();
log('# images');
for (const collection of COLLECTIONS) {
	for (const file of walk(join(PUBLIC_IMAGES, collection))) {
		if (!IMAGE_EXT.test(file)) continue;
		const rel = toPosix(relative(join(PUBLIC_IMAGES, collection), file));
		const dir = posix.dirname(rel);
		const base = posix.basename(rel);
		let target = posix.join(collection, dir, 'assets', kebab(base));
		if ([...moved.values()].includes(target)) target = posix.join(collection, dir, 'assets', base.toLowerCase());
		moved.set(`/images/${collection}/${rel}`.toLowerCase(), target);
		rename(toPosix(relative(ROOT, file)), `src/content/${target}`);
	}
}

// ------------------------------------------------------------ 2./3. markdown
const notes = walk(CONTENT).filter((f) => f.endsWith('.md'));
const noteRels = notes.map((f) => toPosix(relative(CONTENT, f)));
/** url-ish id (lower-cased, no extension) -> rel path */
const byId = new Map(noteRels.map((r) => [r.replace(/\.md$/, '').toLowerCase(), r]));

/** Headings of a note, with the id `rehypeHeadingIds` gives each. */
const headingCache = new Map();
function headings(rel) {
	if (headingCache.has(rel)) return headingCache.get(rel);
	const slugger = new GithubSlugger();
	const list = [];
	let fence = null;
	for (const line of readFileSync(join(CONTENT, rel), 'utf8').split(/\r?\n/)) {
		const f = line.match(/^\s*(`{3,}|~{3,})/);
		if (f) fence = fence ? (f[1][0] === fence ? null : fence) : f[1][0];
		if (fence) continue;
		const h = line.match(/^#{1,6}\s+(.+?)\s*#*\s*$/);
		if (h) list.push({ text: h[1], id: slugger.slug(h[1]) });
	}
	headingCache.set(rel, list);
	return list;
}

/** `jacobi-法` -> `Jacobi 法` when the heading is plain text, else the slug. */
function fragmentFor(rel, fragment) {
	if (!fragment) return '';
	let decoded = fragment;
	try {
		decoded = decodeURIComponent(fragment);
	} catch {
		/* keep */
	}
	const hit = headings(rel).find((h) => h.id === decoded);
	if (!hit) {
		log(`  ! no heading "${decoded}" in ${rel}; keeping the slug`);
		return `#${fragment}`;
	}
	const plain = !/[*_`$\\[\]<>]/.test(hit.text) && new GithubSlugger().slug(hit.text) === hit.id;
	return `#${(plain ? hit.text : hit.id).replace(/ /g, '%20')}`;
}

/** Resolve an old image reference to its new location relative to src/content. */
function newImagePath(fromRel, url) {
	const [collection, ...rest] = fromRel.split('/');
	const dir = rest.slice(0, -1).join('/');
	const stem = rest.at(-1).replace(/\.md$/, '');
	const clean = decodeURI(url).replace(/^\.\//, '');
	const candidates = url.startsWith('/')
		? [clean]
		: [
				`/images/${collection}/${dir}/${stem}-${clean}`,
				`/images/${collection}/${dir}/${clean}`,
				`/images/${collection}/${clean}`,
			];
	for (const c of candidates) {
		const hit = moved.get(c.toLowerCase());
		if (hit) return hit;
	}
	// Last resort: unique match by name.
	const byName = [...moved.entries()].filter(([k]) => k.endsWith(`-${clean.toLowerCase()}`) || k.endsWith(`/${clean.toLowerCase()}`));
	return byName.length === 1 ? byName[0][1] : null;
}

const relFrom = (fromRel, targetRel) => posix.relative(posix.dirname(fromRel), targetRel);

log('\n# references');
const renamedNotes = new Map(noteRels.map((r) => [r, r.toLowerCase()]));
let problems = 0;

for (const rel of noteRels) {
	const file = join(CONTENT, rel);
	const original = readFileSync(file, 'utf8');
	const finalRel = renamedNotes.get(rel);
	const parts = original.split(/(^\s*(?:`{3,}|~{3,})[^\n]*\n[\s\S]*?^\s*(?:`{3,}|~{3,})\s*$)/m);

	const rewritten = parts
		.map((part, i) => {
			if (i % 2 === 1) return part; // fenced code
			// images
			// The alt may hold `[[credit|url]]`, so match lazily up to `](<image>)`.
			part = part.replace(/(!\[[^\n]*?\]\()\s*([^)\s]+?\.(?:png|jpe?g|gif|webp|avif|svg|bmp|ico))(\s*(?:"[^"]*")?\))/gi, (m, head, url, tail) => {
				if (/^[a-z]+:|^\/\//i.test(url)) return m;
				if (!url.startsWith('/') && existsSync(join(CONTENT, posix.dirname(rel), decodeURI(url)))) return m;
				if (url.startsWith('/') && !url.toLowerCase().startsWith('/images/note/') && !url.toLowerCase().startsWith('/images/blog/')) return m;
				const target = newImagePath(rel, url);
				if (!target) {
					problems += 1;
					log(`  ! ${rel}: cannot resolve image ${url}`);
					return m;
				}
				return `${head}${relFrom(finalRel, target)}${tail}`;
			});
			// links between notes (absolute site URLs or URL-relative paths)
			part = part.replace(/(\]\(\s*)([^)\s]+)(\s*\))/g, (m, head, url, tail) => {
				if (/^[a-z]+:|^\/\/|^#/i.test(url) || /\.(md|png|jpe?g|gif|svg|pdf)(#|$)/i.test(url)) return m;
				const [path, fragment = ''] = url.split('#');
				let targetId = null;
				const site = path.match(/^\/(blog|note)\/(.+?)\/?$/);
				if (site) targetId = `${site[1]}/${site[2]}`;
				else if (path.startsWith('../') || path.startsWith('./')) {
					// URL-relative from the page URL `/<collection>/<id>/`
					const pageUrl = rel.replace(/\.md$/, '').toLowerCase() + '/';
					targetId = posix.normalize(posix.join(pageUrl, path)).replace(/\/$/, '');
				}
				if (!targetId) return m;
				const target = byId.get(decodeURI(targetId).toLowerCase());
				if (!target) {
					problems += 1;
					log(`  ! ${rel}: cannot resolve link ${url}`);
					return m;
				}
				const out = `${relFrom(finalRel, renamedNotes.get(target))}${fragmentFor(target, fragment)}`;
				return `${head}${out}${tail}`;
			});
			return part;
		})
		.join('');

	if (rewritten !== original) {
		const before = original.split('\n');
		const after = rewritten.split('\n');
		for (let i = 0; i < after.length; i += 1) {
			if (before[i] !== after[i]) log(`  ${rel}:${i + 1}\n    - ${before[i]?.trim()}\n    + ${after[i]?.trim()}`);
		}
		if (WRITE) writeFileSync(file, rewritten);
	}
}

// --------------------------------------------------------------- 4. renames
log('\n# file names');
for (const file of walk(CONTENT)) {
	const rel = toPosix(relative(CONTENT, file));
	if (rel.includes('/assets/')) continue;
	const base = posix.basename(rel);
	const wanted = base.endsWith('.md') ? base.toLowerCase() : kebab(base);
	if (wanted !== base) rename(`src/content/${rel}`, `src/content/${posix.dirname(rel)}/${wanted}`);
}

log(`\n${problems} unresolved reference(s). ${WRITE ? 'Applied.' : 'Dry run — pass --write to apply.'}`);
