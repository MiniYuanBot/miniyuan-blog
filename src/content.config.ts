import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { basename } from 'node:path';
import { PostSchema } from './schemas';

/** The date a file was first committed, else its modification time. */
function fileDate(filePath: string): Date {
	try {
		const out = execFileSync('git', ['log', '--diff-filter=A', '--follow', '--format=%aI', '--', filePath], {
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'ignore'],
		}).trim().split('\n').pop();
		if (out) return new Date(out);
	} catch {
		/* not a git checkout */
	}
	return statSync(filePath).mtime;
}

/**
 * `glob()` plus the defaults an Obsidian note does not carry, so notes copied
 * from the vault (note-buddy / class-skipper output) need no extra frontmatter:
 *
 *   title    <- the file name
 *   pubDate  <- `date` / `created`, else the first commit of the file, else mtime
 *   excerpt  <- `description` / `summary`, else empty
 */
function vaultGlob(base: string): ReturnType<typeof glob> {
	const loader = glob({ base, pattern: '**/*.{md,mdx}' });
	return {
		...loader,
		load: (context) =>
			loader.load({
				...context,
				parseData: (props) => {
					// Raw frontmatter, before the schema has validated it.
					const data: Record<string, unknown> = { ...props.data };
					const file = props.filePath;
					data.title ??= file ? basename(file).replace(/\.mdx?$/, '') : props.id;
					data.pubDate ??= data.date ?? data.created ?? (file ? fileDate(file) : new Date());
					data.excerpt ??= data.description ?? data.summary ?? '';
					return context.parseData({ ...props, data: data as typeof props.data });
				},
			}),
	};
}

const blog = defineCollection({
	loader: vaultGlob('./src/content/blog'),
	schema: ({ image }) => PostSchema(image),
});

const note = defineCollection({
	loader: vaultGlob('./src/content/note'),
	schema: ({ image }) => PostSchema(image),
});

export const collections = { blog, note };
