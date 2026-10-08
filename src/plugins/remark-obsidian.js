/**
 * remark-obsidian
 * ===============
 * Renders the Obsidian flavour of Markdown so a note opened in Obsidian and the
 * same note on the site look alike. Notes written by note-buddy / class-skipper
 * can therefore be copied into `src/content` as they are.
 *
 * Supported:
 *
 *   > [!note] 标题              callouts, with `-` / `+` for collapsed / open
 *   [[note]] [[note#标题|文字]]   wikilinks (by path, file name, title or alias)
 *   ![[image.png|300]]          image embeds (other embeds become links)
 *   [文字](03-foo.md#标题)       relative links to notes and attachments
 *   ==高亮==  %%注释%%            highlights and comments
 *   ```mermaid                  rendered in the browser (see BlogPost.astro)
 *   # 标题                       a leading H1 is dropped; the layout prints the title
 *
 * Relative image paths (`assets/x.png`) are resolved by `remark-content-image`.
 * Unresolvable links are left as they are and reported, never thrown, because
 * a broken link is less harmful than a failed build.
 */
import { visit, SKIP } from 'unist-util-visit';
import {
	findAttachment,
	findNoteByName,
	findNoteByPath,
	headingFragment,
	IMAGE_EXT,
	NOTE_EXT,
	noteUrl,
} from './lib/content-index.js';

const HAS_SCHEME = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
const WIKILINK = /(!?)\[\[([^[\]\n]+?)\]\]/g;
const HIGHLIGHT = /==(?=\S)([^=\n]*?\S)==/g;
const INLINE_COMMENT = /%%[\s\S]*?%%/g;
const CALLOUT_MARKER = /^\[!([\w-]+)\]([+-]?)[ \t]*/;

/** Callout types and their aliases, as Obsidian groups them (used for colour). */
const CALLOUT_KIND = {
	note: 'note',
	abstract: 'abstract', summary: 'abstract', tldr: 'abstract',
	info: 'info',
	todo: 'todo',
	tip: 'tip', hint: 'tip', important: 'tip',
	success: 'success', check: 'success', done: 'success',
	question: 'question', help: 'question', faq: 'question',
	warning: 'warning', caution: 'warning', attention: 'warning',
	failure: 'failure', fail: 'failure', missing: 'failure',
	danger: 'danger', error: 'danger',
	bug: 'bug',
	example: 'example',
	quote: 'quote', cite: 'quote',
};

const escapeHtml = (value) =>
	String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');

