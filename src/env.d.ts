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

// `astro/client` leaves `CustomImageProps` empty on purpose, for projects to
// extend. `<Image>` forwards unknown props straight to the rendered <img>, which
// is how `sizes` reaches the browser next to the `srcset` built from `widths`.
//
// This file is a global script (it has no top-level import/export), so the
// namespace is merged directly — wrapping this in `declare global` would be an
// error in a non-module file (TS2669).
declare namespace Astro {
    interface CustomImageProps {
        sizes?: string;
    }
}
