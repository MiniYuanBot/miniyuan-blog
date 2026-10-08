/**
 * remark-content-image
 * ====================
 * Shortens the way post images are referenced inside `src/content` and
 * normalizes the caption metadata that `remark-image-caption.js` renders.
 *
 * ## Why
 *
 * The image tree mirrors the content tree, so every path segment is derivable
 * from the post's own location:
 *
 *     src/content/note/26spring/cv-intro/07-2d-vision-1.md
 *     public/images/note/26spring/cv-intro/07-2D-vision-1-02-receptive-field-1.png
 *
 * Writing that out by hand repeated the collection, the term and the post name
 * on every single image, so the same image can be written as:
 *
 *     ![感受野的递推公式|w=100%](02-receptive-field-1.png)
 *
 * ## Resolution
 *
 * A reference is left untouched when it is remote (`https:`, `//…`), a data
 * URI, or already absolute (`/images/…`). Anything else is resolved in order:
 *
 *   0. a file relative to the note inside `src/content` — the Obsidian layout,
 *      `![说明](assets/l02-iron-law.png)` — served by the content-assets
 *      integration (see `src/plugins/lib/content-index.js`)
 *   1. the mirror of the content path —
 *      `public/images/<collection>/<relative dir>/<post>-<name>` (and the same
 *      without the `<post>-` prefix)
 *   2. `name` containing a `/` is read relative to `public/images/<collection>/`
 *   3. the recursive index, matching `<post>-<name>` and then the bare name
 *      anywhere under the collection (then anywhere under `public/images`)
 *
 * Steps 1–3 resolve **case-insensitively** and emit the real on-disk casing, so
 * `07-2d-vision-1.md` can reference `07-2D-vision-1-*.png` and still produce a
 * URL that works on a case-sensitive Linux host.
 *
 * An unresolvable reference throws, so a typo fails the build instead of
 * silently shipping a broken image.
 *
 * ## Caption syntax
 *
 * `![caption]` accepts pipe-separated options:
 *
 *     ![caption](img.png)                    -> 图 1：caption          (auto numbered)
 *     ![caption|w=50%](img.png)              -> width 50%
 *     ![caption|credit: someone](img.png)    -> small credit line
 *     ![图 7：caption](img.png)               -> keeps number 7, bumps the auto counter
 *
 * The legacy spellings `| width=50%` and `%% credit: x` keep working, and the
 * numbers already written in existing posts are preserved verbatim.
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { visit } from 'unist-util-visit';
import { buildAlt, parseAlt } from './lib/image-alt.js';
import { findAttachment, getContentIndex } from './lib/content-index.js';

const IMAGE_EXT = /\.(?:png|jpe?g|gif|webp|avif|svg|bmp|ico)$/i;
/** `https:`, `data:`, `//cdn…` – anything with a scheme, plus protocol-relative. */
const HAS_SCHEME = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
/** `图 3：` / `图3:` / `图：` at the start of a caption. */
const FIGURE_PREFIX = /^\s*图\s*(\d*)\s*[：:]\s*/;

/** Walk a directory tree and bucket every image by its lower-cased basename. */
function indexImages(dir, prefix, out) {
	let entries;
	try {
		entries = readdirSync(dir, { withFileTypes: true });
	} catch {
		return out;
	}

	for (const entry of entries) {
		if (entry.name.startsWith('.')) continue;
		const full = join(dir, entry.name);
		const rel = prefix ? `${prefix}/${entry.name}` : entry.name;

		if (entry.isDirectory()) {
			indexImages(full, rel, out);
		} else if (entry.isFile() && IMAGE_EXT.test(entry.name)) {
			const key = entry.name.toLowerCase();
			const bucket = out.get(key);
			if (bucket) {
				if (!bucket.includes(rel)) bucket.push(rel);
			} else {
				out.set(key, [rel]);
			}
		}
	}

	return out;
}

/**
 * Resolve a path relative to `root` (the `public/` directory), ignoring letter
 * case, and report the real on-disk casing so the emitted URL matches the file
 * exactly. This is what lets `07-2d-vision-1.md` reference
 * `07-2D-vision-1-*.png` while still producing a URL that works on a
 * case-sensitive Linux host.
 */
