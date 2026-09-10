/**
 * Re-render every math expression in `src/content` with the same KaTeX settings
 * Astro uses and report any remaining warning.
 *
 *   node scripts/check-math.mjs
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import katex from 'katex';

const ROOT = process.cwd();
const CONTENT = join(ROOT, 'src', 'content');

function walk(dir, out = []) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) walk(full, out);
		else if (entry.isFile() && entry.name.endsWith('.md')) out.push(full);
	}
	return out;
}

function fenced(lines) {
	const flags = new Array(lines.length).fill(false);
	let fence = null;
	for (let i = 0; i < lines.length; i += 1) {
		const m = lines[i].match(/^\s{0,3}(`{3,}|~{3,})/);
		if (fence) {
			flags[i] = true;
			if (m && m[1][0] === fence[0] && m[1].length >= fence.length) fence = null;
			continue;
		}
		if (m) {
			flags[i] = true;
			fence = m[1];
		}
	}
	return flags;
}

/**
 * Remove inline code spans and escaped dollars so that `$` characters which are
 * data (`` `$` ``, `${}`, `$()` …) are not mistaken for math delimiters. This
 * mirrors remark-math, which never sees text inside a code span.
 */
function stripCodeAndEscapes(line) {
	return line.replace(/`[^`]*`/g, ' ').replace(/\\\$/g, ' ');
}

/**
 * remark-math pairs `$` delimiters left to right and allows padding spaces
 * inside them (`$ A $` is still math), so the expressions have to be extracted
 * by scanning and pairing, not by a regex that guesses at delimiters.
 */
function extractInlineMath(line) {
	const source = stripCodeAndEscapes(line);
	const found = [];

	let i = 0;
	while (i < source.length) {
		if (source[i] !== '$') {
			i += 1;
			continue;
		}
		// `$$` is display math, handled by the caller
		if (source[i + 1] === '$') {
			i += 2;
			continue;
		}

		const close = source.indexOf('$', i + 1);
		if (close === -1) break;
		if (source[close + 1] === '$') {
			i = close + 1;
			continue;
		}

		found.push(source.slice(i + 1, close));
		i = close + 1;
	}

	return found;
}

const items = [];

for (const file of walk(CONTENT)) {
	const lines = readFileSync(file, 'utf8').split('\n');
	const skip = fenced(lines);
	const where = relative(ROOT, file);

	for (let i = 0; i < lines.length; i += 1) {
		if (skip[i]) continue;
		const line = lines[i];

		// display math first, so its `$$` is not treated as inline math
		const open = line.indexOf('$$');
		if (open !== -1) {
			const rest = line.slice(open + 2);
			const close = rest.indexOf('$$');
			if (close !== -1) {
				items.push({ tex: rest.slice(0, close), display: true, where: `${where}:${i + 1}` });
			} else {
				let tex = rest;
				let end = -1;
				for (let j = i + 1; j < lines.length; j += 1) {
					if (skip[j]) continue;
					const at = lines[j].indexOf('$$');
					if (at !== -1) {
						tex += `\n${lines[j].slice(0, at)}`;
						end = j;
						break;
					}
					tex += `\n${lines[j]}`;
				}
				if (end !== -1) {
					items.push({ tex, display: true, where: `${where}:${i + 1}-${end + 1}` });
					i = end;
				}
			}
			continue;
		}

		for (const tex of extractInlineMath(line)) {
			items.push({ tex, display: false, where: `${where}:${i + 1}` });
		}
	}
}

const flagged = [];
const counts = new Map();

for (const item of items) {
	const messages = [];
	const originalWarn = console.warn;
	const originalError = console.error;
	console.warn = (...args) => messages.push(args.join(' '));
	console.error = (...args) => messages.push(args.join(' '));
	try {
		katex.renderToString(item.tex, {
			displayMode: item.display,
			throwOnError: false,
			strict: 'warn',
		});
	} catch (error) {
		messages.push(String(error));
	}
	console.warn = originalWarn;
	console.error = originalError;

	for (const message of messages) {
		const code = message.match(/\[([a-zA-Z]+)\]$/)?.[1] ?? 'parse-error';
		counts.set(code, (counts.get(code) ?? 0) + 1);
		if (code !== 'parse-error') flagged.push({ ...item, message });
	}
}

console.log(`math expressions checked: ${items.length}`);
console.log(`warnings: ${flagged.length}`);
for (const [code, count] of counts) console.log(`  ${code}: ${count}`);
console.log();
for (const item of flagged.slice(0, 20)) {
	console.log(`  ${item.where}\n    ${item.message}`);
}
if (!flagged.length) console.log('  none');
