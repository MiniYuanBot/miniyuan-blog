export const blogShortcuts = {
    // ========== Layout & Containers ==========
    'blog-container': 'w-full grid grid-cols-1 gap-6 p-0',
    'blog-card': 'relative w-full overflow-hidden rounded-xl cursor-pointer',
    'blog-card-link': 'block no-underline text-inherit w-full',
    
    // ========== Image & Background ==========
    'blog-card-bg': 'absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out',
    'blog-card-bg-wrapper': 'absolute inset-0 w-full h-full overflow-hidden',
    'blog-card-overlay': 'absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300',
    
    // ========== Content Layout ==========
    'blog-card-content': 'relative z-10 flex flex-col justify-end h-full min-h-[320px] p-6 gap-3',
    'blog-card-header': 'flex-between gap-2 flex-wrap',
    'blog-card-footer': 'flex flex-col gap-2',
    
    // ========== Typography ==========
    'blog-card-title': 'text-xl font-bold text-white line-clamp-2 leading-tight transition-colors duration-300 group-hover:text-accent',
    'blog-card-excerpt': 'text-base text-white/80 line-clamp-2 leading-relaxed',
    'blog-card-author': 'text-sm font-semibold text-white',
    'blog-card-position': 'text-sm text-white/70 pl-2 border-l border-white/30',
    'blog-card-date': 'text-sm text-white/60 font-mono',
    
    // ========== Tags ==========
    'blog-card-tags': 'flex flex-wrap gap-2 mt-2',
    'blog-card-tag': 'text-sm px-3 py-1 rounded-full backdrop-blur-md text-white font-medium border border-border/10 transition-base bg-gray-light/50 hover:bg-gray-light/80',
    'blog-card-tag-more': 'text-sm px-3 py-1 rounded-full bg-gray-light/20 text-white/80',
    
    // ========== States & Variants ==========
    'blog-card-hover': 'hover:shadow-lg',
    
    // ========== No Image Variant ==========
    'blog-card-no-image': 'bg-card min-h-[280px] border border-border',
    'blog-card-no-image-content': 'p-6 flex flex-col h-full justify-between',
    'blog-card-no-image-title': 'text-xl font-bold text-card-foreground line-clamp-2',
    'blog-card-no-image-text': 'text-sm text-muted-foreground',
    'blog-card-no-image-tag': 'text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground border border-border hover:bg-accent transition-colors',
}