/** Shared attachment lookup for publishing and encrypted article bundles. */
export const ATTACHMENT_MIME = {
	png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
	webp: 'image/webp', avif: 'image/avif', svg: 'image/svg+xml', bmp: 'image/bmp',
	ico: 'image/x-icon', pdf: 'application/pdf', mp4: 'video/mp4', webm: 'video/webm',
	mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg',
};

export function attachmentKey(url) {
	if (!url.startsWith('/') || url.startsWith('//')) return null;
	try {
		return decodeURIComponent(url.split(/[?#]/)[0]).slice(1).toLowerCase();
	} catch {
		return null;
	}
}

/** URLs in rendered HTML, including responsive image candidates. */
export function attachmentReferences(html, attachments) {
	const references = new Map();
	const add = (raw) => {
		const url = raw.replace(/&amp;/g, '&');
		const key = attachmentKey(url);
		if (key && attachments.has(key)) references.set(url, key);
	};
	for (const match of html.matchAll(/\b(?:src|href|poster|data-src)\s*=\s*["']([^"']+)["']/gi)) {
		add(match[1]);
	}
	for (const match of html.matchAll(/\bsrcset\s*=\s*["']([^"']+)["']/gi)) {
		for (const candidate of match[1].split(',')) add(candidate.trim().split(/\s+/)[0]);
	}
	return references;
}
