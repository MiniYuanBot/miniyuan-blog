export const sharedShortcuts = {
    // ========== Arial Label ==========
    'sr-only': 'absolute w-1px h-1px p-0 -m-1px overflow-hidden whitespace-nowrap border-0 [clip:rect(0,0,0,0)]',

    // ========== Transitions ==========
    'transition-base': 'transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]',
    'transition-colors': 'transition-colors duration-200 ease-out',
    'transition-transform': 'transition-transform duration-200 ease-out',
    'transition-opacity': 'transition-opacity duration-200 ease-out',
}

export const iconShortcuts = {
    // ========== Icons ==========
    'icon-button-base': 'box-content size-5 text-foreground rounded-md border border-border/80 p-1.5 transition-colors hover:bg-gray-light',
    'icon-base': 'size-5 text-foreground',
}

export const headerShortcuts = {
    // ========== Header ==========
    'mobile-menu-item-base': 'relative flex-center-spread rounded-md border border-transparent transition-base text-foreground hover:translate-x-1 hover:bg-gray-light',
    'mobile-menu-text': 'text-base font-medium text-foreground',
    'mobile-active-indicator': 'relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:content-[""] before:w-1 before:h-5 before:rounded-r-md before:bg-accent pl-4',

    'desktop-nav-item': 'flex-center no-underline px-3 py-2 min-w-11 min-h-11 rounded-md transition-colors text-foreground text-base font-medium hover:bg-gray-light',
    'desktop-nav-text': 'text-base font-medium text-foreground',
    'desktop-active-indicator': 'relative font-semibold text-accent after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:content-[""] after:w-1 after:h-1 after:rounded-full after:bg-accent',
}