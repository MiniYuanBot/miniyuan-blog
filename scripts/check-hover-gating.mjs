/**
 * Verify that hover styles behave on a touch screen.
 *
 *   node scripts/check-hover-gating.mjs
 *
 * Two independent things are checked, because either one alone can be wrong:
 *
 *   1. **Pointer gating** — every rule that can react to hover must sit inside
 *      `@media (hover: hover)`. Touch browsers apply `:hover` on tap and keep it
 *      until something else is tapped, so an ungated rule becomes a *stuck*
 *      visual state on phones.
 *
 *   2. **The `:hover` pseudo-class is actually still there** — a custom variant
 *      that adds the media query but forgets to re-append `:hover` produces
 *      `.hover\:-translate-y-2{…}`, which applies the hover state
 *      *unconditionally* on every pointer-capable device ("the card is always
 *      hovering"). This is checked per selector, not per rule, because UnoCSS
 *      merges selectors with identical declarations into one comma-separated
 *      list (e.g. `.group:hover .group-hover\:scale-105,.hover\:scale-105`).
 *
 * Exits non-zero when anything is wrong.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const DIST = join(ROOT, 'dist', '_astro');

let files;
try {
	files = readdirSync(DIST).filter((f) => f.endsWith('.css'));
} catch {
	console.error('dist/_astro not found – build first.');
	process.exit(2);
}
if (files.length === 0) {
	console.error('no CSS in dist/_astro – build first.');
	process.exit(2);
}

const AT_RULE = /^@(media|supports|layer|container)/;
/** `.hover\:` and `.group-hover\:` are the escaped utility class prefixes. */
const HOVER_UTILITY = /\.(?:group-)?hover\\:/;

/**
 * Walk the stylesheet once. `buffer` accumulates the text before the next `{`,
 * `}` or `;` — i.e. a selector list when a block opens, and declarations inside
 * one. At-rule blocks are pushed so a rule can be attributed to its ancestors.
 */
function inspect(css) {
	const problems = [];
	const stack = [];
	let buffer = '';
	let gatedRules = 0;
	let hoverRules = 0;

	const record = (head) => {
		const mentionsHover = head.includes(':hover') || HOVER_UTILITY.test(head);
		if (!mentionsHover) return;

		hoverRules += 1;
		const pointerGated = stack.some((at) => /\(hover:\s*hover\)/.test(at));
		const deliberatelyOff = stack.some((at) => /\(hover:\s*none\)/.test(at));

		if (pointerGated) gatedRules += 1;

		// Check each selector of a comma-separated list on its own.
		for (const selector of head.split(',').map((s) => s.trim())) {
			const isHoverUtility = HOVER_UTILITY.test(selector);
			if (!isHoverUtility && !selector.includes(':hover')) continue;

			if (isHoverUtility && !selector.includes(':hover')) {
				problems.push({
					kind: 'missing :hover',
					selector,
					hint: 'this utility would apply its hover state unconditionally',
				});
				continue;
			}

			if (!pointerGated && !deliberatelyOff) {
				problems.push({
					kind: 'not pointer-gated',
					selector,
					hint: 'wrap it in @media (hover: hover), or it sticks after a tap',
				});
			}
		}
	};

	for (const char of css) {
		if (char === '{') {
			const head = buffer.trim();
			if (AT_RULE.test(head)) {
				stack.push(head);
			} else {
				record(head);
				stack.push(null);
			}
			buffer = '';
			continue;
		}

		if (char === '}') {
			stack.pop();
			buffer = '';
			continue;
		}

		if (char === ';') {
			buffer = '';
			continue;
		}

		buffer += char;
	}

	return { problems, gatedRules, hoverRules };
}

let totalHover = 0;
let totalGated = 0;
const allProblems = [];

for (const file of files) {
	const css = readFileSync(join(DIST, file), 'utf8');
	const { problems, gatedRules, hoverRules } = inspect(css);
	totalHover += hoverRules;
	totalGated += gatedRules;

	console.log(
		`${file}: ${hoverRules} hover rule(s), ${gatedRules} pointer-gated, ${problems.length} problem(s)`,
	);
	for (const problem of problems) allProblems.push({ file, ...problem });
}

console.log(`\ntotal hover rules: ${totalHover}   pointer-gated: ${totalGated}`);

if (allProblems.length) {
	console.log(`\nPROBLEMS (${allProblems.length}):`);
	for (const problem of allProblems) {
		console.log(`  [${problem.kind}] ${problem.file}`);
		console.log(`      ${problem.selector.slice(0, 150)}`);
		console.log(`      → ${problem.hint}`);
	}
	process.exitCode = 1;
} else {
	console.log('every hover selector is pointer-gated and keeps its :hover.');
}
