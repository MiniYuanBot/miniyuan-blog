export const heroShortcuts = {
    // ========== Layout & Containers ==========
    'hero-container': 'bg-card mt-8 transition-colors',
    'hero-grid': 'grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 md:gap-10 items-start md:items-center',

    // ========== Component Parts ==========
    'hero-avatar-container': 'flex justify-center md:justify-start',
    'hero-avatar': 'w-[200px] h-[200px] md:w-[240px] md:h-[240px] rounded-full object-cover border-4 border-gray-light shadow-lg hover:cursor-pointer transition-base',
    'hero-content': 'flex flex-col text-center md:text-left',
    'hero-title': 'text-3xl md:text-4xl font-bold text-foreground mb-2',
    'hero-tagline': 'inline-block text-xl md:text-2xl font-bold bg-gradient-to-r from-accent via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4',
    'hero-text': 'text-base md:text-lg leading-relaxed mb-3 text-muted-foreground last:mb-0',

    // ========== States & Variants ==========
    'hero-avatar-hover': 'hover:scale-105',
}