function sourcePath(file) {
	const raw = file?.path ?? file?.history?.[0];
	return raw ? String(raw).replace(/^file:\/\//, '') : null;
}

/** Replace `node` (a text node) by the nodes produced for each regex match. */
function splitText(parent, index, node, regex, build) {
	const value = node.value;
	regex.lastIndex = 0;
	if (!regex.test(value)) return null;
	regex.lastIndex = 0;

	const out = [];
	let last = 0;
	for (const match of value.matchAll(regex)) {
		if (match.index > last) out.push({ type: 'text', value: value.slice(last, match.index) });
		const built = build(match);
		if (built) out.push(...[].concat(built));
		last = match.index + match[0].length;
	}
	if (last < value.length) out.push({ type: 'text', value: value.slice(last) });

	parent.children.splice(index, 1, ...out);
	return index + out.length;
}

export default function remarkObsidian() {
	return (tree, file) => {
		const from = sourcePath(file);
		const warn = (msg) => console.warn(`[remark-obsidian] ${from ?? ''}: ${msg}`);

		/** `note#heading` -> site URL, or null. */
		function wikiTarget(target) {
			const [name, ...rest] = target.split('#');
			const fragment = headingFragment(rest.join('#'));
			if (!name.trim()) return fragment || null; // [[#标题]] links into this page
			if (!from) return null;

			const note = findNoteByName(from, name);
			if (note) return `${noteUrl(note)}${fragment}`;
			const asset = findAttachment(from, name, { byName: true });
			if (asset) return asset.url;
			return null;
		}

		// 1. A leading `# 标题` duplicates the title the layout already prints.
		const firstContent = tree.children.findIndex((n) => n.type !== 'yaml' && n.type !== 'toml');
		if (firstContent !== -1 && tree.children[firstContent].type === 'heading' && tree.children[firstContent].depth === 1) {
			tree.children.splice(firstContent, 1);
		}

		// 2. Block comments: paragraphs from one starting with `%%` to one ending with it.
		for (let i = 0; i < tree.children.length; i += 1) {
			const node = tree.children[i];
			const text = node.type === 'paragraph' && node.children[0]?.type === 'text' ? node.children[0].value : '';
			if (!text.startsWith('%%') || text.slice(2).includes('%%')) continue;
			let end = i + 1;
			while (end < tree.children.length) {
				const n = tree.children[end];
				const lastChild = n.type === 'paragraph' ? n.children.at(-1) : null;
				if (lastChild?.type === 'text' && lastChild.value.trimEnd().endsWith('%%')) break;
				end += 1;
			}
			if (end < tree.children.length) {
				tree.children.splice(i, end - i + 1);
				i -= 1;
			}
		}

		// 3. Mermaid fences become `<pre class="mermaid">`, rendered client-side.
		visit(tree, 'code', (node, index, parent) => {
			if (node.lang !== 'mermaid' || !parent) return;
			parent.children.splice(index, 1, {
				type: 'html',
				value: `<pre class="mermaid not-prose">${escapeHtml(node.value)}</pre>`,
			});
		});

		// 4. Inline syntax in text: comments, wikilinks / embeds, highlights.
		visit(tree, 'text', (node, index, parent) => {
			if (!parent || index === undefined) return;
			if (parent.type === 'link' || parent.type === 'linkReference') return;

			const afterComments = splitText(parent, index, node, INLINE_COMMENT, () => null);
			if (afterComments !== null) return [SKIP, index];

			const afterLinks = splitText(parent, index, node, WIKILINK, (match) => {
				const [raw, bang, inner] = match;
				const [target, ...aliasParts] = inner.split('|');
				const alias = aliasParts.join('|').trim();
				const name = target.split('#')[0].trim();

				if (bang && IMAGE_EXT.test(name)) {
					const asset = from ? findAttachment(from, name, { byName: true }) : null;
					if (!asset) warn(`cannot find embedded image "${name}"`);
					return { type: 'image', url: asset?.url ?? name, alt: alias ? `|${alias}` : '', title: null };
				}

				const url = wikiTarget(target.trim());
				if (!url) {
					warn(`cannot resolve "${raw}"`);
					return { type: 'text', value: alias || target.trim() };
				}
				const label = alias || target.trim().replace(/#/g, ' > ').replace(NOTE_EXT, '');
				return { type: 'link', url, title: null, children: [{ type: 'text', value: label }] };
			});
			if (afterLinks !== null) return [SKIP, index];

			const afterMarks = splitText(parent, index, node, HIGHLIGHT, (match) => ({
				type: 'emphasis',
				data: { hName: 'mark' },
				children: [{ type: 'text', value: match[1] }],
			}));
			if (afterMarks !== null) return [SKIP, afterMarks];
		});

		// 5. Relative links to notes, attachments and headings.
		visit(tree, 'link', (node) => {
			const url = node.url ?? '';
			if (!url || url.startsWith('/') || HAS_SCHEME.test(url)) return;

			const hashAt = url.indexOf('#');
			const path = hashAt === -1 ? url : url.slice(0, hashAt);
			const fragment = headingFragment(hashAt === -1 ? '' : url.slice(hashAt + 1));

			if (!path) {
				node.url = fragment || url;
				return;
			}
			if (!from) return;

			let decoded = path;
			try {
				decoded = decodeURI(path);
			} catch {
				/* keep as is */
			}

			const note = findNoteByPath(from, decoded);
			if (note) {
				node.url = `${noteUrl(note)}${fragment}`;
				return;
			}
			const asset = findAttachment(from, decoded);
			if (asset) {
				node.url = asset.url;
				return;
			}
			if (NOTE_EXT.test(decoded)) warn(`cannot resolve link "${url}"`);
		});

		// 6. Callouts.
		visit(tree, 'blockquote', (node) => {
			if (node.data?.hName) return;
			const first = node.children[0];
			const lead = first?.type === 'paragraph' ? first.children[0] : null;
			if (lead?.type !== 'text') return;
			const marker = lead.value.match(CALLOUT_MARKER);
			if (!marker) return;

			const type = marker[1].toLowerCase();
			const fold = marker[2];
			lead.value = lead.value.slice(marker[0].length);

			// The title runs to the end of the first line; the rest is body.
			const title = [];
			const children = first.children;
			while (children.length) {
				const child = children[0];
				if (child.type === 'break') {
					children.shift();
					break;
				}
				if (child.type === 'text' && child.value.includes('\n')) {
					const at = child.value.indexOf('\n');
					if (at > 0) title.push({ type: 'text', value: child.value.slice(0, at) });
					child.value = child.value.slice(at + 1);
					if (!child.value) children.shift();
					break;
				}
				title.push(children.shift());
			}
			if (!children.length) node.children.shift();
			if (title[0]?.type === 'text') title[0].value = title[0].value.trimStart();
			if (title.length === 1 && title[0].type === 'text' && !title[0].value) title.length = 0;
			if (!title.length) title.push({ type: 'text', value: type.charAt(0).toUpperCase() + type.slice(1) });

			const foldable = fold === '-' || fold === '+';
			const kind = CALLOUT_KIND[type] ?? 'note';
			const body = node.children;

			node.data = {
				hName: foldable ? 'details' : 'div',
				hProperties: {
					className: ['callout', `callout-${kind}`],
					dataCallout: type,
					...(fold === '+' ? { open: true } : {}),
				},
			};
			node.children = [
				{
					type: 'paragraph',
					data: { hName: foldable ? 'summary' : 'div', hProperties: { className: ['callout-title'] } },
					children: title,
				},
				...(body.length
					? [{ type: 'blockquote', data: { hName: 'div', hProperties: { className: ['callout-content'] } }, children: body }]
					: []),
			];
		});
	};
}
