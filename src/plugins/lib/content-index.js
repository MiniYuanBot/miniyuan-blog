/**
 * An index of everything under `src/content`, shared by the Obsidian-flavoured
 * remark plugins and the attachment server.
 *
 * The site treats `src/content` like an Obsidian vault:
 *
 *   - notes link to each other with relative Markdown links
 *     (`[下一节](03-foo.md#标题)`) or wikilinks (`[[03-foo#标题|下一节]]`);
 *   - attachments sit next to the notes, usually in an `assets/` folder, and
 *     are referenced relatively (`![说明](assets/l02-iron-law.png)`).
 *
 * Attachments are served at the lower-cased path relative to `src/content`
 * (`note/26autumn/coa/L02/assets/x.png` -> `/note/26autumn/coa/l02/assets/x.png`),
 * so URLs never depend on letter case. That matters because a build on a
 * case-insensitive disk (Windows/macOS) merges `L02/` and the `l02/` page
 * directory, while the Linux host serving `dist/` does not.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, posix, relative, sep } from 'node:path';
import { slug as githubSlug } from 'github-slugger';

export const CONTENT_ROOT = join(process.cwd(), 'src', 'content');

export const NOTE_EXT = /\.(?:md|mdx)$/i;
/** Files that may be linked or embedded from a note and are copied to `dist/`. */
export const ATTACHMENT_EXT =
	/\.(?:png|jpe?g|gif|webp|avif|svg|bmp|ico|pdf|mp4|webm|mp3|wav|ogg)$/i;
export const IMAGE_EXT = /\.(?:png|jpe?g|gif|webp|avif|svg|bmp|ico)$/i;

const toPosix = (p) => p.split(sep).join('/');

/** Same rule Astro's glob loader uses: github-slug every segment, drop `/index`. */
export function entryId(relPathInCollection) {
	return relPathInCollection
		.replace(NOTE_EXT, '')
		.split('/')
		.map((segment) => githubSlug(segment))
		.join('/')
		.replace(/\/index$/, '');
}

/** Public URL of an attachment, from its path relative to `src/content`. */
export function attachmentUrl(relPath) {
	return `/${toPosix(relPath).toLowerCase().split('/').map(encodeURIComponent).join('/')}`;
}

