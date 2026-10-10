import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { bundlePost, encryptPost } from '../src/utils/post-encryption.js';
import { decryptPost } from '../src/utils/decrypt-post.ts';
import { attachmentReferences } from '../src/utils/content-attachments.js';

const password = 'only-a-test-password-2026';
const content = { html: '<h2 id="private">私人内容 🔒</h2>', headings: [{ depth: 2, slug: 'private', text: '私人内容' }], assets: {} };

test('Node encryption decrypts with browser Web Crypto, preserving Unicode and headings', async () => {
	assert.deepEqual(await decryptPost(encryptPost(content, password), password), content);
});

test('wrong passwords and modified ciphertext are rejected', async () => {
	const payload = encryptPost(content, password);
	await assert.rejects(decryptPost(payload, 'wrong-password'));
	const bytes = Buffer.from(payload.ciphertext, 'base64');
	bytes[0] ^= 1;
	await assert.rejects(decryptPost({ ...payload, ciphertext: bytes.toString('base64') }, password));
});

test('each encryption has independent salt, IV, and ciphertext', () => {
	const a = encryptPost(content, password);
	const b = encryptPost(content, password);
	for (const key of ['salt', 'iv', 'ciphertext']) assert.notEqual(a[key], b[key]);
	assert.equal(JSON.stringify(a).includes(content.html), false);
});

test('missing, short, and example passwords fail closed', () => {
	for (const value of [undefined, '', 'short', 'replace-with-a-long-random-password']) {
		assert.throws(() => encryptPost(content, value));
	}
});

test('encrypted bundles include local attachment bytes and responsive image URLs', async () => {
	const file = fileURLToPath(new URL('../public/favicon.svg', import.meta.url));
	const attachments = new Map([['blog/private.svg', file], ['blog/unused.svg', file]]);
	const html = '<img src="/blog/private.svg" srcset="/blog/private.svg 2x"><a href="/blog/private.svg#preview">附件</a>';
	const bundle = bundlePost(html, [], attachments);
	assert.deepEqual([...attachmentReferences(html, attachments).values()], ['blog/private.svg', 'blog/private.svg']);
	assert.equal(bundle.assets['/blog/private.svg'].type, 'image/svg+xml');
	assert.equal(bundle.assets['/blog/private.svg'].data, readFileSync(file).toString('base64'));
	assert.equal(Object.keys(bundle.assets).length, 2);
	assert.deepEqual(await decryptPost(encryptPost(bundle, password), password), bundle);
});
