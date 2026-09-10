// @ts-check
import { defineConfig } from 'astro/config';
import { unified, rehypeHeadingIds } from '@astrojs/markdown-remark'
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
	// Astro 7 changed the default of compressHTML from `true` to `'jsx'`,
	// which strips whitespace between inline elements (e.g. "Blog" + "Note"
	// in nav links would render as "BlogNote"). Keep the previous
	// HTML-aware compression to preserve the existing layout.
	compressHTML: true,
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
		// Astro 7 renders .md/.mdx with Sätteri by default. This project relies on
		// remark/rehype plugins (KaTeX math, image captions, PlantUML, heading IDs),
		// so we keep the unified() remark/rehype pipeline from @astrojs/markdown-remark.
		processor: unified({
			remarkPlugins: [
				remarkMath,
				// Resolve short image names + normalise caption metadata, then turn
				// captioned images into <figure> markup. Order matters:
				// `remarkContentImage` must run before `remarkImageCaption`.
				remarkContentImage,
				remarkImageCaption,
				remarkPlantuml,
			],
			rehypePlugins: [
				rehypeKatex,
				rehypeHeadingIds,
			],
		}),
	},

	vite: {
		resolve: {
			alias: {
				'@': '/src'
			}
		}
	},

});