/** The handful of frontmatter keys needed for wikilink resolution. */
function readTitleAndAliases(file) {
	let head = '';
	try {
		head = readFileSync(file, 'utf8').slice(0, 4000);
	} catch {
		return { title: null, aliases: [] };
	}
	const fm = head.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!fm) return { title: null, aliases: [] };

	const unquote = (v) => v.trim().replace(/^['"]|['"]$/g, '').trim();
	const title = fm[1].match(/^title:\s*(.+)$/m);
	const aliases = [];
	const inline = fm[1].match(/^aliases:\s*\[(.*)\]\s*$/m);
	if (inline) {
		aliases.push(...inline[1].split(',').map(unquote).filter(Boolean));
	} else {
		const block = fm[1].match(/^aliases:\s*\r?\n((?:\s+-\s*.+\r?\n?)+)/m);
		if (block) {
			for (const line of block[1].split(/\r?\n/)) {
				const item = line.match(/^\s+-\s*(.+)$/);
				if (item) aliases.push(unquote(item[1]));
			}
		}
	}
	return { title: title ? unquote(title[1]) : null, aliases };
}

let cache = null;
let cacheTime = 0;

function walk(dir, out) {
	let entries;
	try {
		entries = readdirSync(dir, { withFileTypes: true });
	} catch {
		return out;
	}
	for (const entry of entries) {
		if (entry.name.startsWith('.')) continue;
		const full = join(dir, entry.name);
		if (entry.isDirectory()) walk(full, out);
		else if (entry.isFile()) out.push(full);
	}
	return out;
}

/**
 * Build (or reuse) the index. In dev the index is refreshed at most once a
 * second so that new notes and pasted images are picked up without a restart.
 */
export function getContentIndex(root = CONTENT_ROOT) {
	const now = Date.now();
	if (cache && now - cacheTime < 1000) return cache;

	const notes = [];
	/** lower-cased path relative to root -> absolute path */
	const attachments = new Map();
	/** lower-cased basename -> [relative paths] (Obsidian "shortest path" lookup) */
	const attachmentsByName = new Map();

	for (const file of walk(root, [])) {
		const rel = toPosix(relative(root, file));
		if (NOTE_EXT.test(rel)) {
			const [collection, ...rest] = rel.split('/');
			if (!rest.length) continue;
			const { title, aliases } = readTitleAndAliases(file);
			notes.push({
				file,
				rel,
				collection,
				id: entryId(rest.join('/')),
				stem: rest[rest.length - 1].replace(NOTE_EXT, ''),
				title,
				aliases,
			});
		} else if (ATTACHMENT_EXT.test(rel)) {
			attachments.set(rel.toLowerCase(), file);
			const name = posix.basename(rel).toLowerCase();
			if (!attachmentsByName.has(name)) attachmentsByName.set(name, []);
			attachmentsByName.get(name).push(rel);
		}
	}

	const byRel = new Map(notes.map((n) => [n.rel.toLowerCase(), n]));
	cache = { root, notes, byRel, attachments, attachmentsByName };
	cacheTime = now;
	return cache;
}

/** URL of a note page. */
export const noteUrl = (note) => `/${note.collection}/${note.id}/`;

/**
 * Turn an Obsidian heading reference (`Simpson 公式误差估计`) into the id that
 * `rehypeHeadingIds` gives that heading (`simpson-公式误差估计`). Already
 * slugged fragments (`误差分析-2`) pass through unchanged.
 */
export function headingFragment(fragment) {
	if (!fragment) return '';
	let decoded = fragment;
	try {
		decoded = decodeURIComponent(fragment);
	} catch {
		/* keep as is */
	}
	// `[[note#^block-id]]` points at a block, which has no anchor on the site.
	if (decoded.startsWith('^')) return '';
	// `#A#B` (nested heading path) — the last heading is the target.
	const last = decoded.split('#').filter(Boolean).pop() ?? '';
	return last ? `#${githubSlug(last)}` : '';
}

/**
 * Resolve a relative path written in `fromFile` against the content tree.
 * Returns the posix path relative to the root, or null when it escapes it.
 */
export function resolveRelative(fromFile, target, root = CONTENT_ROOT) {
	const fromDir = posix.dirname(toPosix(relative(root, fromFile)));
	const joined = posix.normalize(posix.join(fromDir, target));
	if (joined.startsWith('..')) return null;
	return joined;
}

/** Find a note by a relative Markdown link target (`../index.md`, `05-foo`). */
export function findNoteByPath(fromFile, target, index = getContentIndex()) {
	const rel = resolveRelative(fromFile, target, index.root);
	if (!rel) return null;
	const lower = rel.toLowerCase();
	const candidates = NOTE_EXT.test(lower)
		? [lower]
		: [`${lower}.md`, `${lower}.mdx`, `${lower}/index.md`];
	for (const c of candidates) {
		const hit = index.byRel.get(c);
		if (hit) return hit;
	}
	return null;
}

/**
 * Obsidian-style lookup for `[[name]]`: an exact vault path, then a file name,
 * then a title or alias. Notes in the same folder (then the same collection)
 * win, mirroring Obsidian's "closest match".
 */
export function findNoteByName(fromFile, name, index = getContentIndex()) {
	const wanted = name.trim().replace(NOTE_EXT, '').toLowerCase();
	if (!wanted) return null;

	const fromRel = toPosix(relative(index.root, fromFile));
	const fromDir = posix.dirname(fromRel);
	const fromCollection = fromRel.split('/')[0];

	const rank = (note) => {
		const dir = posix.dirname(note.rel);
		if (dir === fromDir) return 0;
		if (note.collection === fromCollection) return 1;
		return 2;
	};
	const best = (list) => list.sort((a, b) => rank(a) - rank(b))[0] ?? null;

	if (wanted.includes('/')) {
		const byPath = index.notes.filter((n) => {
			const noExt = n.rel.replace(NOTE_EXT, '').toLowerCase();
			return noExt === wanted || noExt.endsWith(`/${wanted}`);
		});
		if (byPath.length) return best(byPath);
		const relative = findNoteByPath(fromFile, name, index);
		if (relative) return relative;
	}

	const byStem = index.notes.filter((n) => n.stem.toLowerCase() === wanted);
	if (byStem.length) return best(byStem);

	const byTitle = index.notes.filter(
		(n) =>
			n.title?.toLowerCase() === wanted ||
			n.aliases.some((a) => a.toLowerCase() === wanted),
	);
	return best(byTitle);
}

/**
 * Resolve an attachment reference. `relativeOnly` is used for Markdown links
 * (`assets/x.png`), which Obsidian also resolves relative to the note; embeds
 * (`![[x.png]]`) fall back to a vault-wide search by file name.
 */
export function findAttachment(fromFile, target, { byName = false } = {}, index = getContentIndex()) {
	let clean = target.trim();
	try {
		clean = decodeURI(clean);
	} catch {
		/* keep as is */
	}
	clean = clean.replace(/^\.\//, '');

	const rel = resolveRelative(fromFile, clean, index.root);
	if (rel) {
		const file = index.attachments.get(rel.toLowerCase());
		if (file) return { rel, file, url: attachmentUrl(rel) };
	}

	if (byName || !clean.includes('/')) {
		// Vault-absolute path (`note/26spring/x/assets/a.png`).
		const absolute = index.attachments.get(clean.toLowerCase());
		if (absolute) return { rel: clean, file: absolute, url: attachmentUrl(clean) };

		const hits = index.attachmentsByName.get(posix.basename(clean).toLowerCase());
		if (hits?.length) {
			const fromDir = posix.dirname(toPosix(relative(index.root, fromFile)));
			const sorted = [...hits].sort(
				(a, b) =>
					Number(!a.startsWith(`${fromDir}/`)) - Number(!b.startsWith(`${fromDir}/`)),
			);
			if (sorted.length > 1 && !sorted[0].startsWith(`${fromDir}/`)) {
				console.warn(
					`[content-index] "${target}" matches several attachments (${sorted.join(', ')}); using ${sorted[0]}.`,
				);
			}
			const hit = sorted[0];
			return { rel: hit, file: index.attachments.get(hit.toLowerCase()), url: attachmentUrl(hit) };
		}
	}

	return null;
}

/** Last-modified time of a file, used as a fallback publication date. */
export function fileTime(file) {
	try {
		return statSync(file).mtime;
	} catch {
		return null;
	}
}
