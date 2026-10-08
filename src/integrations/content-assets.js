/**
 * Serve the attachments that live next to the notes in `src/content`.
 *
 * Notes keep their images in an Obsidian-style `assets/` folder beside them.
 * `remark-obsidian` / `remark-content-image` point at the lower-cased path
 * relative to `src/content` (see `attachmentUrl`); this integration makes those
 * URLs work: a middleware in `astro dev`, and a copy into `dist/` after a build.
 */
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getContentIndex } from '../plugins/lib/content-index.js';

const MIME = {
	png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
	webp: 'image/webp', avif: 'image/avif', svg: 'image/svg+xml', bmp: 'image/bmp',
	ico: 'image/x-icon', pdf: 'application/pdf', mp4: 'video/mp4', webm: 'video/webm',
	mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
};

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
					res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream');
					res.end(await readFile(file));
				});
			},
			'astro:build:done': ({ dir, logger }) => {
				const out = fileURLToPath(dir);
				const { attachments } = getContentIndex();
				for (const [rel, file] of attachments) {
					const target = join(out, ...rel.split('/'));
					mkdirSync(dirname(target), { recursive: true });
					copyFileSync(file, target);
				}
				logger.info(`copied ${attachments.size} content attachments`);
			},
		},
	};
}
