// Server-only: never import this module from a browser script.
import { createCipheriv, pbkdf2Sync, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { getContentIndex } from '../plugins/lib/content-index.js';
import { ATTACHMENT_MIME, attachmentReferences } from './content-attachments.js';

/** Package local attachments inside the ciphertext, rather than publishing them. */
export function bundlePost(html, headings = [], attachments = getContentIndex().attachments) {
	const assets = {};
	for (const [url, key] of attachmentReferences(html, attachments)) {
		const file = attachments.get(key);
		assets[url] = {
			type: ATTACHMENT_MIME[file.split('.').pop().toLowerCase()] ?? 'application/octet-stream',
			data: readFileSync(file).toString('base64'),
		};
	}
	return { html, headings, assets };
}

/** AES-256-GCM with a fresh salt and IV for every rendered article. */
export function encryptPost(content, password) {
	if (typeof password !== 'string' || password.length < 16 || password === 'replace-with-a-long-random-password') {
		throw new Error('Encrypted posts require a password of at least 16 characters in .env.local or the build environment.');
	}
	const salt = randomBytes(16);
	const iv = randomBytes(12);
	const key = pbkdf2Sync(password, salt, 600_000, 32, 'sha256');
	const cipher = createCipheriv('aes-256-gcm', key, iv);
	const ciphertext = Buffer.concat([
		cipher.update(JSON.stringify(content), 'utf8'), cipher.final(), cipher.getAuthTag(),
	]);
	key.fill(0);
	return {
		version: 1,
		salt: salt.toString('base64'),
		iv: iv.toString('base64'),
		ciphertext: ciphertext.toString('base64'),
	};
}
