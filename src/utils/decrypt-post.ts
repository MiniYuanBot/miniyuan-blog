/** Browser-only format; no environment variables or server imports belong here. */
export interface EncryptedPost {
	version: number;
	salt: string;
	iv: string;
	ciphertext: string;
}

export interface DecryptedPost {
	html: string;
	headings: { depth: number; slug: string; text: string }[];
	assets: Record<string, { type: string; data: string }>;
}

export const base64Bytes = (value: string) =>
	Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

export async function decryptPost(payload: EncryptedPost, password: string): Promise<DecryptedPost> {
	if (payload.version !== 1) throw new Error('Unsupported encrypted article format');
	const material = await crypto.subtle.importKey(
		'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey'],
	);
	const key = await crypto.subtle.deriveKey(
		{ name: 'PBKDF2', hash: 'SHA-256', salt: base64Bytes(payload.salt), iterations: 600_000 },
		material, { name: 'AES-GCM', length: 256 }, false, ['decrypt'],
	);
	const plain = await crypto.subtle.decrypt(
		{ name: 'AES-GCM', iv: base64Bytes(payload.iv), tagLength: 128 },
		key, base64Bytes(payload.ciphertext),
	);
	return JSON.parse(new TextDecoder().decode(plain));
}
