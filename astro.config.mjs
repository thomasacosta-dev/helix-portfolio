// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	 devToolbar: { enabled: false },
	vite: {
		build: {
			rollupOptions: {
				output: {
					manualChunks: (id) => {
						if (id.includes('node_modules/three')) return 'three';
						if (id.includes('node_modules/gsap')) return 'gsap';
						if (id.includes('node_modules/lenis')) return 'lenis';
						return undefined;
					},
				},
			},
			chunkSizeWarningLimit: 800,
		},
	},
});
