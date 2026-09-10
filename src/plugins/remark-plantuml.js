/**
 * remark-plantuml
 * ===============
 * Inlines ```` ```plantuml ```` fences as SVG.
 *
 * ## Why this plugin is synchronous, and why it has a cache
 *
 * The natural implementation — `await fetch()` inside the plugin — turns out to
 * be unusable here. Astro's content loader renders up to 10 files concurrently,
 * and this site has ~146 diagrams spread over 14 notes (one note alone has 34).
 * With that much async work inside the markdown pipeline, Astro's content sync
 * became unreliable: entire directories of notes silently vanished from the
 * collection, so their pages were never generated. It was non-deterministic —
 * the same build produced 46, 71, 82 or 85 notes depending on network timing —
 * and nothing was logged, which made it look like a routing bug.
 *
 * So the plugin does **no I/O that can wait**. Every diagram is keyed by the
 * SHA-256 of the exact source sent to the service, the SVG lives in
 * `.plantuml-cache/<hash>.svg`, and this plugin only ever reads that directory
 * synchronously.
 *
 * `scripts/plantuml-cache.mjs` (wired to `pnpm plantuml` and to `prebuild`)
 * renders whatever is missing. Diagrams that are not cached yet are emitted as a
 * plain `<img>` pointing at plantuml.com, so a page is never broken — it just
 * depends on the service at view time until the cache is filled.
 *
 * Commit `.plantuml-cache/` and builds need no network at all.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { encode } from 'plantuml-encoder';
import { visit } from 'unist-util-visit';

export const SERVER = 'https://www.plantuml.com/plantuml/svg';
export const DEFAULT_CACHE_DIR = '.plantuml-cache';

/**
 * Shared styling injected into every diagram.
 *
 * `allowmixing` is deliberately NOT here: it makes PlantUML assume a class
 * diagram, so every use-case / activity / state / sequence diagram used to come
 * back as HTTP 400 ("Syntax Error? (Assumed diagram type: class)"). Diagrams
 * that really do mix classes with components or nodes declare `allowmixing`
 * themselves, on the first line of their own block.
 */
export const COMMON_STYLE = `hide circle
skinparam classAttributeIconSize 0
skinparam shadowing false
skinparam class {
    BackgroundColor #FEFEFE
    BorderColor #333
    ArrowColor #666
    FontColor #333
    FontSize 14
    AttributeFontSize 12
    MethodFontSize 12
    RoundCorner 4
}`;

export function resolveCacheDir(options = {}) {
	return options.cacheDir ?? join(process.cwd(), DEFAULT_CACHE_DIR);
}

/** The exact text sent to the service: `<code>` with the shared style injected. */
export function buildPlantumlSource(code) {
	const raw = code.trim();
	return raw.includes('@startuml')
		? raw.replace('@startuml', `@startuml\n${COMMON_STYLE}`)
		: `@startuml\n${COMMON_STYLE}\n${raw}\n@enduml`;
}

export function hashSource(source) {
	return createHash('sha256').update(source).digest('hex').slice(0, 32);
}

export function cacheFileFor(source, cacheDir = resolveCacheDir()) {
	return join(cacheDir, `${hashSource(source)}.svg`);
}

export function remoteUrlFor(source) {
	return `${SERVER}/${encode(source)}`;
}

/** An SVG string from the cache, or `null` when it has not been rendered yet. */
export function readCachedSvg(source, cacheDir = resolveCacheDir()) {
	const file = cacheFileFor(source, cacheDir);
	if (!existsSync(file)) return null;
	try {
		const svg = readFileSync(file, 'utf8');
		return svg.trimStart().startsWith('<svg') ? svg : null;
	} catch {
		return null;
	}
}

const imgFallback = (url) =>
	`<div class="plantuml-diagram"><img src="${url}" alt="PlantUML diagram" loading="lazy" /></div>`;

/** Collect uncached diagrams so the build prints one actionable line, not 30. */
const missingThisRun = new Set();
let exitHookInstalled = false;

function noteMissing(hash, cacheDir) {
	missingThisRun.add(hash);
	if (exitHookInstalled) return;
	exitHookInstalled = true;
	process.once('exit', () => {
		const count = missingThisRun.size;
		if (count === 0) return;
		// Deliberately synchronous: `exit` handlers cannot await.
		console.warn(
			`\n[remark-plantuml] ${count} diagram(s) are not in ${DEFAULT_CACHE_DIR} yet and were ` +
				`emitted as remote <img> tags.\n` +
				`                  Run \`pnpm plantuml\` to render them into the cache ` +
				`(see ${cacheDir}).`,
		);
	});
}

export default function remarkPlantuml(options = {}) {
	const cacheDir = resolveCacheDir(options);

	return (tree) => {
		visit(tree, 'code', (node, index, parent) => {
			if (node.lang !== 'plantuml') return;
			if (!parent || index === undefined) return;

			const source = buildPlantumlSource(node.value);
			const svg = readCachedSvg(source, cacheDir);

			if (svg) {
				parent.children[index] = {
					type: 'html',
					value: `<div class="plantuml-diagram">${svg}</div>`,
				};
				return;
			}

			noteMissing(hashSource(source), cacheDir);
			parent.children[index] = {
				type: 'html',
				value: imgFallback(remoteUrlFor(source)),
			};
		});
	};
}
