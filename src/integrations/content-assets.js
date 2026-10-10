/**
 * Serve the attachments that live next to the notes in `src/content`.
 *
 * Notes keep their images in an Obsidian-style `assets/` folder beside them.
 * `remark-obsidian` / `remark-content-image` point at the lower-cased path
 * relative to `src/content` (see `attachmentUrl`); this integration makes those
 * URLs work: a middleware in `astro dev`, and a copy into `dist/` after a build.
 */
import { copyFileSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getContentIndex } from '../plugins/lib/content-index.js';
import { ATTACHMENT_MIME, attachmentReferences } from '../utils/content-attachments.js';

function publicAttachments(dir, attachments, used = new Set()) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const file = join(dir, entry.name);
		if (entry.isDirectory()) publicAttachments(file, attachments, used);
		else if (entry.isFile() && entry.name.endsWith('.html')) {
			for (const key of attachmentReferences(readFileSync(file, 'utf8'), attachments).values()) used.add(key);
		}
	}
	return used;
}

export default function contentAssets() {
	return {
		name: 'content-assets',
		hooks: {
			'astro:server:setup': ({ server }) => {
				server.middlewares.use(async (req, res, next) => {
					let path;
					try {
						path = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname).slice(1);
					} catch {
						return next();
					}
					const file = getContentIndex().attachments.get(path.toLowerCase());
					if (!file) return next();

					const { readFile } = await import('node:fs/promises');
					const ext = file.split('.').pop().toLowerCase();
					res.setHeader('Content-Type', ATTACHMENT_MIME[ext] ?? 'application/octet-stream');
					res.end(await readFile(file));
				});
			},
			'astro:build:done': ({ dir, logger }) => {
				const out = fileURLToPath(dir);
				const { attachments } = getContentIndex();
				// Ciphertext contains no attachment URLs. Only files referenced by
				// public HTML are published; protected-only and unused files stay local.
				const used = publicAttachments(out, attachments);
				for (const rel of used) {
					const file = attachments.get(rel);
					const target = join(out, ...rel.split('/'));
					mkdirSync(dirname(target), { recursive: true });
					copyFileSync(file, target);
				}
				logger.info(`copied ${used.size} publicly referenced content attachments`);
			},
		},
	};
}