function resolveCaseInsensitive(root, relPath) {
	const segments = relPath.split('/').filter(Boolean);
	let dir = root;
	const resolved = [];

	for (const segment of segments) {
		let entries;
		try {
			entries = readdirSync(dir, { withFileTypes: true });
		} catch {
			return null;
		}

		const wanted = segment.toLowerCase();
		const match = entries.find((entry) => entry.name.toLowerCase() === wanted);
		if (!match) return null;

		dir = join(dir, match.name);
		resolved.push(match.name);
	}

	return { absolute: dir, url: `/${resolved.join('/')}` };
}

/** Turn a `file:///…` URL (or a plain path) into a filesystem path. */
function toFilePath(file) {
	const raw = file?.path ?? file?.history?.[0];
	if (!raw) return null;

	const asString = String(raw);
	if (asString.startsWith('file:')) {
		try {
			return fileURLToPath(asString);
		} catch {
			return decodeURIComponent(asString.replace(/^file:\/\//, ''));
		}
	}

	return asString;
}

/** `blog/26spring/computing-method/02-hw02.md` -> parts used for resolution. */
function describeSource(filePath, contentRoot) {
	if (!filePath) return null;

	const normalized = filePath.replace(/\\/g, '/');
	const marker = `${contentRoot.replace(/\\/g, '/')}/`;
	// Windows drive letters can differ in case between `process.cwd()` and the
	// path VFile hands us, so locate the root case-insensitively and then slice
	// the original string.
	const at = normalized.toLowerCase().lastIndexOf(marker.toLowerCase());
	if (at === -1) return null;

	const relPath = normalized.slice(at + marker.length);
	const segments = relPath.split('/');
	if (segments.length < 2) return null;

	const fileName = segments.pop();
	return {
		collection: segments[0],
		relativeDir: segments.join('/'),
		// `02-hw02.md` -> `02-hw02`
		postBase: fileName.replace(/\.[^.]+$/, ''),
		fileName,
	};
}

export default function remarkContentImage(options = {}) {
	const contentRoot = options.contentRoot ?? join(process.cwd(), 'src', 'content');
	const publicRoot = options.publicRoot ?? join(process.cwd(), 'public');
	const imagesRoot = join(publicRoot, 'images');

	/** collection -> (lower-cased basename -> [paths relative to public]) */
	let collectionIndexes = null;
	let globalIndex = null;

	function loadIndexes() {
		if (collectionIndexes) return;

		collectionIndexes = new Map();
		try {
			for (const entry of readdirSync(imagesRoot, { withFileTypes: true })) {
				if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
				collectionIndexes.set(
					entry.name,
					indexImages(join(imagesRoot, entry.name), `/images/${entry.name}`, new Map()),
				);
			}
		} catch {
			/* no public/images yet – every short reference will be reported below */
		}

		globalIndex = indexImages(imagesRoot, '/images', new Map());
	}

	/** Look a short name up in the collection index, then everywhere. */
	function lookup(keys, collection) {
		loadIndexes();

		const scoped = collectionIndexes?.get(collection);
		for (const key of keys) {
			const hit = scoped?.get(key);
			if (hit?.length) return { url: hit[0], ambiguous: hit.length > 1 ? hit : null };
		}
		for (const key of keys) {
			const hit = globalIndex?.get(key);
			if (hit?.length) return { url: hit[0], ambiguous: hit.length > 1 ? hit : null };
		}
		return null;
	}

	function resolveUrl(url, source, from) {
		if (!url) return url;
		if (url.startsWith('/') || HAS_SCHEME.test(url)) return url;

		// 0. Co-located attachment (Obsidian layout).
		if (from) {
			const local = findAttachment(from, url);
			if (local) return local.url;
		}

		const clean = decodeURI(url.trim()).replace(/^\.\//, '');

		// 1. The image tree mirrors the content tree, so the expected location is
		//    derivable: src/content/note/26spring/cv-intro/07-foo.md with
		//    `01-bar.png` lives at
		//    public/images/note/26spring/cv-intro/07-foo-01-bar.png
		if (source?.collection) {
			const base = `images/${source.collection}/${source.relativeDir}`;
			const mirrored = [
				`${base}/${source.postBase}-${clean}`,
				`${base}/${clean}`,
			];
			for (const candidate of mirrored) {
				const hit = resolveCaseInsensitive(publicRoot, candidate);
				if (hit) return hit.url;
			}
		}

		// 2. An explicit `sub/dir.png` is read relative to the collection's root.
		if (clean.includes('/') && !clean.startsWith('..')) {
			const bases = [];
			if (source?.collection) bases.push(`images/${source.collection}/${clean}`);
			bases.push(`images/${clean}`);
			for (const base of bases) {
				const hit = resolveCaseInsensitive(publicRoot, base);
				if (hit) return hit.url;
			}
		}

		// 3. Fall back to the recursive index, which finds an image by name no
		//    matter where in the tree it sits.
		const bareName = clean.split('/').pop();
		const candidates = [];
		if (source?.postBase && bareName) {
			candidates.push(`${source.postBase}-${bareName}`.toLowerCase());
		}

		let hit = lookup(candidates, source?.collection);

		if (!hit && bareName) {
			hit = lookup([bareName.toLowerCase()], source?.collection);
		}

		if (!hit && from && bareName) {
			const local = findAttachment(from, bareName, { byName: true });
			if (local) return local.url;
		}

		if (hit) {
			if (hit.ambiguous) {
				console.warn(
					`[remark-content-image] "${url}" matches several files (${hit.ambiguous.join(', ')}); ` +
						`using ${hit.url}. Rename the image or write the path explicitly to disambiguate.`,
				);
			}
			return hit.url;
		}

		const tried = candidates.length ? candidates.join(', ') : bareName;
		throw new Error(
			`[remark-content-image] Cannot resolve image "${url}" referenced from ` +
				`"${source?.relativeDir ?? ''}/${source?.fileName ?? 'unknown'}".\n` +
				`  Looked for: public/images/${source?.collection ?? '<collection>'}/` +
				`${source?.relativeDir ? `${source.relativeDir}/` : ''}` +
				`${source?.postBase ? `${source.postBase}-${bareName}` : bareName}\n` +
				`  Tried by name: ${tried}\n` +
				`  Fix the file name, add the image, or write the full "/images/…" path.`,
		);
	}

	// Intrinsic sizes are read once per file so figures can carry width/height
	// attributes; that is what stops long note pages from jumping around while
	// images stream in on a phone.
	const sizeCache = new Map();

	async function probeSize(publicPath) {
		if (sizeCache.has(publicPath)) return sizeCache.get(publicPath);

		let size = null;
		try {
			const sharp = (await import('sharp')).default;
			const local = getContentIndex().attachments.get(
				decodeURIComponent(publicPath).slice(1).toLowerCase(),
			);
			const meta = await sharp(local ?? join(publicRoot, publicPath)).metadata();
			if (meta.width && meta.height) size = { width: meta.width, height: meta.height };
		} catch {
			/* unreadable format (svg without librsvg, corrupt file …) – no attributes */
		}

		sizeCache.set(publicPath, size);
		return size;
	}

	return async (tree, file) => {
		const from = toFilePath(file);
		const source = describeSource(from, contentRoot);
		const nodes = [];
		let figureNumber = 0;

		visit(tree, 'image', (node) => {
			const parsed = parseAlt(node.alt);

			// Keep numbering consistent even when authors number by hand.
			const prefix = parsed.caption.match(FIGURE_PREFIX);
			let captionText = parsed.caption;

			if (prefix) {
				const explicit = prefix[1] ? Number.parseInt(prefix[1], 10) : 0;
				captionText = parsed.caption.slice(prefix[0].length).trim();
				figureNumber = explicit > 0 ? Math.max(figureNumber, explicit) : figureNumber + 1;
			} else {
				figureNumber += 1;
			}

			node.url = resolveUrl(node.url, source, from);
			node.alt = buildAlt({
				caption: `图 ${figureNumber}：${captionText}`.trimEnd(),
				width: parsed.width,
				credit: parsed.credit,
			});
			nodes.push(node);
		});

		await Promise.all(
			nodes.map(async (node) => {
				if (typeof node.url !== 'string' || !node.url.startsWith('/')) return;
				const size = await probeSize(node.url);
				if (!size) return;
				node.data = { ...node.data, intrinsicSize: size };
			}),
		);
	};
}
