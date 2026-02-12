/// <reference types="astro/client" />

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

declare module '*.css' {
    const content: string;
    export default content;
}

interface ImportMetaEnv {
    readonly PUBLIC_SITE_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}