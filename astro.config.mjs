// @ts-check
import { defineConfig } from 'astro/config';
import { rehypeHeadingIds } from '@astrojs/markdown-remark'
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import unocss from 'unocss/astro';
import vercel from '@astrojs/vercel'
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

// https://astro.build/config
export default defineConfig({
	// TODO: change to actual website
	site: 'https://example.com',

	adapter: vercel(),
	// output: 'server',

	image: {
		responsiveStyles: true,  // 自动生成响应式图片样式
		service: {
			entrypoint: 'astro/assets/services/sharp'  // 使用Sharp库处理图片优化
		}
	},

	integrations: [
		mdx(),
		sitemap(),
		unocss({
			// Inject Tailwind-style CSS reset
			injectReset: '@unocss/reset/tailwind.css',

			// UnoCSS preset with Tailwind compatibility
			presets: [
				(await import('@unocss/preset-wind3')).default(),
			],

			// Enable @apply and @screen directives support
			transformers: [
				(await import('@unocss/transformer-directives')).default()
			],

			// Enable UnoCSS Inspector in development (visit /__unocss)
			inspector: true
		})
	],

	markdown: {
		remarkPlugins: [remarkMath],
		rehypePlugins: [
			[rehypeKatex, {}],
			rehypeHeadingIds,
			// [
			// 	rehypeAutolinkHeadings,
			// 	{
			// 		behavior: 'append',
			// 		properties: { className: ['anchor'] },
			// 		content: { type: 'text', value: '#' }
			// 	}
			// ]
		],
	},

	vite: {
		resolve: {
			alias: {
				'@': '/src'
			}
		}
	},

});