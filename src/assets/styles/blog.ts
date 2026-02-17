export const blogShortcuts = {
    // ========== Layout & Containers ==========
    'blog-card-wrapper': 'relative block w-full',
    'blog-card-link': 'block no-underline text-inherit w-full relative cursor-pointer',

    // ========== Pseudo-element Overlay ==========
    'blog-card-link-overlay': 'after:absolute after:inset-0 after:z-[1] after:content-[""] after:pointer-events-auto',
    'blog-card-content-layer': 'relative z-[2]',

    // ========== Image & Background ==========
    'blog-card-bg': 'absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out',
    'blog-card-bg-wrapper': 'absolute inset-0 w-full h-full overflow-hidden',
    'blog-card-overlay': 'absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 to-transparent transition-opacity duration-300',

    // ========== Content Layout ==========
    'blog-card-content': 'relative z-10 flex flex-col justify-end h-full min-h-[320px] p-6 pt-0 gap-3',
    'blog-card-header': 'flex-between gap-2 flex-wrap',
    'blog-card-footer': 'flex flex-col gap-2',

    // ========== Typography ==========
    'blog-card-title': 'text-xl font-bold text-foreground line-clamp-2 leading-tight transition-colors duration-300 group-hover:text-accent',
    'blog-card-excerpt': 'text-base text-foreground/80 line-clamp-2 leading-relaxed',
    'blog-card-author': 'text-sm font-semibold text-foreground',
    'blog-card-position': 'text-sm text-foreground/70 pl-2 border-l border-foreground/30',
    'blog-card-date': 'text-sm text-foreground/60 font-mono',

    // ========== Tags (Positioned Above Card Link) ==========
    'blog-card-tags': 'absolute top-0 left-0 right-0 z-10 flex flex-wrap gap-2 p-6 pointer-events-none',
    'blog-card-tag-link': 'pointer-events-auto relative z-[11]',
    'blog-card-tag-more': 'text-sm px-3 py-1 rounded-full bg-gray/15 text-foreground/80 pointer-events-auto hover:cursor-pointer',

    // ========== No Image Variant ==========
    // 'blog-card-no-image': 'bg-card min-h-[280px] border border-border',
    // 'blog-card-no-image-content': 'p-6 flex flex-col h-full justify-between',
    // 'blog-card-no-image-title': 'text-xl font-bold text-card-foreground line-clamp-2',
    // 'blog-card-no-image-text': 'text-sm text-muted-foreground',
    // 'blog-card-no-image-tag': 'text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground border border-border hover:bg-accent transition-colors',
}

// blogPostShortcuts.ts
export const blogPostShortcuts = {
    // ========== Layout & Containers ==========
    'blog-post-article': 'bg-background rounded-xl shadow-lg overflow-hidden',

    // ========== Hero Image ==========
    'blog-post-hero': 'relative w-full h-[300px] md:h-[400px] lg:h-[510px] overflow-hidden bg-muted',
    'blog-post-hero-image': 'w-full h-full object-cover transition-transform duration-500 hover:scale-105',

    // ========== Meta Info Layout ==========
    'blog-post-meta': 'flex flex-wrap items-center gap-4 text-muted-foreground',
    'blog-post-author': 'flex items-center gap-3 text-muted-foreground',

    // ========== Date Badge ==========
    'blog-post-last-updated-badge': 'px-2 py-1 bg-accent/10 text-accent rounded-md text-xs font-medium',

    // ========== Divider ==========
    'blog-post-divider': 'my-6 md:my-8 border-t border-border/50',
}
