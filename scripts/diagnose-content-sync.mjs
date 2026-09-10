/**
 * Run the project's real markdown pipeline over every content file and report
 * anything that throws.
 *
 *   node scripts/diagnose-content-sync.mjs [blog|note]
 *
 * Astro's glob loader renders each entry during the content sync and stores the
 * result. A file that fails to render is logged, but it is worth being able to
 * reproduce that failure outside a 60-second build.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
	createMarkdownProcessor,
	rehypeHeadingIds,
} from '@astrojs/markdown-remark';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import remarkContentImage from '../src/plugins/remark-content-image.js';
import remarkImageCaption from '../src/plugins/remark-image-caption.js';
import remarkPlantuml from '../src/plugins/remark-plantuml.js';

const ROOT = process.cwd();
const which = process.argv[2] ?? 'note';
const base = join(ROOT, 'src', 'content', which);

function walk(dir, out = []) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) walk(full, out);
		else if (entry.isFile() && entry.name.endsWith('.md')) out.push(full);
	}
	return out;
}

const files = walk(base).sort();
console.log(`collection "${which}": ${files.length} files\n`);

const processor = await createMarkdownProcessor({
	remarkPlugins: [
		remarkMath,
		remarkContentImage,
		remarkImageCaption,
		remarkPlantuml,
	],
	rehypePlugins: [rehypeKatex, rehypeHeadingIds],
	shikiConfig: { langAlias: { fortran: 'fortran-free-form' } },
	gfm: true,
	smartypants: true,
});

const failures = [];
const slow = [];
let index = 0;

for (const file of files) {
	const source = readFileSync(file, 'utf8');
	const started = Date.now();
	try {
		const result = await processor.render(source, {
			fileURL: pathToFileURL(file),
		});
		const elapsed = Date.now() - started;
		if (elapsed > 5000) slow.push({ file: relative(ROOT, file), elapsed });
		if (!result.code) failures.push({ file: relative(ROOT, file), error: 'empty output' });
	} catch (error) {
		failures.push({
			file: relative(ROOT, file),
			error: error instanceof Error ? error.message : String(error),
		});
	}
	index += 1;
	process.stdout.write(`\r  rendered ${index}/${files.length}`);
}

console.log('\n');
console.log(`failures: ${failures.length}`);
for (const failure of failures) {
	console.log(`  ${failure.file}\n    ${failure.error.split('\n')[0]}`);
}
if (slow.length) {
	console.log(`\nslow (>5s, plantuml network):`);
	for (const item of slow) console.log(`  ${item.elapsed}ms  ${item.file}`);
}
