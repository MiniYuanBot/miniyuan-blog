/// <reference types="astro/client" />
// import node_modules/astro/client.d.ts

// ===== image resources =====
declare module '*.jpg' {
    const src: import('astro/assets').ImageMetadata;
    export default src;
}
declare module '*.png' {
    const src: import('astro/assets').ImageMetadata;
    export default src;
}
declare module '*.svg' {
    const src: string;
    export default src;
}

// ===== style files =====
declare module '*.css' {
    const content: any;
    export default content;
}

// ===== content files =====
declare module '*.md' {
    const content: string;
    export default content;
}
declare module '*.mdx' {
    const content: any;
    export default content;
}

// ===== Astro components =====
declare module '*.astro' {
    import type { AstroComponent } from 'astro/runtime/server';
    const Component: (props: any) => AstroComponent;
    export default Component;
}

// ===== enviroment variables =====
// interface ImportMetaEnv {
//     // public env variables
//     readonly PUBLIC_SITE_URL: string;
//     readonly PUBLIC_GA_ID?: string;
// }

// interface ImportMeta {
//     readonly env: ImportMetaEnv;
// }
