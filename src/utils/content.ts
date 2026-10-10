import { type CollectionEntry, getCollection } from 'astro:content';

/** The two post collections. They share `PostSchema`, so one type covers both. */
export const KINDS = ['blog', 'note'] as const;
export type Kind = (typeof KINDS)[number];
export type Post = CollectionEntry<Kind>;

/**
 * All entries of a collection, newest first.
 *
 * `getCollection(kind)` with a union `kind` — or a `kind === 'blog' ? … : …`
 * branch — yields `BlogEntry[] | NoteEntry[]`, a union of *arrays*, whose
 * methods (`sort`, `filter`, …) TypeScript cannot call. Widening to `Post[]`
 * (an array of the union) here is what lets every caller stay generic.
 */
export async function getPosts(kind: Kind): Promise<Post[]> {
	const posts: Post[] = await getCollection(kind, ({ data }) => !data.draft);
	return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** Distinct tags of a list of posts. */
export const tagsOf = (posts: Post[]) => [...new Set(posts.flatMap((post) =>
	post.data.passwordEnv ? [] : post.data.tags ?? [],
))];

/** Entries whose metadata and body may be published to feeds and indexes. */
export async function getPublicPosts(kind: Kind): Promise<Post[]> {
	return (await getPosts(kind)).filter((post) => !post.data.passwordEnv);
}

/** Site URL of a post. */
export const postUrl = (post: Post) => `/${post.collection}/${post.id}/`;
