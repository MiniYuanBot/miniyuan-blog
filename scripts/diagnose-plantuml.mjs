/**
 * Print the PlantUML server's error text for every diagram that does not render.
 *
 *   node scripts/diagnose-plantuml.mjs
 *
 * The source transformation and the shared style come from the plugin itself, so
 * this can never drift from what the build actually sends.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { buildPlantumlSource, remoteUrlFor } from '../src/plugins/remark-plantuml.js';

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

const blocks = [];
for (const file of walk(CONTENT)) {
	const lines = readFileSync(file, 'utf8').split('\n');
	const skip = fenced(lines);
	let start = -1;
	for (let i = 0; i < lines.length; i += 1) {
		if (!skip[i]) continue;
		if (/^\s{0,3}```plantuml/.test(lines[i])) start = i;
		else if (start !== -1 && /^\s{0,3}```\s*$/.test(lines[i])) {
			blocks.push({ file: relative(ROOT, file), line: start + 1, body: lines.slice(start + 1, i).join('\n') });
			start = -1;
		}
	}
}

const clean = (html) =>
	html
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<[^>]+>/g, '')
		.replace(/&quot;/g, '"')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
		.split('\n')
		.map((l) => l.trim())
		.filter(Boolean);

let cursor = 0;
const failures = [];

async function worker() {
	while (cursor < blocks.length) {
		const block = blocks[cursor++];
		const source = buildPlantumlSource(block.body);
		const url = remoteUrlFor(source);
		try {
			const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
			const body = await res.text();
			if (!res.ok || !body.trimStart().startsWith('<svg')) {
				failures.push({ ...block, source, lines: clean(body) });
			}
		} catch (error) {
			failures.push({ ...block, source, lines: [String(error)] });
		}
	}
}

await Promise.all(Array.from({ length: 5 }, worker));

console.log(`blocks: ${blocks.length}, still failing: ${failures.length}\n`);
for (const failure of failures) {
	// The server echoes the whole diagram and the injected style; the useful part
	// is the sentence after it.
	const echoed = failure.lines.join(' ');
	const afterStyle = echoed.split('RoundCorner 4}')[1] ?? echoed;
	const diagnosis = afterStyle.match(
		/(Use 'allowmixing'[^)]*\)|Syntax Error\?[^)]*\)|After create command[^)]*\))/,
	);

	console.log(`--- ${failure.file}:${failure.line}`);
	console.log(`    diagnosis: ${diagnosis ? diagnosis[1] : failure.lines.slice(0, 2).join(' | ')}`);
	console.log('    source (first 14 lines):');
	console.log(
		failure.source
			.split('\n')
			.slice(15, 29)
			.map((l) => `      | ${l}`)
			.join('\n'),
	);
	console.log();
}
