/**
 * Render every ```plantuml diagram in `src/content` into `.plantuml-cache/`.
 *
 *   node scripts/plantuml-cache.mjs            # fetch what is missing
 *   node scripts/plantuml-cache.mjs --check    # report only, never fetch
 *   node scripts/plantuml-cache.mjs --force    # re-render everything
 *   node scripts/plantuml-cache.mjs --strict   # exit non-zero if anything failed
 *
 * The remark plugin reads this cache synchronously and never talks to the
 * network itself — see the comment at the top of
 * `src/plugins/remark-plantuml.js` for why that matters.
 *
 * Wired to `pnpm plantuml`, and also to `prebuild`, so `pnpm build` always has a
 * complete cache. When everything is already cached this is a fast local
 * no-op (walk files, hash, compare).
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import {
	buildPlantumlSource,
	cacheFileFor,
	hashSource,
	remoteUrlFor,
	resolveCacheDir,
} from '../src/plugins/remark-plantuml.js';

const ROOT = process.cwd();
const CONTENT = join(ROOT, 'src', 'content');
const CACHE_DIR = resolveCacheDir();

const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has('--check');
const FORCE = args.has('--force');
const STRICT = args.has('--strict');

const CONCURRENCY = 4;
const ATTEMPTS = 3;
const TIMEOUT_MS = 20_000;

function walk(dir, out = []) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) walk(full, out);
		else if (entry.isFile() && entry.name.endsWith('.md')) out.push(full);
	}
	return out;
}

/** Lines inside ``` / ~~~ fences, so plantuml blocks can be located reliably. */
function fencedFlags(lines) {
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

/** Every ```plantuml block in the project, with its location. */
function collectDiagrams() {
	const diagrams = [];

	for (const file of walk(CONTENT)) {
		const lines = readFileSync(file, 'utf8').split('\n');
		const flags = fencedFlags(lines);
		let start = -1;

		for (let i = 0; i < lines.length; i += 1) {
			if (!flags[i]) continue;
			if (/^\s{0,3}```plantuml/.test(lines[i])) start = i;
			else if (start !== -1 && /^\s{0,3}```\s*$/.test(lines[i])) {
				const code = lines.slice(start + 1, i).join('\n');
				const source = buildPlantumlSource(code);
				diagrams.push({
					file: relative(ROOT, file),
					line: start + 1,
					source,
					hash: hashSource(source),
				});
				start = -1;
			}
		}
	}

	return diagrams;
}

const svgIsValid = (text) => text.trimStart().startsWith('<svg');

async function fetchWithRetry(source) {
	const url = remoteUrlFor(source);
	let lastError;

	for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
		try {
			const res = await fetch(url, {
				signal: AbortSignal.timeout(TIMEOUT_MS),
				headers: { accept: 'image/svg+xml' },
			});
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const svg = await res.text();
			// The service also answers 200 with an error page.
			if (!svgIsValid(svg)) throw new Error('response was not an SVG document');
			return svg;
		} catch (error) {
			lastError = error;
			// Back off a little; the service rate-limits bursts.
			await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
		}
	}

	throw lastError;
}

console.log(`collecting diagrams from ${relative(ROOT, CONTENT)} …`);
const diagrams = collectDiagrams();

// The same diagram can appear in several posts; render it once.
const unique = new Map();
for (const diagram of diagrams) {
	if (!unique.has(diagram.hash)) unique.set(diagram.hash, diagram);
}

const pending = [];
let cached = 0;
for (const [hash, diagram] of unique) {
	const file = cacheFileFor(diagram.source, CACHE_DIR);
	if (!FORCE && existsSync(file) && svgIsValid(readFileSync(file, 'utf8'))) cached += 1;
	else pending.push(diagram);
}

console.log(
	`${diagrams.length} diagram(s) in ${new Set(diagrams.map((d) => d.file)).size} file(s) · ` +
		`${unique.size} unique · ${cached} cached · ${pending.length} to render`,
);

if (pending.length === 0) {
	console.log('cache is complete – nothing to do.');
	process.exit(0);
}

if (CHECK_ONLY) {
	console.log('\nmissing:');
	for (const diagram of pending) console.log(`  ${diagram.file}:${diagram.line}`);
	process.exit(STRICT ? 1 : 0);
}

mkdirSync(CACHE_DIR, { recursive: true });

let done = 0;
let fetched = 0;
const failures = [];

async function worker() {
	while (pending.length > 0) {
		const diagram = pending.shift();
		if (!diagram) break;

		try {
			const svg = await fetchWithRetry(diagram.source);
			writeFileSync(cacheFileFor(diagram.source, CACHE_DIR), svg, 'utf8');
			fetched += 1;
		} catch (error) {
			failures.push({
				where: `${diagram.file}:${diagram.line}`,
				error: error instanceof Error ? error.message : String(error),
			});
		}

		done += 1;
		process.stdout.write(`\r  rendered ${done}/${done + pending.length}   `);
	}
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));
process.stdout.write('\n');

console.log(`${fetched} diagram(s) written to ${relative(ROOT, CACHE_DIR)}`);
if (failures.length) {
	console.log(`\n${failures.length} failed (they stay as remote <img> tags):`);
	for (const failure of failures) console.log(`  ${failure.where}  ${failure.error}`);
	if (STRICT) process.exitCode = 1;
}
