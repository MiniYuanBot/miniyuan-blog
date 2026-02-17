export const headerShortcuts = {
    // ========== Header ==========
    'header-scrolled': 'bg-card/92 border-border shadow-[0_4px_6px_-1px_hsla(0,0%,0%,0.1)]',
    'header-hidden': 'translate-y-[-100%]',

    'nav-container': 'flex-between h-16 mx-auto px-6 md:px-8 max-w-7xl',
    'nav-section': 'flex-1',
    'nav-left': 'flex-1',
    'nav-center': 'hidden md:flex flex-1 justify-center gap-1',
    'nav-right': 'hidden md:flex flex-1 justify-end gap-1',
    'nav-mobile': 'md:hidden flex justify-end gap-1',

    'site-title': 'm-0 text-xl font-semibold',
    'site-link': 'text-foreground no-underline transition-colors hover:text-muted-foreground',

    'mobile-menu-portal': 'md:hidden fixed left-4 right-4 flex-col rounded-xl shadow-xl transition-base overflow-hidden',
    'mobile-menu-container': 'p-2 bg-card border border-border/50 rounded-xl',
    'mobile-menu-divider': 'h-px bg-border/30 mx-2 my-1',
    'mobile-icon-grid': 'flex gap-2 px-1 pb-1',

    'mobile-menu-item-base': 'relative flex-center-spread rounded-[0.625rem] border border-transparent transition-base text-foreground hover:translate-x-1 hover:bg-gray-light',
    'mobile-menu-text': 'text-base font-medium text-foreground',
    'mobile-active-indicator': 'relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:content-[""] before:w-1 before:h-5 before:rounded-r-md before:bg-accent pl-4',

    'desktop-nav-item': 'flex-center no-underline px-3 py-2 min-w-11 min-h-11 rounded-md transition-colors text-foreground text-base font-medium hover:bg-gray-light',
    'desktop-nav-text': 'text-base font-medium text-foreground',
    'desktop-active-indicator': 'relative font-semibold text-accent after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:content-[""] after:w-1 after:h-1 after:rounded-full after:bg-accent',
}