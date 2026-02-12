// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import unocss from 'unocss/astro';

// https://astro.build/config
export default defineConfig({
	site: 'https://example.com', // TODO: change to actual website
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
	vite: {
		resolve: {
			alias: {
				'@': '/src'
			}
		}
	}
});