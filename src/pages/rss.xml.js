import { getCollection } from 'astro:content';
import rss from '@astrojs/rss';
import { siteConfig } from '@/config';

export async function GET(context) {
	const posts = (await getCollection('blog')).sort(
		(a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
	);

	return rss({
		title: siteConfig.title,
		description: siteConfig.description,
		site: context.site,
		items: posts.map((post) => ({
			// The collection schema calls it `excerpt`; @astrojs/rss looks for
			// `description`, so map it explicitly instead of spreading `data`.
			title: post.data.title,
			description: post.data.excerpt,
			pubDate: post.data.pubDate,
			link: `/blog/${post.id}/`,
			categories: post.data.tags ?? [],
			author: post.data.author,
		})),
	});
}
