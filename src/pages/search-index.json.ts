import { getCollection } from 'astro:content';

/**
 * Search index, generated once at build time.
 *
 * Served as its own JSON file so the (relatively large) payload is fetched only
 * when someone actually opens /search, instead of being inlined into every page.
 *
 * `body` is a crude plain-text reduction of the Markdown, capped per entry: it
 * exists to make the body searchable and to provide a snippet, not to reproduce
 * the document.
 */
const BODY_LIMIT = 1000;

/** Turn Markdown source into something worth matching against. */
function toPlainText(markdown: string): string {
	return markdown
		// Fenced and indented code blocks: never interesting for a prose search.
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/~~~[\s\S]*?~~~/g, ' ')
		// Display and inline math.
		.replace(/\$\$[\s\S]*?\$\$/g, ' ')
		.replace(/\$[^$\n]*\$/g, ' ')
		// Raw HTML / MDX components (iframe demos, comments, …).
		.replace(/<!--[\s\S]*?-->/g, ' ')
		.replace(/<[^>]+>/g, ' ')
		// Images: keep the caption, drop the path.
		.replace(/!\[([^\]]*)\]\([^)]*\)/g, ' $1 ')
		// Links: keep the label.
		.replace(/\[([^\]]*)\]\([^)]*\)/g, ' $1 ')
		// Heading markers, emphasis, inline code, table pipes, quotes.
		.replace(/^\s{0,3}#{1,6}\s+/gm, ' ')
		.replace(/[*_`~]/g, '')
		.replace(/^\s{0,3}>\s?/gm, ' ')
		.replace(/^\s*\|.*\|\s*$/gm, ' ')
		.replace(/&[a-z]+;/gi, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function truncate(text: string): string {
	if (text.length <= BODY_LIMIT) return text;
	// Cut on a word boundary when there is one nearby.
	const slice = text.slice(0, BODY_LIMIT);
	const lastSpace = slice.lastIndexOf(' ');
	return (lastSpace > BODY_LIMIT - 120 ? slice.slice(0, lastSpace) : slice).trim();
}

export async function GET() {
	const [blogs, notes] = await Promise.all([
		getCollection('blog'),
		getCollection('note'),
	]);

	const entries = [
		...blogs.map((entry) => ({ entry, kind: 'blog' as const })),
		...notes.map((entry) => ({ entry, kind: 'note' as const })),
	];

	const index = entries
		.map(({ entry, kind }) => ({
			id: `${kind}/${entry.id}`,
			kind,
			title: entry.data.title,
			excerpt: entry.data.excerpt,
			tags: entry.data.tags ?? [],
			pubDate: entry.data.pubDate.toISOString().slice(0, 10),
			url: `/${kind}/${entry.id}/`,
			body: truncate(toPlainText(entry.body ?? '')),
		}))
		.sort((a, b) => (a.pubDate < b.pubDate ? 1 : -1));

	return new Response(JSON.stringify(index), {
		headers: {
			'content-type': 'application/json; charset=utf-8',
		},
	});
}
