// @ts-check
import { defineConfig } from 'astro/config';
import { rehypeHeadingIds } from '@astrojs/markdown-remark'
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import unocss from 'unocss/astro';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import remarkContentImage from './src/plugins/remark-content-image.js';
import remarkImageCaption from './src/plugins/remark-image-caption.js';
import remarkPlantuml from './src/plugins/remark-plantuml.js';

// https://astro.build/config
export default defineConfig({
	site: 'https://miniyuan.site',

	// output: 'server',
	output: 'static', // default

	image: {
		responsiveStyles: true,  // 自动生成响应式图片样式
		service: {
			entrypoint: 'astro/assets/services/sharp'  // 使用 Sharp 库处理图片优化
		}
	},

	integrations: [
		mdx(),
		sitemap(),
		unocss({
			// Inject Tailwind-style CSS reset
			injectReset: '@unocss/reset/tailwind.css',

			// NOTE: presets / theme / shortcuts / safelist all live in
			// `unocss.config.ts`. That file takes precedence over this inline
			// object (UnoCSS merges it last), so declaring presets here too was
			// dead configuration.

			// Enable @apply and @screen directives support
			transformers: [
				(await import('@unocss/transformer-directives')).default()
			],

			// Enable UnoCSS Inspector in development (visit /__unocss)
			inspector: true
		})
	],

	markdown: {
		// `fortran` is not one of Shiki's default language ids, so fences tagged
		// ```fortran used to warn and fall back to plaintext. Shiki does bundle
		// the grammar under `fortran-free-form`; the alias resolves to it and the
		// grammar is loaded lazily, so no extra dependency is needed.
		shikiConfig: {
			langAlias: {
				fortran: 'fortran-free-form',
			},
		},

		remarkPlugins: [
			remarkMath,
			// Resolve short image names + normalise caption metadata, then turn
			// captioned images into <figure> markup. Order matters.
			remarkContentImage,
			remarkImageCaption,
			remarkPlantuml,
		],
		rehypePlugins: [
			rehypeKatex,
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